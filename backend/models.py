"""
Pydantic Models for FocusGuard AI API & WebSocket Messages
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class SettingsModel(BaseModel):
    ui_theme: Optional[str] = Field(default="dark", max_length=20)
    sound_enabled: Optional[bool] = True
    sound_volume: Optional[float] = Field(default=0.8, ge=0.0, le=1.0)
    alert_sound: Optional[str] = Field(default="chime", max_length=50)
    alert_threshold_sec: Optional[float] = Field(default=5.0, ge=1.0, le=300.0)
    alert_cooldown_sec: Optional[float] = Field(default=6.0, ge=0.5, le=300.0)
    sensitivity: Optional[str] = Field(default="medium", max_length=20)
    active_mode: Optional[str] = Field(default="coding", max_length=30)
    camera_index: Optional[int] = Field(default=0, ge=0, le=10)
    inference_fps: Optional[int] = Field(default=15, ge=5, le=60)
    show_preview: Optional[bool] = True
    show_landmarks: Optional[bool] = True
    prolonged_closure_sec: Optional[float] = Field(default=2.0, ge=0.5, le=30.0)
    yawn_threshold_sec: Optional[float] = Field(default=1.5, ge=0.5, le=30.0)
    smart_breaks_enabled: Optional[bool] = True
    max_uninterrupted_minutes: Optional[int] = Field(default=50, ge=5, le=360)
    daily_goal_minutes: Optional[int] = Field(default=180, ge=1, le=1440)
    weekly_goal_minutes: Optional[int] = Field(default=900, ge=1, le=10080)


class CalibrationModel(BaseModel):
    baseline_yaw: float = Field(default=0.0, ge=-90.0, le=90.0)
    baseline_pitch: float = Field(default=0.0, ge=-90.0, le=90.0)
    baseline_roll: float = Field(default=0.0, ge=-90.0, le=90.0)
    baseline_ear: float = Field(default=0.28, ge=0.0, le=1.0)
    yaw_threshold_deg: float = Field(default=20.0, ge=5.0, le=90.0)
    pitch_threshold_deg: float = Field(default=18.0, ge=5.0, le=90.0)
    roll_threshold_deg: float = Field(default=25.0, ge=5.0, le=90.0)


class CreateSessionRequest(BaseModel):
    title: str = Field(default="Focus Session", min_length=1, max_length=100)
    subject: str = Field(default="Coding", min_length=1, max_length=50)
    mode: str = Field(default="coding", min_length=1, max_length=30)
    planned_duration_sec: int = Field(default=1500, ge=60, le=86400)


class UpdateSessionRequest(BaseModel):
    status: Optional[str] = Field(default=None, max_length=30)
    notes: Optional[str] = Field(default=None, max_length=1000)


class CommandMessage(BaseModel):
    action: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    payload: Optional[Dict[str, Any]] = None
