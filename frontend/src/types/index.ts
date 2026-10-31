export type AttentionState =
  | 'MONITORING_DISABLED'
  | 'MONITORING_INITIALIZING'
  | 'ATTENTIVE_ESTIMATE'
  | 'LOOKING_AWAY'
  | 'EYES_CLOSED'
  | 'FACE_NOT_DETECTED'
  | 'MONITORING_UNAVAILABLE'
  | 'PAUSED'
  | 'BREAK_ACTIVE';

export type StudyMode = 'coding' | 'reading' | 'lecture' | 'revision' | 'custom';

export interface HeadPoseData {
  valid: boolean;
  yaw: number;
  pitch: number;
  roll: number;
  raw_yaw: number;
  raw_pitch: number;
  raw_roll: number;
}

export interface EyeMouthData {
  ear: number;
  mar: number;
  eyes_closed: boolean;
  closure_duration: number;
  prolonged_closure: boolean;
  prolonged_closure_alert: boolean;
  blink_count: number;
  is_yawning: boolean;
  yawn_count: number;
  jaw_open_score: number;
  blend_blink_score: number;
}

export interface AttentionData {
  state: AttentionState;
  away_duration_sec: number;
  alert_threshold_sec: number;
  trigger_alert: boolean;
  alert_reason: string;
  attentive_sec: number;
  away_sec: number;
  eligible_monitored_sec: number;
  attention_ratio: number;
  away_event_count: number;
  smart_break_suggested: boolean;
  fatigue_score: number;
}

export interface FrameTelemetry {
  success: boolean;
  has_face: boolean;
  camera_healthy: boolean;
  fps: number;
  pose: HeadPoseData;
  eye: EyeMouthData;
  attention: AttentionData;
  calibrating: boolean;
  calibration_progress: number | null;
  baseline: Record<string, number>;
  preview_base64: string | null;
}

export interface ActiveSession {
  id: string;
  title: string;
  subject: string;
  mode: StudyMode;
  planned_duration_sec: number;
  active_duration_sec: number;
  remaining_duration_sec: number;
  is_paused: boolean;
  is_break: boolean;
  status: 'IN_PROGRESS' | 'PAUSED' | 'BREAK';
}

export interface TelemetryMessage {
  type: string;
  timestamp: number;
  frame: FrameTelemetry;
  session: ActiveSession | null;
}

export interface Settings {
  id?: number;
  ui_theme: string;
  sound_enabled: boolean;
  sound_volume: number;
  alert_sound: string;
  alert_threshold_sec: number;
  alert_cooldown_sec: number;
  sensitivity: string;
  active_mode: StudyMode;
  camera_index: number;
  inference_fps: number;
  show_preview: boolean;
  show_landmarks: boolean;
  prolonged_closure_sec: number;
  yawn_threshold_sec: number;
  smart_breaks_enabled: boolean;
  max_uninterrupted_minutes: number;
  daily_goal_minutes: number;
  weekly_goal_minutes: number;
}

export interface CalibrationData {
  baseline_yaw: number;
  baseline_pitch: number;
  baseline_roll: number;
  baseline_ear: number;
  yaw_threshold_deg: number;
  pitch_threshold_deg: number;
  roll_threshold_deg: number;
  calibrated_at?: string;
}

export interface SessionHistoryItem {
  id: string;
  title: string;
  subject: string;
  mode: string;
  planned_duration_sec: number;
  active_duration_sec: number;
  paused_duration_sec: number;
  break_duration_sec: number;
  eligible_monitored_sec: number;
  attentive_sec: number;
  away_sec: number;
  attention_ratio: number;
  blink_count: number;
  prolonged_closure_count: number;
  yawn_count: number;
  away_event_count: number;
  status: string;
  start_time: string;
  end_time?: string;
  notes?: string;
}

export interface AnalyticsSummary {
  total_sessions: number;
  total_active_sec: number;
  total_monitored_sec: number;
  total_attentive_sec: number;
  total_away_sec: number;
  total_blinks: number;
  total_prolonged_closures: number;
  total_yawns: number;
  total_away_events: number;
  avg_attention_ratio: number | null;
  daily: Array<{
    day_date: string;
    sessions_count: number;
    study_sec: number;
    day_attention_ratio: number | null;
  }>;
  subjects: Array<{
    subject: string;
    sessions_count: number;
    total_sec: number;
    avg_ratio: number | null;
  }>;
  goals?: GoalSummary;
}

export interface GoalSummary {
  daily_target_minutes: number;
  daily_current_minutes: number;
  daily_progress_percent: number;
  daily_completed: boolean;
  today_sessions: number;
  weekly_target_minutes: number;
  weekly_current_minutes: number;
  weekly_progress_percent: number;
  weekly_completed: boolean;
  weekly_sessions: number;
  streak_days: number;
}
