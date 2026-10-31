"""
Attention State Machine and Adaptive Alert Engine for FocusGuard AI
Maintains real-time attention status, elapsed-time timers, debouncing,
study mode thresholds, and alert cooldowns.
"""

import time
from enum import Enum
from typing import Dict, Any, Optional, List


class AttentionState(str, Enum):
    MONITORING_DISABLED = "MONITORING_DISABLED"
    MONITORING_INITIALIZING = "MONITORING_INITIALIZING"
    ATTENTIVE_ESTIMATE = "ATTENTIVE_ESTIMATE"
    LOOKING_AWAY = "LOOKING_AWAY"
    EYES_CLOSED = "EYES_CLOSED"
    FACE_NOT_DETECTED = "FACE_NOT_DETECTED"
    MONITORING_UNAVAILABLE = "MONITORING_UNAVAILABLE"
    PAUSED = "PAUSED"
    BREAK_ACTIVE = "BREAK_ACTIVE"


MODE_THRESHOLDS = {
    "coding": {
        "yaw_limit": 25.0,
        "pitch_up_limit": 18.0,
        "pitch_down_limit": 30.0,  # Allows looking down at keyboard/notebook
        "roll_limit": 25.0,
    },
    "reading": {
        "yaw_limit": 28.0,
        "pitch_up_limit": 22.0,
        "pitch_down_limit": 26.0,
        "roll_limit": 25.0,
    },
    "lecture": {
        "yaw_limit": 18.0,
        "pitch_up_limit": 16.0,
        "pitch_down_limit": 20.0,
        "roll_limit": 20.0,
    },
    "revision": {
        "yaw_limit": 22.0,
        "pitch_up_limit": 20.0,
        "pitch_down_limit": 25.0,
        "roll_limit": 22.0,
    },
    "custom": {
        "yaw_limit": 24.0,
        "pitch_up_limit": 20.0,
        "pitch_down_limit": 25.0,
        "roll_limit": 25.0,
    }
}


