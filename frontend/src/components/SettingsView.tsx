import React from 'react';
import { Volume2, Bell, Coffee, Target } from 'lucide-react';
import { Settings } from '../types';
import { soundSynth } from '../services/audio';

interface SettingsViewProps {
  settings: Settings;
  onUpdate: (updated: Partial<Settings>) => void;
  onTriggerTestAlert: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdate,
  onTriggerTestAlert
}) => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
            Preferences & Controls
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
          Alerts, Audio & Detection Settings
        </h1>
        <p className="text-xs text-[#A0A4B1] mt-1">
          Configure synthesizer alert sounds, away timing tolerances, study targets, and fatigue indicators.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Attention Away Timing */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8B7CFF]" />
              Attention-Away Threshold
            </h3>
            <span className="text-xs font-mono font-bold text-[#8B7CFF] bg-[#8B7CFF]/15 px-3 py-1 rounded-full border border-[#8B7CFF]/30">
              {settings.alert_threshold_sec}s
            </span>
          </div>
          <p className="text-xs text-[#A0A4B1] leading-relaxed">
            How long your head or gaze must be turned away before FocusGuard triggers an audible reminder. Brief glance intervals under this limit are ignored.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {[3, 5, 10, 15, 20].map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdate({ alert_threshold_sec: sec })}
                className={`px-4 py-2 rounded-2xl text-xs font-mono font-semibold transition-all ${
                  settings.alert_threshold_sec === sec
                    ? 'bg-[#8B7CFF] text-[#0A0B0E] shadow-glow-violet'
                    : 'bg-[#0B0C10] border border-[#292D38] text-[#A0A4B1] hover:text-[#F4F5F8]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-[11px] font-mono text-[#737887] mb-2">
              <span>Fine slider adjust</span>
              <span className="text-[#F4F5F8] font-semibold">{settings.alert_threshold_sec} seconds</span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={settings.alert_threshold_sec}
              onChange={(e) => onUpdate({ alert_threshold_sec: parseFloat(e.target.value) })}
              className="w-full accent-[#8B7CFF]"
            />
          </div>
        </div>

        {/* Card 2: Audio Synthesis & Sound Selection */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#8B7CFF]" />
              Audible Alert Tones (Offline Web Audio Synthesizer)
            </h3>
            <button
              onClick={() => onUpdate({ sound_enabled: !settings.sound_enabled })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
                settings.sound_enabled
                  ? 'border-[#8B7CFF]/50 bg-[#8B7CFF]/20 text-[#8B7CFF] shadow-glow-violet'
                  : 'border-[#292D38] bg-[#0B0C10] text-[#737887]'
              }`}
            >
              {settings.sound_enabled ? 'Sound Active' : 'Muted'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { id: 'chime', label: 'Harmonic Chime', desc: 'Gentle C5-G5 tone' },
              { id: 'bell', label: 'Meditation Bell', desc: 'Resonant bell chime' },
              { id: 'radar', label: 'Radar Pulses', desc: 'Double focused beep' },
              { id: 'warning', label: 'Attention Alert', desc: 'Triple step note' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => {
                  onUpdate({ alert_sound: snd.id });
                  soundSynth.playAlert(snd.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  settings.alert_sound === snd.id
                    ? 'border-[#8B7CFF] bg-[#222530] text-[#F4F5F8] shadow-glow-violet ring-1 ring-[#8B7CFF]/50'
                    : 'border-[#292D38] bg-[#0B0C10] text-[#A0A4B1] hover:border-[#8B7CFF]/30'
                }`}
              >
                <p className="text-xs font-bold text-[#F4F5F8]">{snd.label}</p>
                <p className="text-[10px] text-[#737887] font-mono mt-1">{snd.desc}</p>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs text-[#A0A4B1] mb-2 font-mono text-[11px]">
              <span>Alert Output Volume</span>
              <span className="text-[#F4F5F8] font-bold">{Math.round(settings.sound_volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sound_volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdate({ sound_volume: vol });
                soundSynth.setPreferences(settings.sound_enabled, vol);
              }}
              className="w-full accent-[#8B7CFF]"
            />
          </div>

          <button
            onClick={onTriggerTestAlert}
            className="w-full py-3 rounded-2xl bg-[#0B0C10] border border-[#292D38] hover:border-[#8B7CFF]/50 text-xs font-mono font-semibold text-[#F4F5F8] flex items-center justify-center gap-2 transition-all hover:bg-[#222530]"
          >
            <Volume2 className="w-4 h-4 text-[#8B7CFF]" />
            Synthesize Test Sound
          </button>
        </div>

        {/* Card 3: Study Targets & Daily Goals */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-[#8B7CFF]" />
              Study Target Goals
            </h3>
            <span className="text-xs font-mono text-[#737887]">Daily & Weekly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A0A4B1]">Daily Target</span>
                <span className="text-[#8B7CFF] font-bold">{settings.daily_goal_minutes} mins</span>
              </div>
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={settings.daily_goal_minutes}
                onChange={(e) => onUpdate({ daily_goal_minutes: parseInt(e.target.value) })}
                className="w-full accent-[#8B7CFF]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#A0A4B1]">Weekly Target</span>
                <span className="text-[#EC4899] font-bold">{settings.weekly_goal_minutes} mins</span>
              </div>
              <input
                type="range"
                min="180"
                max="2400"
                step="60"
                value={settings.weekly_goal_minutes}
                onChange={(e) => onUpdate({ weekly_goal_minutes: parseInt(e.target.value) })}
                className="w-full accent-[#EC4899]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Fatigue & Smart Breaks */}
        <div className="p-7 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase text-[#F4F5F8] font-bold tracking-wider flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[#EC4899]" />
              Smart Break Suggestions
            </h3>
            <button
              onClick={() => onUpdate({ smart_breaks_enabled: !settings.smart_breaks_enabled })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
                settings.smart_breaks_enabled
                  ? 'border-[#4ADE80]/50 bg-[#4ADE80]/20 text-[#4ADE80]'
                  : 'border-[#292D38] bg-[#0B0C10] text-[#737887]'
              }`}
            >
              {settings.smart_breaks_enabled ? 'Active' : 'Disabled'}
            </button>
          </div>
          <p className="text-xs text-[#A0A4B1] leading-relaxed">
            Automatically surfaces gentle suggestions to pause when repeated yawns or prolonged eye closures occur within a study block.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Prolonged Closure Alert</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {settings.prolonged_closure_sec}s
              </p>
              <span className="text-[10px] text-[#737887] font-sans mt-0.5 block">
                Natural blinks (0.1–0.4s) never trigger this
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
              <span className="text-[10px] text-[#737887] uppercase">Yawn Detection Threshold</span>
              <p className="text-base font-bold text-[#F4F5F8] mt-1">
                {settings.yawn_threshold_sec}s
              </p>
              <span className="text-[10px] text-[#737887] font-sans mt-0.5 block">
                Prevents regular talking/smiling false alarms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
