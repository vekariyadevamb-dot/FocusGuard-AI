"""
SQLite Database Layer for FocusGuard AI
Local-first, privacy-respecting storage for sessions, events, goals, and settings.
"""

import aiosqlite
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "focusguard.db")


def get_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def secure_db_permissions(db_path: str = DB_PATH) -> None:
    """Enforce strict POSIX permissions (0o700 dir, 0o600 file) to protect sensitive telemetry & biometric records."""
    try:
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if os.path.exists(db_dir):
            os.chmod(db_dir, 0o700)
        if os.path.exists(db_path):
            os.chmod(db_path, 0o600)
    except OSError:
        pass


async def init_db(db_path: str = DB_PATH) -> None:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    secure_db_permissions(db_path)
    async with aiosqlite.connect(db_path) as db:
        await db.execute("PRAGMA journal_mode = WAL")
        await db.execute("PRAGMA foreign_keys = ON")

        # Schema migrations table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)

        # Settings table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                ui_theme TEXT DEFAULT 'dark',
                sound_enabled INTEGER DEFAULT 1,
                sound_volume REAL DEFAULT 0.8,
                alert_sound TEXT DEFAULT 'chime',
                alert_threshold_sec REAL DEFAULT 5.0,
                alert_cooldown_sec REAL DEFAULT 6.0,
                sensitivity TEXT DEFAULT 'medium',
                active_mode TEXT DEFAULT 'coding',
                camera_index INTEGER DEFAULT 0,
                inference_fps INTEGER DEFAULT 15,
                show_preview INTEGER DEFAULT 1,
                show_landmarks INTEGER DEFAULT 1,
                prolonged_closure_sec REAL DEFAULT 2.0,
                yawn_threshold_sec REAL DEFAULT 1.5,
                smart_breaks_enabled INTEGER DEFAULT 1,
                max_uninterrupted_minutes INTEGER DEFAULT 50,
                daily_goal_minutes INTEGER DEFAULT 180,
                weekly_goal_minutes INTEGER DEFAULT 900,
                updated_at TEXT NOT NULL
            )
        """)

        # Calibration table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS calibration (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                baseline_yaw REAL DEFAULT 0.0,
                baseline_pitch REAL DEFAULT 0.0,
                baseline_roll REAL DEFAULT 0.0,
                baseline_ear REAL DEFAULT 0.28,
                yaw_threshold_deg REAL DEFAULT 20.0,
                pitch_threshold_deg REAL DEFAULT 18.0,
                roll_threshold_deg REAL DEFAULT 25.0,
                calibrated_at TEXT
            )
        """)

        # Sessions table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                mode TEXT NOT NULL,
                planned_duration_sec INTEGER NOT NULL,
                active_duration_sec INTEGER DEFAULT 0,
                paused_duration_sec INTEGER DEFAULT 0,
                break_duration_sec INTEGER DEFAULT 0,
                eligible_monitored_sec INTEGER DEFAULT 0,
                attentive_sec INTEGER DEFAULT 0,
                away_sec INTEGER DEFAULT 0,
                attention_ratio REAL DEFAULT 0.0,
                blink_count INTEGER DEFAULT 0,
                prolonged_closure_count INTEGER DEFAULT 0,
                yawn_count INTEGER DEFAULT 0,
                away_event_count INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                notes TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Detection events table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS detection_events (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_sec REAL DEFAULT 0.0,
                measurements_json TEXT,
                alert_triggered INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
            )
        """)

        # Goals table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS goals (
                id TEXT PRIMARY KEY,
                goal_type TEXT NOT NULL,
                target_value REAL NOT NULL,
                current_value REAL DEFAULT 0.0,
                period TEXT NOT NULL,
                date_str TEXT NOT NULL,
                is_completed INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        # Indexes for fast querying
        await db.execute("CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions (start_time)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions (subject)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON detection_events (session_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON detection_events (event_type)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_goals_date ON goals (date_str)")

        # Ensure default settings row exists
        now = get_now_iso()
        await db.execute("""
            INSERT OR IGNORE INTO settings (id, updated_at) VALUES (1, ?)
        """, (now,))

        await db.execute("""
            INSERT OR IGNORE INTO calibration (id, calibrated_at) VALUES (1, ?)
        """, (now,))

        await db.commit()
    secure_db_permissions(db_path)


async def get_settings(db_path: str = DB_PATH) -> Dict[str, Any]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM settings WHERE id = 1") as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return {}


async def update_settings(updates: Dict[str, Any], db_path: str = DB_PATH) -> Dict[str, Any]:
    allowed_keys = {
        'ui_theme', 'sound_enabled', 'sound_volume', 'alert_sound',
        'alert_threshold_sec', 'alert_cooldown_sec', 'sensitivity',
        'active_mode', 'camera_index', 'inference_fps', 'show_preview',
        'show_landmarks', 'prolonged_closure_sec', 'yawn_threshold_sec',
        'smart_breaks_enabled', 'max_uninterrupted_minutes',
        'daily_goal_minutes', 'weekly_goal_minutes'
    }
    filtered = {k: v for k, v in updates.items() if k in allowed_keys}
    if not filtered:
        return await get_settings(db_path)

    clauses = [f"{k} = ?" for k in filtered.keys()]
    values = list(filtered.values())
    values.append(get_now_iso())
    sql = f"UPDATE settings SET {', '.join(clauses)}, updated_at = ? WHERE id = 1"

    async with aiosqlite.connect(db_path) as db:
        await db.execute(sql, values)
        await db.commit()

    return await get_settings(db_path)


async def get_calibration(db_path: str = DB_PATH) -> Dict[str, Any]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM calibration WHERE id = 1") as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else {}


async def save_calibration(baseline: Dict[str, float], db_path: str = DB_PATH) -> Dict[str, Any]:
    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
            UPDATE calibration SET
                baseline_yaw = ?,
                baseline_pitch = ?,
                baseline_roll = ?,
                baseline_ear = ?,
                yaw_threshold_deg = ?,
                pitch_threshold_deg = ?,
                roll_threshold_deg = ?,
                calibrated_at = ?
            WHERE id = 1
        """, (
            baseline.get('baseline_yaw', 0.0),
            baseline.get('baseline_pitch', 0.0),
            baseline.get('baseline_roll', 0.0),
            baseline.get('baseline_ear', 0.28),
            baseline.get('yaw_threshold_deg', 20.0),
            baseline.get('pitch_threshold_deg', 18.0),
            baseline.get('roll_threshold_deg', 25.0),
            get_now_iso()
        ))
        await db.commit()
    return await get_calibration(db_path)