class AttentionEngine:
    def __init__(
        self,
        alert_threshold_sec: float = 5.0,
        alert_cooldown_sec: float = 6.0,
        mode: str = "coding"
    ):
        self.alert_threshold_sec = alert_threshold_sec
        self.alert_cooldown_sec = alert_cooldown_sec
        self.mode = mode if mode in MODE_THRESHOLDS else "coding"

        self.current_state = AttentionState.MONITORING_INITIALIZING
        self._last_state_change = time.monotonic()

        # Away event timing
        self._away_start_time: Optional[float] = None
        self._last_alert_time: float = 0.0
        self._away_event_count: int = 0
        self._current_away_event_id: Optional[str] = None

        # Cumulative counters for active session
        self.attentive_seconds: float = 0.0
        self.away_seconds: float = 0.0
        self.face_missing_seconds: float = 0.0
        self.last_update_time = time.monotonic()

        # Rolling fatigue indicator tracking (yawns + prolonged closures in last 10 mins)
        self.fatigue_events: List[float] = []

    def set_mode(self, mode: str) -> None:
        if mode in MODE_THRESHOLDS:
            self.mode = mode

    def set_thresholds(self, alert_threshold_sec: float, alert_cooldown_sec: float) -> None:
        self.alert_threshold_sec = alert_threshold_sec
        self.alert_cooldown_sec = alert_cooldown_sec

    def update(
        self,
        has_face: bool,
        pose_data: Dict[str, Any],
        eye_data: Dict[str, Any],
        is_paused: bool = False,
        is_break: bool = False,
        camera_healthy: bool = True
    ) -> Dict[str, Any]:
        now = time.monotonic()
        dt = max(0.0, now - self.last_update_time)
        self.last_update_time = now

        # Prune old fatigue events older than 600s (10 min)
        self.fatigue_events = [t for t in self.fatigue_events if now - t < 600.0]

        # Check overriding system states
        if not camera_healthy:
            new_state = AttentionState.MONITORING_UNAVAILABLE
        elif is_break:
            new_state = AttentionState.BREAK_ACTIVE
        elif is_paused:
            new_state = AttentionState.PAUSED
        elif not has_face:
            new_state = AttentionState.FACE_NOT_DETECTED
        elif eye_data.get("prolonged_closure"):
            new_state = AttentionState.EYES_CLOSED
        else:
            # Check head pose orientation against current mode thresholds
            thresholds = MODE_THRESHOLDS.get(self.mode, MODE_THRESHOLDS["coding"])
            yaw = abs(pose_data.get("yaw", 0.0))
            pitch = pose_data.get("pitch", 0.0)
            roll = abs(pose_data.get("roll", 0.0))

            is_away = False
            if yaw > thresholds["yaw_limit"]:
                is_away = True
            elif pitch > thresholds["pitch_up_limit"]:  # Looking way up
                is_away = True
            elif pitch < -thresholds["pitch_down_limit"]:  # Looking way down
                is_away = True
            elif roll > thresholds["roll_limit"]:
                is_away = True

            new_state = AttentionState.LOOKING_AWAY if is_away else AttentionState.ATTENTIVE_ESTIMATE

        if new_state != self.current_state:
            self.current_state = new_state
            self._last_state_change = now

        # Handle attention-away timer & alerts
        away_duration = 0.0
        trigger_alert = False
        alert_reason = ""
        completed_event = None

        if self.current_state in (AttentionState.LOOKING_AWAY, AttentionState.FACE_NOT_DETECTED):
            if self._away_start_time is None:
                self._away_start_time = now
            away_duration = now - self._away_start_time
            self.away_seconds += dt

            # Check if threshold exceeded
            if away_duration >= self.alert_threshold_sec:
                # Check cooldown to avoid continuous beeping
                if (now - self._last_alert_time) >= self.alert_cooldown_sec:
                    trigger_alert = True
                    self._last_alert_time = now
                    if self.current_state == AttentionState.LOOKING_AWAY:
                        alert_reason = f"Attention directed away for {int(away_duration)}s (threshold: {int(self.alert_threshold_sec)}s)"
                    else:
                        alert_reason = f"Face not detected for {int(away_duration)}s"
        else:
            # Reset away timer when attention returns or paused/break
            if self._away_start_time is not None:
                final_away_time = now - self._away_start_time
                if final_away_time >= 1.5:  # Log as an away event if lasted > 1.5s
                    self._away_event_count += 1
                    completed_event = {
                        "event_type": "ATTENTION_AWAY",
                        "duration_sec": round(final_away_time, 2),
                        "alert_triggered": final_away_time >= self.alert_threshold_sec
                    }
                self._away_start_time = None

            if self.current_state == AttentionState.ATTENTIVE_ESTIMATE:
                self.attentive_seconds += dt

        # Prolonged eye closure alert check
        if eye_data.get("prolonged_closure_alert"):
            self.fatigue_events.append(now)
            trigger_alert = True
            alert_reason = f"Eyes closed for over {eye_data.get('closure_duration')}s"

        # Yawn fatigue tracking
        if eye_data.get("is_yawning") and (now - eye_data.get("closure_duration", 0) < 1.0):
            self.fatigue_events.append(now)

        # Smart break suggestion trigger: 3 or more fatigue signs in 10 minutes
        smart_break_suggested = len(self.fatigue_events) >= 3

        # Estimated attention ratio: Attentive Time / (Attentive + Away) * 100
        eligible_monitored = self.attentive_seconds + self.away_seconds
        attention_ratio = 0.0
        if eligible_monitored >= 5.0:
            attention_ratio = round((self.attentive_seconds / eligible_monitored) * 100.0, 1)

        return {
            "state": self.current_state.value,
            "away_duration_sec": round(away_duration, 1),
            "alert_threshold_sec": self.alert_threshold_sec,
            "trigger_alert": trigger_alert,
            "alert_reason": alert_reason,
            "attentive_sec": round(self.attentive_seconds, 1),
            "away_sec": round(self.away_seconds, 1),
            "eligible_monitored_sec": round(eligible_monitored, 1),
            "attention_ratio": attention_ratio,
            "away_event_count": self._away_event_count,
            "smart_break_suggested": smart_break_suggested,
            "fatigue_score": len(self.fatigue_events),
            "completed_event": completed_event
        }

    def reset_session_counters(self) -> None:
        self.attentive_seconds = 0.0
        self.away_seconds = 0.0
        self.face_missing_seconds = 0.0
        self._away_event_count = 0
        self._away_start_time = None
        self.last_update_time = time.monotonic()
        self.fatigue_events.clear()
