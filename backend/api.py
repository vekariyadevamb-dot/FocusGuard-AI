"""
FastAPI Server & WebSocket Streaming for FocusGuard AI
Connects the Python Computer Vision Engine to React and Tauri frontends.
"""

import asyncio
import io
import csv
import json
import time
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from .models import SettingsModel, CalibrationModel, CreateSessionRequest, UpdateSessionRequest
from .database import (
    init_db, get_settings, update_settings, get_calibration, save_calibration,
    create_session, get_session, update_session, record_detection_event,
    list_sessions, delete_session, clear_all_history, get_analytics_summary,
    get_session_events, get_goals_summary
)
from .vision.pipeline import VisionPipeline


# Global application state
class AppState:
    def __init__(self):
        self.pipeline: Optional[VisionPipeline] = None
        self.active_session: Optional[Dict[str, Any]] = None
        self.session_start_monotonic: Optional[float] = None
        self.is_paused: bool = False
        self.is_break: bool = False
        self.pause_start_monotonic: Optional[float] = None
        self.total_paused_sec: float = 0.0
        self.total_break_sec: float = 0.0
        self.connected_websockets: List[WebSocket] = []
        self.streaming_task: Optional[asyncio.Task] = None
        self.show_preview: bool = True
        self.show_landmarks: bool = True


state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite DB and Vision Pipeline
    await init_db()
    settings = await get_settings()
    calibration = await get_calibration()

    state.show_preview = bool(settings.get("show_preview", 1))
    state.show_landmarks = bool(settings.get("show_landmarks", 1))

    cam_idx = settings.get("camera_index", 0)
    state.pipeline = VisionPipeline(camera_index=cam_idx)
    try:
        state.pipeline.initialize()
        state.pipeline.set_calibration(calibration)
        state.pipeline.attention.set_thresholds(
            alert_threshold_sec=settings.get("alert_threshold_sec", 5.0),
            alert_cooldown_sec=settings.get("alert_cooldown_sec", 6.0)
        )
        state.pipeline.attention.set_mode(settings.get("active_mode", "coding"))
    except Exception as e:
        print(f"Vision pipeline initialization note: {e}")

    # Launch background vision streaming loop
    state.streaming_task = asyncio.create_task(vision_broadcast_loop())

    yield

    # Shutdown: Clean up background tasks and camera hardware
    if state.streaming_task:
        state.streaming_task.cancel()
    if state.pipeline:
        state.pipeline.close()


ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8765",
    "http://127.0.0.1:8765",
    "tauri://localhost",
    "https://tauri.localhost",
    "http://test",
}

SESSION_ID_REGEX = r"^[a-zA-Z0-9_\-]+$"

app = FastAPI(title="FocusGuard AI Engine", version="1.0.0", lifespan=lifespan)

# Defense-in-depth: Protect against DNS rebinding & malicious Host headers
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "[::1]",
        "tauri.localhost",
        "test",
        "testserver",
    ]
)

# Strict CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Enforce defensive HTTP security headers to protect against sniffing, framing, and unauthorized caching."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(), geolocation=()"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Prevent internal server tracebacks and environment info from leaking to API callers."""
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )


