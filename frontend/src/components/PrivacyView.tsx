import React from 'react';
import { ShieldCheck, HardDrive, Trash2, Camera, CheckCircle2, Cpu } from 'lucide-react';
import { Settings } from '../types';
import { api } from '../services/api';

interface PrivacyViewProps {
  settings: Settings;
  onUpdate: (updated: Partial<Settings>) => void;
  onDataCleared: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  settings,
  onUpdate,
  onDataCleared
}) => {
  const handleClear = async () => {
    if (confirm('Permanently delete all stored session history, events, and metrics from your local SQLite database?')) {
      await api.clearAllHistory();
      onDataCleared();
      alert('Local history successfully wiped.');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse shadow-glow-attentive" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#4ADE80] font-semibold">
            Zero-Cloud Architecture
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
          Privacy & Local Data Controls
        </h1>
        <p className="text-xs text-[#A0A4B1] mt-1">
          FocusGuard is built from the ground up as a 100% on-device, local-first study assistant.
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy Principles Card */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
              Architectural Privacy Guarantees
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30">
              100% On-Device
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#8B7CFF]/15 flex items-center justify-center text-[#8B7CFF]">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-[#F4F5F8]">100% Local Inference</h4>
              <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
                All landmark processing and head pose calculations run directly on your CPU/GPU via MediaPipe and OpenCV. No video ever leaves your machine.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EC4899]/15 flex items-center justify-center text-[#EC4899]">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-[#F4F5F8]">Ephemeral Frames Only</h4>
              <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
                Raw webcam frames exist only in volatile RAM for milliseconds during pipeline inference and are immediately freed. Zero video is saved to disk.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4ADE80]/15 flex items-center justify-center text-[#4ADE80]">
                <HardDrive className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-[#F4F5F8]">Local SQLite Storage</h4>
              <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
                Only aggregated metrics (attention percentages, timestamps, and distraction counts) are stored in your local <code className="text-[#8B7CFF] font-mono">focusguard.db</code> database.
              </p>
            </div>
          </div>
        </div>

        {/* Camera Device Selector */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#8B7CFF]" />
              Camera Hardware Device Selection
            </h3>
            <span className="text-xs font-mono text-[#737887]">V4L2 Linux Capture</span>
          </div>
          <p className="text-xs text-[#A0A4B1] leading-relaxed">
            Select the video capture hardware device index used by the computer vision pipeline. Defaults to device 0 (/dev/video0).
          </p>

          <div className="flex flex-wrap gap-3">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                onClick={() => onUpdate({ camera_index: idx })}
                className={`px-5 py-3 rounded-2xl text-xs font-mono font-semibold flex items-center gap-2.5 transition-all ${
                  settings.camera_index === idx
                    ? 'bg-[#8B7CFF] text-[#0A0B0E] shadow-glow-violet'
                    : 'bg-[#0B0C10] border border-[#292D38] text-[#A0A4B1] hover:text-[#F4F5F8]'
                }`}
              >
                {settings.camera_index === idx && <CheckCircle2 className="w-4 h-4" />}
                Device {idx} {idx === 0 ? '(/dev/video0)' : '(/dev/video1)'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Erasure Section */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#F87171]/30 space-y-4 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono uppercase text-[#F87171] font-bold tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[#F87171]" />
                Purge All Local Study Data
              </h3>
              <p className="text-xs text-[#A0A4B1] mt-1 leading-relaxed">
                Permanently purge all study sessions, event logs, and goal metrics from your local SQLite database.
              </p>
            </div>

            <button
              onClick={handleClear}
              className="px-5 py-2.5 rounded-2xl border border-[#F87171]/40 bg-[#F87171]/15 hover:bg-[#F87171]/25 text-[#F87171] text-xs font-mono font-bold transition-all shadow-glow-warning shrink-0"
            >
              Wipe Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
