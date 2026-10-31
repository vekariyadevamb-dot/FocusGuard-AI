import React from 'react';
import { Compass, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FrameTelemetry } from '../types';

interface CalibrationViewProps {
  telemetry: FrameTelemetry | null;
  onStartCalibration: () => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  telemetry,
  onStartCalibration
}) => {
  const isCalibrating = telemetry?.calibrating ?? false;
  const progress = Math.round((telemetry?.calibration_progress ?? 0) * 100);
  const baseline = telemetry?.baseline ?? {};

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
            Biometric Calibration
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
          Neutral-Pose Calibration Wizard
        </h1>
        <p className="text-xs text-[#A0A4B1] mt-1">
          Establishes your natural baseline head orientation (Yaw, Pitch, Roll) and resting eye aperture to zero out setup offsets.
        </p>
      </div>

      {/* Instructions Card */}
      <div className="p-8 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-6 shadow-subtle">
        <h3 className="text-xs font-mono uppercase text-[#A0A4B1] tracking-wider font-bold">
          Three-Step Calibration Protocol
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-3">
            <span className="w-6 h-6 rounded-xl bg-[#8B7CFF] text-[#0A0B0E] flex items-center justify-center font-bold font-mono text-xs shadow-glow-violet">
              1
            </span>
            <p className="font-bold text-[#F4F5F8]">Natural Posture</p>
            <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
              Sit in your everyday study position with your monitor adjusted to comfortable eye level.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-3">
            <span className="w-6 h-6 rounded-xl bg-[#222530] text-[#8B7CFF] border border-[#8B7CFF]/30 flex items-center justify-center font-bold font-mono text-xs">
              2
            </span>
            <p className="font-bold text-[#F4F5F8]">Center Screen Gaze</p>
            <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
              Fix your eyes comfortably on the center of the display. Keep head relaxed and still.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-3">
            <span className="w-6 h-6 rounded-xl bg-[#222530] text-[#EC4899] border border-[#EC4899]/30 flex items-center justify-center font-bold font-mono text-xs">
              3
            </span>
            <p className="font-bold text-[#F4F5F8]">30-Frame Median</p>
            <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
              FocusGuard samples 30 consecutive landmark frames to calculate robust median baseline offsets.
            </p>
          </div>
        </div>

        {/* Live Baseline Angles Display */}
        <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] uppercase tracking-wider text-[#A0A4B1] font-bold">
              Active Baseline Offsets in Memory
            </h4>
            <span className="text-[10px] text-[#4ADE80] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Synchronized
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#14161D] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Baseline Yaw</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {baseline.baseline_yaw ? `${baseline.baseline_yaw.toFixed(1)}°` : '0.0°'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#14161D] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Baseline Pitch</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {baseline.baseline_pitch ? `${baseline.baseline_pitch.toFixed(1)}°` : '0.0°'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#14161D] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Baseline Roll</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {baseline.baseline_roll ? `${baseline.baseline_roll.toFixed(1)}°` : '0.0°'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#14161D] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Baseline EAR</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {baseline.baseline_ear ? baseline.baseline_ear.toFixed(2) : '0.28'}
              </p>
            </div>
          </div>
        </div>

        {/* Calibration Action */}
        <div className="pt-2">
          {isCalibrating ? (
            <div className="space-y-4 text-center py-4 font-mono">
              <div className="flex items-center justify-center gap-2 text-[#8B7CFF] font-semibold text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sampling neutral landmarks... ({progress}%)
              </div>
              <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden max-w-md mx-auto border border-[#292D38]">
                <div
                  className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] transition-all duration-150 shadow-glow-violet"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onStartCalibration}
              className="w-full py-3.5 rounded-2xl bg-[#8B7CFF] hover:bg-[#7A6AE6] text-[#0A0B0E] font-bold text-xs flex items-center justify-center gap-2 shadow-glow-violet transition-all font-mono"
            >
              <Compass className="w-4 h-4 fill-current" />
              Begin 30-Frame Neutral Calibration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