async def vision_broadcast_loop():
    """Continuously processes frames and broadcasts telemetry to all connected WebSockets."""
    while True:
        try:
            if state.pipeline and len(state.connected_websockets) > 0:
                frame_data = state.pipeline.process_frame(
                    show_preview=state.show_preview,
                    show_landmarks=state.show_landmarks,
                    is_paused=state.is_paused,
                    is_break=state.is_break
                )

                # If an active study session exists, check for detection events
                if state.active_session and frame_data.get("success"):
                    att = frame_data.get("attention", {})
                    # Record completed attention-away event to DB
                    if att.get("completed_event"):
                        ev = att["completed_event"]
                        await record_detection_event({
                            "session_id": state.active_session["id"],
                            "event_type": ev["event_type"],
                            "duration_sec": ev["duration_sec"],
                            "alert_triggered": ev["alert_triggered"],
                            "measurements": {"pose": frame_data.get("pose")}
                        })

                    # If alert triggered, record alert event
                    if att.get("trigger_alert"):
                        await record_detection_event({
                            "session_id": state.active_session["id"],
                            "event_type": "ALERT_TRIGGERED",
                            "duration_sec": att.get("away_duration_sec", 0.0),
                            "alert_triggered": True,
                            "measurements": {"reason": att.get("alert_reason")}
                        })

                # Compute session timing if active
                session_payload = None
                if state.active_session:
                    now_mono = time.monotonic()
                    elapsed_total = now_mono - state.session_start_monotonic
                    active_duration = max(0.0, elapsed_total - state.total_paused_sec - state.total_break_sec)
                    planned = state.active_session.get("planned_duration_sec", 1500)
                    remaining = max(0.0, planned - active_duration)

                    session_payload = {
                        "id": state.active_session["id"],
                        "title": state.active_session["title"],
                        "subject": state.active_session["subject"],
                        "mode": state.active_session["mode"],
                        "planned_duration_sec": planned,
                        "active_duration_sec": round(active_duration),
                        "remaining_duration_sec": round(remaining),
                        "is_paused": state.is_paused,
                        "is_break": state.is_break,
                        "status": "PAUSED" if state.is_paused else ("BREAK" if state.is_break else "IN_PROGRESS")
                    }

                # Construct broadcast message
                message = {
                    "type": "TELEMETRY",
                    "timestamp": time.time(),
                    "frame": frame_data,
                    "session": session_payload
                }
                msg_str = json.dumps(message)

                # Send to all connected sockets
                disconnected = []
                for ws in state.connected_websockets:
                    try:
                        await ws.send_text(msg_str)
                    except Exception:
                        disconnected.append(ws)

                for ws in disconnected:
                    if ws in state.connected_websockets:
                        state.connected_websockets.remove(ws)

            # Limit inference rate to ~15-20 FPS for low CPU overhead
            await asyncio.sleep(0.066)

        except asyncio.CancelledError:
            break
        except Exception as e:
            await asyncio.sleep(0.1)


# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    origin = websocket.headers.get("origin")
    # Strictly enforce origin whitelist to prevent Cross-Site WebSocket Hijacking (CSWSH)
    # and unauthorized background process eavesdropping of webcam frames.
    if not origin or origin not in ALLOWED_ORIGINS:
        await websocket.close(code=1008)  # Policy violation
        return

    await websocket.accept()
    state.connected_websockets.append(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            try:
                cmd = json.loads(text)
                action = cmd.get("action")
                payload = cmd.get("payload", {})

                if action == "start_session":
                    # Start session
                    sess = await create_session(payload)
                    state.active_session = sess
                    state.session_start_monotonic = time.monotonic()
                    state.is_paused = False
                    state.is_break = False
                    state.total_paused_sec = 0.0
                    state.total_break_sec = 0.0
                    if state.pipeline:
                        state.pipeline.attention.reset_session_counters()
                        state.pipeline.eye_mouth.reset()
                        state.pipeline.attention.set_mode(sess.get("mode", "coding"))

                    await websocket.send_text(json.dumps({"type": "SESSION_STARTED", "session": sess}))

                elif action == "pause_session":
                    if state.active_session and not state.is_paused:
                        state.is_paused = True
                        state.pause_start_monotonic = time.monotonic()
                        await websocket.send_text(json.dumps({"type": "SESSION_PAUSED"}))

                elif action == "resume_session":
                    if state.active_session and state.is_paused:
                        state.is_paused = False
                        if state.pause_start_monotonic:
                            state.total_paused_sec += time.monotonic() - state.pause_start_monotonic
                            state.pause_start_monotonic = None
                        await websocket.send_text(json.dumps({"type": "SESSION_RESUMED"}))

                elif action == "start_break":
                    if state.active_session and not state.is_break:
                        state.is_break = True
                        state.pause_start_monotonic = time.monotonic()
                        await websocket.send_text(json.dumps({"type": "BREAK_STARTED"}))

                elif action == "end_break":
                    if state.active_session and state.is_break:
                        state.is_break = False
                        if state.pause_start_monotonic:
                            state.total_break_sec += time.monotonic() - state.pause_start_monotonic
                            state.pause_start_monotonic = None
                        await websocket.send_text(json.dumps({"type": "BREAK_ENDED"}))

                elif action == "stop_session" or action == "complete_session":
                    if state.active_session:
                        now_mono = time.monotonic()
                        elapsed_total = now_mono - state.session_start_monotonic
                        active_duration = max(0.0, elapsed_total - state.total_paused_sec - state.total_break_sec)
                        
                        att = state.pipeline.attention if state.pipeline else None
                        attentive_sec = round(att.attentive_seconds) if att else 0
                        away_sec = round(att.away_seconds) if att else 0
                        eligible = attentive_sec + away_sec
                        ratio = round((attentive_sec / eligible * 100.0), 1) if eligible >= 5 else 0.0

                        eye = state.pipeline.eye_mouth if state.pipeline else None
                        blink_count = eye.blink_count if eye else 0
                        prolonged_count = eye.prolonged_closure_count if eye else 0
                        yawn_count = eye.yawn_count if eye else 0
                        away_events = att._away_event_count if att else 0

                        status_val = "COMPLETED" if action == "complete_session" else "STOPPED"
                        updated = await update_session(state.active_session["id"], {
                            "active_duration_sec": round(active_duration),
                            "paused_duration_sec": round(state.total_paused_sec),
                            "break_duration_sec": round(state.total_break_sec),
                            "eligible_monitored_sec": eligible,
                            "attentive_sec": attentive_sec,
                            "away_sec": away_sec,
                            "attention_ratio": ratio,
                            "blink_count": blink_count,
                            "prolonged_closure_count": prolonged_count,
                            "yawn_count": yawn_count,
                            "away_event_count": away_events,
                            "status": status_val,
                            "end_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        })
                        state.active_session = None
                        await websocket.send_text(json.dumps({"type": "SESSION_FINISHED", "session": updated}))

                elif action == "start_calibration":
                    if state.pipeline:
                        state.pipeline.start_calibration()
                        await websocket.send_text(json.dumps({"type": "CALIBRATION_STARTED"}))

                elif action == "trigger_test_alert":
                    await websocket.send_text(json.dumps({
                        "type": "TEST_ALERT",
                        "reason": "Test alert requested by user"
                    }))

            except Exception as e:
                print(f"Error handling WS message: {e}")

    except WebSocketDisconnect:
        if websocket in state.connected_websockets:
            state.connected_websockets.remove(websocket)


# REST Endpoints
@app.get("/api/status")
async def get_system_status():
    cam_healthy = state.pipeline.camera_manager.is_healthy() if state.pipeline else False
    fps = state.pipeline.camera_manager.current_fps if state.pipeline else 0.0
    return {
        "status": "online",
        "camera_healthy": cam_healthy,
        "camera_fps": round(fps, 1),
        "active_session": state.active_session,
        "is_paused": state.is_paused,
        "is_break": state.is_break
    }


@app.get("/api/settings")
async def read_settings():
    return await get_settings()


@app.post("/api/settings")
async def modify_settings(settings: SettingsModel):
    updated = await update_settings(settings.model_dump(exclude_unset=True))
    if "show_preview" in updated:
        state.show_preview = bool(updated["show_preview"])
    if "show_landmarks" in updated:
        state.show_landmarks = bool(updated["show_landmarks"])
    if state.pipeline:
        state.pipeline.attention.set_thresholds(
            alert_threshold_sec=updated.get("alert_threshold_sec", 5.0),
            alert_cooldown_sec=updated.get("alert_cooldown_sec", 6.0)
        )
        state.pipeline.attention.set_mode(updated.get("active_mode", "coding"))
    return updated


@app.get("/api/calibration")
async def read_calibration():
    return await get_calibration()


@app.post("/api/calibration")
async def save_calib(calibration: CalibrationModel):
    saved = await save_calibration(calibration.model_dump())
    if state.pipeline:
        state.pipeline.set_calibration(saved)
    return saved


@app.get("/api/sessions")
async def get_sessions(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    subject: Optional[str] = Query(None, max_length=100),
    mode: Optional[str] = Query(None, pattern=r"^(coding|reading|writing|lecture|custom)$")
):
    return await list_sessions(limit=limit, offset=offset, subject=subject, mode=mode)


@app.post("/api/sessions")
async def start_new_session(req: CreateSessionRequest):
    sess = await create_session(req.model_dump())
    state.active_session = sess
    state.session_start_monotonic = time.monotonic()
    state.is_paused = False
    state.is_break = False
    state.total_paused_sec = 0.0
    state.total_break_sec = 0.0
    if state.pipeline:
        state.pipeline.attention.reset_session_counters()
        state.pipeline.eye_mouth.reset()
        state.pipeline.attention.set_mode(req.mode)
    return sess


@app.get("/api/sessions/{session_id}")
async def get_session_detail(
    session_id: str = Path(..., min_length=1, max_length=64, pattern=SESSION_ID_REGEX)
):
    sess = await get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    events = await get_session_events(session_id)
    return {"session": sess, "events": events}


@app.delete("/api/sessions/{session_id}")
async def remove_session(
    session_id: str = Path(..., min_length=1, max_length=64, pattern=SESSION_ID_REGEX)
):
    ok = await delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}


@app.delete("/api/history")
async def remove_all_history():
    await clear_all_history()
    return {"success": True}


@app.get("/api/goals")
async def fetch_goals():
    return await get_goals_summary()


@app.get("/api/analytics")
async def fetch_analytics():
    summary = await get_analytics_summary()
    goals = await get_goals_summary()
    summary["goals"] = goals
    return summary


def _sanitize_csv_cell(val: Any) -> Any:
    """Neutralize formula injection (CWE-1236) for spreadsheet exports."""
    if isinstance(val, str):
        stripped = val.lstrip()
        if stripped.startswith(('=', '+', '-', '@', '\t', '\r', '%')):
            return f"'{val}"
    return val


@app.get("/api/export/csv")
async def export_sessions_csv():
    sessions = await list_sessions(limit=500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Session ID", "Title", "Subject", "Mode", "Planned Duration (min)",
        "Active Duration (min)", "Attention Ratio (%)", "Blinks",
        "Prolonged Closures", "Yawns", "Away Events", "Status", "Start Time"
    ])
    for s in sessions:
        writer.writerow([
            _sanitize_csv_cell(s.get("id")),
            _sanitize_csv_cell(s.get("title")),
            _sanitize_csv_cell(s.get("subject")),
            _sanitize_csv_cell(s.get("mode")),
            round((s.get("planned_duration_sec", 0) / 60.0), 1),
            round((s.get("active_duration_sec", 0) / 60.0), 1),
            s.get("attention_ratio", 0.0),
            s.get("blink_count", 0),
            s.get("prolonged_closure_count", 0),
            s.get("yawn_count", 0),
            s.get("away_event_count", 0),
            _sanitize_csv_cell(s.get("status")),
            _sanitize_csv_cell(s.get("start_time"))
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=focusguard_sessions.csv"}
    )


# System Tray & Background Integration endpoints
@app.post("/api/control/pause")
async def tray_pause():
    if state.active_session and not state.is_paused:
        state.is_paused = True
        state.pause_start_monotonic = time.monotonic()
        return {"status": "paused"}
    return {"status": "noop"}


@app.post("/api/control/resume")
async def tray_resume():
    if state.active_session and state.is_paused:
        state.is_paused = False
        if state.pause_start_monotonic:
            state.total_paused_sec += time.monotonic() - state.pause_start_monotonic
            state.pause_start_monotonic = None
        return {"status": "resumed"}
    return {"status": "noop"}