# Session Management CRUD
async def create_session(data: Dict[str, Any], db_path: str = DB_PATH) -> Dict[str, Any]:
    session_id = data.get("id") or str(uuid.uuid4())
    now = get_now_iso()
    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
            INSERT INTO sessions (
                id, title, subject, mode, planned_duration_sec,
                status, start_time, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            data.get("title", "Study Session"),
            data.get("subject", "General Study"),
            data.get("mode", "coding"),
            data.get("planned_duration_sec", 1500),
            "IN_PROGRESS",
            now,
            now
        ))
        await db.commit()
    return await get_session(session_id, db_path)


async def get_session(session_id: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None


async def update_session(session_id: str, updates: Dict[str, Any], db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    allowed = {
        'active_duration_sec', 'paused_duration_sec', 'break_duration_sec',
        'eligible_monitored_sec', 'attentive_sec', 'away_sec',
        'attention_ratio', 'blink_count', 'prolonged_closure_count',
        'yawn_count', 'away_event_count', 'status', 'end_time', 'notes'
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return await get_session(session_id, db_path)

    clauses = [f"{k} = ?" for k in filtered.keys()]
    values = list(filtered.values())
    values.append(session_id)
    sql = f"UPDATE sessions SET {', '.join(clauses)} WHERE id = ?"

    async with aiosqlite.connect(db_path) as db:
        await db.execute(sql, values)
        await db.commit()

    return await get_session(session_id, db_path)


async def record_detection_event(event: Dict[str, Any], db_path: str = DB_PATH) -> str:
    event_id = event.get("id") or str(uuid.uuid4())
    now = get_now_iso()
    measurements = event.get("measurements", {})
    measurements_json = json.dumps(measurements) if isinstance(measurements, dict) else str(measurements)

    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
            INSERT INTO detection_events (
                id, session_id, event_type, start_time, end_time,
                duration_sec, measurements_json, alert_triggered, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            event.get("session_id"),
            event.get("event_type"),
            event.get("start_time", now),
            event.get("end_time"),
            event.get("duration_sec", 0.0),
            measurements_json,
            1 if event.get("alert_triggered") else 0,
            now
        ))
        await db.commit()
    return event_id


async def get_session_events(session_id: str, db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM detection_events WHERE session_id = ? ORDER BY start_time ASC",
            (session_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            events = []
            for r in rows:
                item = dict(r)
                try:
                    item["measurements"] = json.loads(item["measurements_json"]) if item["measurements_json"] else {}
                except Exception:
                    item["measurements"] = {}
                events.append(item)
            return events


async def list_sessions(
    limit: int = 50,
    offset: int = 0,
    subject: Optional[str] = None,
    mode: Optional[str] = None,
    db_path: str = DB_PATH
) -> List[Dict[str, Any]]:
    # Clamp limit and offset to safe bounds against DoS
    safe_limit = max(1, min(limit, 200))
    safe_offset = max(0, offset)

    query = "SELECT * FROM sessions WHERE 1=1"
    params = []
    if subject:
        query += " AND subject = ?"
        params.append(subject)
    if mode:
        query += " AND mode = ?"
        params.append(mode)
    query += " ORDER BY start_time DESC LIMIT ? OFFSET ?"
    params.extend([safe_limit, safe_offset])

    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def delete_session(session_id: str, db_path: str = DB_PATH) -> bool:
    async with aiosqlite.connect(db_path) as db:
        await db.execute("DELETE FROM detection_events WHERE session_id = ?", (session_id,))
        cursor = await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()
        return cursor.rowcount > 0


async def clear_all_history(db_path: str = DB_PATH) -> None:
    async with aiosqlite.connect(db_path) as db:
        await db.execute("DELETE FROM detection_events")
        await db.execute("DELETE FROM sessions")
        await db.execute("DELETE FROM goals")
        await db.commit()


# Analytics Queries
async def get_analytics_summary(db_path: str = DB_PATH) -> Dict[str, Any]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT
                COUNT(*) as total_sessions,
                COALESCE(SUM(active_duration_sec), 0) as total_active_sec,
                COALESCE(SUM(eligible_monitored_sec), 0) as total_monitored_sec,
                COALESCE(SUM(attentive_sec), 0) as total_attentive_sec,
                COALESCE(SUM(away_sec), 0) as total_away_sec,
                COALESCE(SUM(blink_count), 0) as total_blinks,
                COALESCE(SUM(prolonged_closure_count), 0) as total_prolonged_closures,
                COALESCE(SUM(yawn_count), 0) as total_yawns,
                COALESCE(SUM(away_event_count), 0) as total_away_events,
                AVG(CASE WHEN eligible_monitored_sec >= 30 THEN attention_ratio ELSE NULL END) as avg_attention_ratio
            FROM sessions
            WHERE status = 'COMPLETED'
        """) as cursor:
            row = await cursor.fetchone()
            data = dict(row) if row else {}

        # Daily breakdown for past 7 days
        async with db.execute("""
            SELECT
                SUBSTR(start_time, 1, 10) as day_date,
                COUNT(*) as sessions_count,
                COALESCE(SUM(active_duration_sec), 0) as study_sec,
                AVG(CASE WHEN eligible_monitored_sec >= 30 THEN attention_ratio ELSE NULL END) as day_attention_ratio
            FROM sessions
            WHERE status = 'COMPLETED'
            GROUP BY day_date
            ORDER BY day_date DESC
            LIMIT 7
        """) as cursor:
            daily_rows = await cursor.fetchall()
            data["daily"] = [dict(r) for r in daily_rows]

        # Subject breakdown
        async with db.execute("""
            SELECT
                subject,
                COUNT(*) as sessions_count,
                COALESCE(SUM(active_duration_sec), 0) as total_sec,
                AVG(CASE WHEN eligible_monitored_sec >= 30 THEN attention_ratio ELSE NULL END) as avg_ratio
            FROM sessions
            WHERE status = 'COMPLETED'
            GROUP BY subject
            ORDER BY total_sec DESC
        """) as cursor:
            subject_rows = await cursor.fetchall()
            data["subjects"] = [dict(r) for r in subject_rows]

        return data


async def get_goals_summary(db_path: str = DB_PATH) -> Dict[str, Any]:
    settings = await get_settings(db_path)
    daily_target_min = settings.get("daily_goal_minutes", 180)
    weekly_target_min = settings.get("weekly_goal_minutes", 900)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async with aiosqlite.connect(db_path) as db:
        # Today's active study time
        async with db.execute("""
            SELECT COALESCE(SUM(active_duration_sec), 0) as today_sec, COUNT(*) as today_sessions
            FROM sessions
            WHERE status = 'COMPLETED' AND SUBSTR(start_time, 1, 10) = ?
        """, (today_str,)) as cursor:
            row = await cursor.fetchone()
            today_sec = row[0] if row else 0
            today_sessions = row[1] if row else 0

        # Past 7 days active study time
        async with db.execute("""
            SELECT COALESCE(SUM(active_duration_sec), 0) as weekly_sec, COUNT(*) as weekly_sessions
            FROM sessions
            WHERE status = 'COMPLETED' AND start_time >= datetime('now', '-7 days')
        """) as cursor:
            row = await cursor.fetchone()
            weekly_sec = row[0] if row else 0
            weekly_sessions = row[1] if row else 0

        # Calculate streak: consecutive unique days with at least 1 completed session
        async with db.execute("""
            SELECT DISTINCT SUBSTR(start_time, 1, 10) as study_day
            FROM sessions
            WHERE status = 'COMPLETED'
            ORDER BY study_day DESC
        """) as cursor:
            rows = await cursor.fetchall()
            study_days = [r[0] for r in rows]

        streak_days = 0
        from datetime import timedelta
        check_date = datetime.now(timezone.utc).date()
        # If today has study session or yesterday had study session, start counting
        if study_days and (today_str in study_days or (check_date - timedelta(days=1)).strftime("%Y-%m-%d") in study_days):
            current = check_date if today_str in study_days else (check_date - timedelta(days=1))
            while current.strftime("%Y-%m-%d") in study_days:
                streak_days += 1
                current -= timedelta(days=1)

    today_min = round(today_sec / 60)
    weekly_min = round(weekly_sec / 60)

    return {
        "daily_target_minutes": daily_target_min,
        "daily_current_minutes": today_min,
        "daily_progress_percent": round(min(100.0, (today_min / max(1, daily_target_min)) * 100.0), 1),
        "daily_completed": today_min >= daily_target_min,
        "today_sessions": today_sessions,
        "weekly_target_minutes": weekly_target_min,
        "weekly_current_minutes": weekly_min,
        "weekly_progress_percent": round(min(100.0, (weekly_min / max(1, weekly_target_min)) * 100.0), 1),
        "weekly_completed": weekly_min >= weekly_target_min,
        "weekly_sessions": weekly_sessions,
        "streak_days": streak_days
    }

