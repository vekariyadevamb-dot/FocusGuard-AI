import React from 'react';
import { Volume2, VolumeX, Shield, Circle } from 'lucide-react';
import { AttentionState, ActiveSession } from '../types';

interface TopBarProps {
  attentionState: AttentionState;
  awaySeconds: number;
  alertThreshold: number;
  activeSession: ActiveSession | null;
  cameraHealthy: boolean;
  fps: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  attentionState,
  awaySeconds,
  alertThreshold,
  activeSession,
  cameraHealthy,
  fps,
  soundEnabled,
  onToggleSound,
}) => {
  const getStateBadge = (state: AttentionState) => {
    switch (state) {
      case 'ATTENTIVE_ESTIMATE':
        return {
          label: "You're focused",
          bg: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/25',
          dot: 'bg-[#34D399] shadow-glow-attentive'
        };
      case 'LOOKING_AWAY':
        return {
          label: `Looking Away (${awaySeconds}s / ${alertThreshold}s)`,
          bg: 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/30',
          dot: 'bg-[#FB7185] animate-ping'
        };
      case 'EYES_CLOSED':
        return {
          label: 'Eyes Closed',
          bg: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30',
          dot: 'bg-[#FBBF24]'
        };
      case 'FACE_NOT_DETECTED':
        return {
          label: 'Face Not Detected',
          bg: 'bg-white/[0.04] text-[#A1A1B5] border-white/5',
          dot: 'bg-[#63657E]'
        };
      case 'PAUSED':
        return {
          label: 'Session Paused',
          bg: 'bg-white/[0.04] text-[#A1A1B5] border-white/5',
          dot: 'bg-[#A1A1B5]'
        };
      case 'BREAK_ACTIVE':
        return {
          label: 'Break Active',
          bg: 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30',
          dot: 'bg-[#8B5CF6] shadow-glow-violet'
        };
      default:
        return {
          label: 'Ready to focus',
          bg: 'bg-white/[0.04] text-[#A1A1B5] border-white/5',
          dot: 'bg-[#63657E]'
        };
    }
  };

  const badge = getStateBadge(attentionState);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#090A12]/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: State Badge & Active Session Pill */}
      <div className="flex items-center gap-3.5">
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${badge.bg} transition-all duration-300`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span className="tracking-tight">{badge.label}</span>
        </div>

        {activeSession && (
          <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-full text-xs bg-[#121426] border border-white/10 text-[#F5F3FF] shadow-subtle">
            <span className="text-[#63657E] text-[10px] uppercase font-semibold">Session:</span>
            <span className="font-semibold truncate max-w-[200px]">{activeSession.title}</span>
            <span className="text-[#A78BFA] font-bold bg-[#8B5CF6]/15 px-2 py-0.5 rounded-md border border-[#8B5CF6]/25 font-mono">
              {formatTimer(activeSession.remaining_duration_sec)}
            </span>
          </div>
        )}
      </div>

      {/* Right: Camera Health, Sound, Privacy */}
      <div className="flex items-center gap-3">
        {/* Camera Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121426] border border-white/5 text-xs text-[#A1A1B5]">
          <Circle className={`w-2 h-2 ${cameraHealthy ? 'text-[#34D399] fill-[#34D399]' : 'text-[#FB7185] fill-[#FB7185]'}`} />
          <span>{cameraHealthy ? `${fps} FPS` : 'Camera Disconnected'}</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Audio alerts active' : 'Audio muted'}
          className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all duration-200 ${
            soundEnabled
              ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#A78BFA] hover:bg-[#8B5CF6]/20 shadow-glow-violet'
              : 'border-white/5 bg-[#121426] text-[#63657E] hover:text-[#A1A1B5]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="font-medium">{soundEnabled ? 'Sound On' : 'Muted'}</span>
        </button>

        {/* Privacy Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121426] border border-white/5 text-xs text-[#34D399]">
          <Shield className="w-3.5 h-3.5 text-[#34D399]" />
          <span>100% Local</span>
        </div>
      </div>
    </header>
  );
};
