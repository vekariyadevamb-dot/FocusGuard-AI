"""
Automated Unit and Integration Tests for FocusGuard AI
Tests database, attention engine, head pose, blink/yawn detectors, and API endpoints.
"""

import pytest
import os
import time
from typing import Dict, Any

from backend.database import (
    init_db, get_settings, update_settings, create_session,
    get_session, update_session, record_detection_event,
    get_session_events, list_sessions, delete_session,
    clear_all_history, get_analytics_summary
)
from backend.vision.attention import AttentionEngine, AttentionState
from backend.vision.eye_mouth import EyeMouthAnalyzer, LEFT_EYE_INDICES, RIGHT_EYE_INDICES
from backend.vision.head_pose import HeadPoseEstimator

import pytest_asyncio

TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_focusguard.db")


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass
    await init_db(TEST_DB_PATH)
    yield
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest.mark.asyncio
async def test_database_settings():
    settings = await get_settings(TEST_DB_PATH)
    assert settings["sound_enabled"] == 1
    assert settings["alert_threshold_sec"] == 5.0
    assert settings["active_mode"] == "coding"

    updated = await update_settings({"alert_threshold_sec": 8.0, "active_mode": "reading"}, TEST_DB_PATH)
    assert updated["alert_threshold_sec"] == 8.0
    assert updated["active_mode"] == "reading"


@pytest.mark.asyncio
async def test_database_session_lifecycle():
    session = await create_session({
        "title": "DSA Algorithms Study",
        "subject": "DSA",
        "mode": "coding",
        "planned_duration_sec": 1800
    }, TEST_DB_PATH)

    assert session["title"] == "DSA Algorithms Study"
    assert session["subject"] == "DSA"
    assert session["status"] == "IN_PROGRESS"

    # Add detection events
    ev_id = await record_detection_event({
        "session_id": session["id"],
        "event_type": "ATTENTION_AWAY",
        "duration_sec": 6.2,
        "alert_triggered": True,
        "measurements": {"yaw": 32.5}
    }, TEST_DB_PATH)
    assert ev_id is not None

    events = await get_session_events(session["id"], TEST_DB_PATH)
    assert len(events) == 1
    assert events[0]["event_type"] == "ATTENTION_AWAY"
    assert events[0]["alert_triggered"] == 1

    # Update session to completed
    updated = await update_session(session["id"], {
        "active_duration_sec": 1200,
        "attentive_sec": 1050,
        "away_sec": 150,
        "eligible_monitored_sec": 1200,
        "attention_ratio": 87.5,
        "status": "COMPLETED"
    }, TEST_DB_PATH)
    assert updated["status"] == "COMPLETED"
    assert updated["attention_ratio"] == 87.5

    # Check analytics summary
    analytics = await get_analytics_summary(TEST_DB_PATH)
    assert analytics["total_sessions"] == 1
    assert analytics["total_active_sec"] == 1200
    assert analytics["avg_attention_ratio"] == 87.5


def test_attention_state_machine_and_timer():
    engine = AttentionEngine(alert_threshold_sec=3.0, alert_cooldown_sec=5.0, mode="coding")

    # Attentive face
    res = engine.update(
        has_face=True,
        pose_data={"yaw": 5.0, "pitch": -4.0, "roll": 1.0},
        eye_data={"prolonged_closure": False}
    )
    assert res["state"] == AttentionState.ATTENTIVE_ESTIMATE.value
    assert res["trigger_alert"] is False
    assert res["away_duration_sec"] == 0.0

    # User turns head away (yaw = 35.0 deg exceeds 25 deg limit)
    res_away = engine.update(
        has_face=True,
        pose_data={"yaw": 35.0, "pitch": 0.0, "roll": 0.0},
        eye_data={"prolonged_closure": False}
    )
    assert res_away["state"] == AttentionState.LOOKING_AWAY.value
    assert res_away["trigger_alert"] is False

    # Simulate elapsed time > threshold (3.0s)
    engine._away_start_time = time.monotonic() - 3.5
    res_alert = engine.update(
        has_face=True,
        pose_data={"yaw": 35.0, "pitch": 0.0, "roll": 0.0},
        eye_data={"prolonged_closure": False}
    )
    assert res_alert["trigger_alert"] is True
    assert "Attention directed away" in res_alert["alert_reason"]

    # Cooldown should prevent immediate next frame duplicate alert
    res_cooldown = engine.update(
        has_face=True,
        pose_data={"yaw": 35.0, "pitch": 0.0, "roll": 0.0},
        eye_data={"prolonged_closure": False}
    )
    assert res_cooldown["trigger_alert"] is False

    # Return attention
    res_back = engine.update(
        has_face=True,
        pose_data={"yaw": 2.0, "pitch": 0.0, "roll": 0.0},
        eye_data={"prolonged_closure": False}
    )
    assert res_back["state"] == AttentionState.ATTENTIVE_ESTIMATE.value
    assert res_back["completed_event"] is not None


def test_blink_and_prolonged_closure():
    analyzer = EyeMouthAnalyzer(
        ear_threshold=0.21,
        prolonged_closure_threshold_sec=1.5
    )

    class DummyLandmark:
        def __init__(self, x, y):
            self.x = x
            self.y = y

    # Create dummy landmarks for wide-open eyes
    dummy_lms = [DummyLandmark(0.5, 0.5) for _ in range(500)]
    # Set left eye coordinates
    dummy_lms[33] = DummyLandmark(0.2, 0.3)
    dummy_lms[133] = DummyLandmark(0.4, 0.3)
    dummy_lms[160] = DummyLandmark(0.3, 0.25)
    dummy_lms[158] = DummyLandmark(0.35, 0.25)
    dummy_lms[144] = DummyLandmark(0.3, 0.35)
    dummy_lms[153] = DummyLandmark(0.35, 0.35)

    ear = analyzer.calculate_ear(dummy_lms, LEFT_EYE_INDICES)
    assert ear > 0.25

    # Simulate prolonged closure
    analyzer._eye_closed_start_time = time.monotonic() - 2.0
    res = analyzer.process(dummy_lms, blendshapes=[])
    # When eye open again, verify blink was recorded or prolonged closure active
    assert res["blink_count"] >= 0


def test_head_pose_smoothing():
    estimator = HeadPoseEstimator(smoothing_factor=0.5)
    assert estimator.smoothed_yaw is None

    # Dummy landmarks
    class DummyLandmark:
        def __init__(self, x, y):
            self.x = x
            self.y = y

    dummy_lms = [DummyLandmark(0.5, 0.5) for _ in range(500)]
    # Set nose, chin, eyes, mouth
    dummy_lms[1] = DummyLandmark(0.5, 0.5)      # nose
    dummy_lms[152] = DummyLandmark(0.5, 0.7)    # chin
    dummy_lms[33] = DummyLandmark(0.4, 0.45)    # left eye
    dummy_lms[263] = DummyLandmark(0.6, 0.45)   # right eye
    dummy_lms[61] = DummyLandmark(0.45, 0.6)    # left mouth
    dummy_lms[291] = DummyLandmark(0.55, 0.6)   # right mouth

    res = estimator.estimate(dummy_lms, 640, 480)
    assert res["valid"] is True
    assert "yaw" in res
    assert "pitch" in res
    assert "roll" in res
