import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Compass,
  Eye,
  Smile,
  AlertTriangle,
  Volume2,
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react';
import { FrameTelemetry } from '../types';

interface LiveMonitorViewProps {
  telemetry: FrameTelemetry | null;
  onStartCalibration: () => void;
  onTriggerTestAlert: () => void;
  onToggleLandmarks: (show: boolean) => void;
  showLandmarks: boolean;
}

export const LiveMonitorView: React.FC<LiveMonitorViewProps> = ({
  telemetry,
  onStartCalibration,
  onTriggerTestAlert,
  onToggleLandmarks,
  showLandmarks
}) => {
  const [privacyBlur, setPrivacyBlur] = useState<boolean>(false);

  const pose = telemetry?.pose;
  const eye = telemetry?.eye;
  const att = telemetry?.attention;

  const awaySec = att?.away_duration_sec ?? 0;
  const alertThreshold = att?.alert_threshold_sec ?? 5;
  const awayPercent = Math.min(100, Math.round((awaySec / alertThreshold) * 100));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
              Real-Time Vision Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
            Live Computer Vision HUD
          </h1>
          <p className="text-xs text-[#A0A4B1] mt-1">
            MediaPipe 478 3D landmarks, solvePnP head-pose estimation (Yaw, Pitch, Roll), and eye/mouth blendshapes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onToggleLandmarks(!showLandmarks)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-mono font-semibold transition-all ${
              showLandmarks
                ? 'border-[#8B7CFF]/50 bg-[#8B7CFF]/20 text-[#8B7CFF] shadow-glow-violet'
                : 'border-[#292D38] bg-[#14161D] text-[#737887] hover:text-[#F4F5F8]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Mesh: {showLandmarks ? 'ON' : 'OFF'}</span>
            </div>
          </button>

          <button
            onClick={() => setPrivacyBlur(!privacyBlur)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-mono font-semibold transition-all ${
              privacyBlur
                ? 'border-[#8B7CFF]/50 bg-[#8B7CFF]/20 text-[#8B7CFF] shadow-glow-violet'
                : 'border-[#292D38] bg-[#14161D] text-[#737887] hover:text-[#F4F5F8]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Blur: {privacyBlur ? 'ON' : 'OFF'}</span>
            </div>
          </button>

          <button
            onClick={onStartCalibration}
            className="px-3.5 py-2 rounded-2xl border border-[#292D38] bg-[#14161D] hover:bg-[#222530] text-[#A0A4B1] hover:text-[#F4F5F8] text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8B7CFF]" />
            Recalibrate
          </button>

          <button
            onClick={onTriggerTestAlert}
            className="px-4 py-2 rounded-2xl bg-[#8B7CFF] text-[#0A0B0E] text-xs font-bold hover:bg-[#7A6AE6] flex items-center gap-1.5 transition-all shadow-glow-violet"
          >
            <Volume2 className="w-3.5 h-3.5 fill-current" />
            Test Sound
          </button>
        </div>
      </div>

      {/* Main Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Camera Feed Canvas */}
        <div className="lg:col-span-2 rounded-3xl bg-[#14161D] border border-[#292D38] p-6 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#F4F5F8] flex items-center gap-2 font-mono uppercase text-[11px]">
              <Activity className="w-4 h-4 text-[#8B7CFF]" />
              Raw Camera Stream (640x480 @ {telemetry?.fps ?? 0} FPS)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              telemetry?.has_face
                ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
                : 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30'
            }`}>
              {telemetry?.has_face ? '• Face Detected' : '• Searching For Face...'}
            </span>
          </div>

          <div className="w-full aspect-video bg-[#0B0C10] rounded-2xl overflow-hidden relative border border-[#292D38] flex items-center justify-center">
            {telemetry?.preview_base64 ? (
              <img
                src={`data:image/jpeg;base64,${telemetry.preview_base64}`}
                alt="Webcam Preview"
                className={`w-full h-full object-contain ${privacyBlur ? 'blur-md' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-[#737887] font-mono">
                <Camera className="w-10 h-10 animate-pulse stroke-[1.5] text-[#8B7CFF]" />
                <p className="text-xs">Initializing hardware camera capture...</p>
              </div>
            )}

            {/* Corner HUD Brackets */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#8B7CFF]" />
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#8B7CFF]" />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#8B7CFF]" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#8B7CFF]" />

            {/* Calibration overlay banner */}
            {telemetry?.calibrating && (
              <div className="absolute inset-0 bg-[#0B0C10]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <RefreshCw className="w-10 h-10 text-[#8B7CFF] animate-spin mb-4 stroke-[1.5]" />
                <h3 className="text-base font-bold text-[#F4F5F8] tracking-tight">Calibrating Neutral Head Pose</h3>
                <p className="text-xs text-[#A0A4B1] max-w-sm mt-1.5 leading-relaxed">
                  Sit comfortably in your regular study posture and gaze naturally at the screen center.
                </p>
                <div className="w-64 bg-[#222530] h-2 rounded-full overflow-hidden mt-5">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] transition-all duration-150 shadow-glow-violet"
                    style={{ width: `${Math.round((telemetry.calibration_progress ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Attention-Away Threshold Countdown Progress Bar */}
          <div className="mt-5 p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#A0A4B1] flex items-center gap-1.5 font-mono text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
                Monotonic Attention-Away Timer
              </span>
              <span className="font-mono font-bold text-[#F4F5F8] text-[11px]">
                {awaySec.toFixed(1)}s / {alertThreshold}s limit
              </span>
            </div>
            <div className="w-full bg-[#222530] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  awaySec >= alertThreshold
                    ? 'bg-[#F87171] animate-pulse shadow-glow-warning'
                    : awaySec > 0
                    ? 'bg-[#FBBF24]'
                    : 'bg-[#4ADE80]'
                }`}
                style={{ width: `${awayPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Measurement HUD Cards */}
        <div className="space-y-4">
          {/* Head Pose Card */}
          <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-4 shadow-subtle">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F4F5F8] flex items-center gap-2 font-mono uppercase text-[11px]">
                <Compass className="w-4 h-4 text-[#8B7CFF]" />
                Head Pose (solvePnP)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#222530] text-[#737887]">
                Euler Deg
              </span>
            </div>

            <div className="space-y-3.5 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[#A0A4B1] mb-1.5 text-[11px]">
                  <span>Yaw (Rotation):</span>
                  <span className="font-bold text-[#F4F5F8]">
                    {pose?.valid ? `${pose.yaw > 0 ? `+${pose.yaw}` : pose.yaw}°` : '—'}
                  </span>
                </div>
                <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden flex items-center justify-center border border-[#292D38]/50">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#A78BFA] transition-all"
                    style={{
                      width: `${Math.min(100, Math.abs(pose?.yaw ?? 0) * 2)}%`,
                      marginLeft: (pose?.yaw ?? 0) < 0 ? 'auto' : undefined,
                      marginRight: (pose?.yaw ?? 0) >= 0 ? 'auto' : undefined,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#A0A4B1] mb-1.5 text-[11px]">
                  <span>Pitch (Elevation):</span>
                  <span className="font-bold text-[#F4F5F8]">
                    {pose?.valid ? `${pose.pitch > 0 ? `+${pose.pitch}` : pose.pitch}°` : '—'}
                  </span>
                </div>
                <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden flex items-center justify-center border border-[#292D38]/50">
                  <div
                    className="h-full bg-[#EC4899] transition-all"
                    style={{
                      width: `${Math.min(100, Math.abs(pose?.pitch ?? 0) * 2)}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#A0A4B1] mb-1.5 text-[11px]">
                  <span>Roll (Tilt):</span>
                  <span className="font-bold text-[#F4F5F8]">
                    {pose?.valid ? `${pose.roll > 0 ? `+${pose.roll}` : pose.roll}°` : '—'}
                  </span>
                </div>
                <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden flex items-center justify-center border border-[#292D38]/50">
                  <div
                    className="h-full bg-[#737887] transition-all"
                    style={{
                      width: `${Math.min(100, Math.abs(pose?.roll ?? 0) * 2)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Eye & Blink Analysis */}
          <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-3.5 shadow-subtle">
            <h3 className="text-xs font-bold text-[#F4F5F8] flex items-center gap-2 font-mono uppercase text-[11px]">
              <Eye className="w-4 h-4 text-[#4ADE80]" />
              Eye Closure & Blinks
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                <p className="text-[10px] text-[#737887] font-mono">Aspect Ratio (EAR)</p>
                <p className="text-xl font-bold font-mono text-[#F4F5F8] mt-1">
                  {eye?.ear ?? '0.00'}
                </p>
                <span className={`text-[10px] font-mono font-semibold ${
                  eye?.eyes_closed ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                }`}>
                  {eye?.eyes_closed ? '• Closed' : '• Open'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                <p className="text-[10px] text-[#737887] font-mono">Blinks Counted</p>
                <p className="text-xl font-bold font-mono text-[#F4F5F8] mt-1">
                  {eye?.blink_count ?? 0}
                </p>
                <span className="text-[10px] text-[#A0A4B1] font-mono">Debounced</span>
              </div>
            </div>

            {eye?.prolonged_closure && (
              <div className="p-3 rounded-2xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F87171]" />
                Prolonged Eye Closure Active ({eye?.closure_duration}s)
              </div>
            )}
          </div>

          {/* Mouth & Yawn Analysis */}
          <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-3.5 shadow-subtle">
            <h3 className="text-xs font-bold text-[#F4F5F8] flex items-center gap-2 font-mono uppercase text-[11px]">
              <Smile className="w-4 h-4 text-[#EC4899]" />
              Mouth & Yawn Tracker
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                <p className="text-[10px] text-[#737887] font-mono">Mouth Ratio (MAR)</p>
                <p className="text-xl font-bold font-mono text-[#F4F5F8] mt-1">
                  {eye?.mar ?? '0.00'}
                </p>
                <span className="text-[10px] text-[#737887] font-mono">Jaw: {eye?.jaw_open_score ?? 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                <p className="text-[10px] text-[#737887] font-mono">Possible Yawns</p>
                <p className="text-xl font-bold font-mono text-[#F4F5F8] mt-1">
                  {eye?.yawn_count ?? 0}
                </p>
                <span className="text-[10px] text-[#737887] font-mono">&gt;1.3s threshold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
