import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  Square,
  RotateCcw,
  BookOpen,
  Code2,
  Headphones,
  Sliders,
  Coffee,
  Zap
} from 'lucide-react';
import { ActiveSession, FrameTelemetry, StudyMode } from '../types';

interface ActiveSessionViewProps {
  activeSession: ActiveSession | null;
  telemetry: FrameTelemetry | null;
  onStartSession: (title: string, subject: string, mode: StudyMode, durationMin: number) => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onStopSession: () => void;
  onCompleteSession: () => void;
  onStartBreak?: (durationMin: number) => void;
  onEndBreak?: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  activeSession,
  telemetry,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onCompleteSession,
  onStartBreak,
  onEndBreak
}) => {
  const [title, setTitle] = useState('DSA Practice & Problem Solving');
  const [subject, setSubject] = useState('DSA');
  const [customSubject, setCustomSubject] = useState('');
  const [mode, setMode] = useState<StudyMode>('coding');
  const [durationMin, setDurationMin] = useState(25);
  const [pomodoroCycle] = useState(1);

  const subjects = [
    'DSA',
    'Competitive Programming',
    'Machine Learning',
    'Software Engineering',
    'Java',
    'Exam Preparation',
    'Reading',
    'Custom'
  ];

  const modes: Array<{ id: StudyMode; label: string; desc: string; icon: any }> = [
    { id: 'coding', label: 'Coding Mode', desc: 'Allows looking down at keyboard/desk without false alarms', icon: Code2 },
    { id: 'reading', label: 'Reading Mode', desc: 'Relaxed eye gaze and wider head rotation thresholds', icon: BookOpen },
    { id: 'lecture', label: 'Lecture Mode', desc: 'Tighter attention limits for online video/lectures', icon: Headphones },
    { id: 'revision', label: 'Revision Mode', desc: 'Interval focus with recommended active recall breaks', icon: RotateCcw },
    { id: 'custom', label: 'Custom Mode', desc: 'Customizable thresholds from settings', icon: Sliders },
  ];

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const att = telemetry?.attention;
  const ratio = att?.attention_ratio ?? 0;

  // Circular progress calculations
  const totalPlannedSec = activeSession ? activeSession.planned_duration_sec : durationMin * 60;
  const remainingSec = activeSession ? activeSession.remaining_duration_sec : totalPlannedSec;
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingSec / (totalPlannedSec || 1)));
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isBreak = activeSession?.is_break ?? false;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* If Session is Active — Reference 3 Inspired Immersive Focus Timer */}
      {activeSession ? (
        <div className="space-y-6">
          <div className="p-10 rounded-3xl bg-[#14161D] border border-[#292D38] flex flex-col items-center text-center relative overflow-hidden shadow-elevated">
            {/* Subtle violet/pink ambient glow in background */}
            <div className="absolute top-0 w-96 h-96 bg-gradient-to-b from-[#8B7CFF]/10 via-[#EC4899]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Top Badges */}
            <div className="flex items-center gap-2.5 mb-6 z-10">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
                {activeSession.subject}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#222530] text-[#A0A4B1] border border-[#292D38]">
                {activeSession.mode.toUpperCase()} MODE
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isBreak
                  ? 'bg-[#8B7CFF]/20 text-[#8B7CFF] border-[#8B7CFF]/40 shadow-glow-violet'
                  : activeSession.is_paused
                  ? 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30'
                  : 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
              }`}>
                {isBreak ? 'REST BREAK' : activeSession.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#F4F5F8] mb-2 tracking-tight z-10">{activeSession.title}</h1>
            <p className="text-xs text-[#737887] font-mono mb-8 z-10">
              Pomodoro Cycle #{pomodoroCycle} of 4 • {isBreak ? 'Relax & Recharge' : 'Stay Present'}
            </p>

            {/* Large Circular Focus Progress Ring (Violet to Pink Gradient) */}
            <div className="relative w-80 h-80 flex items-center justify-center my-2 z-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <defs>
                  <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B7CFF" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>

                {/* Track Circle */}
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  className="stroke-[#222530] fill-none"
                  strokeWidth="8"
                />

                {/* Animated Progress Circle */}
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  stroke="url(#pomodoroGradient)"
                  className="fill-none transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Digital Timer Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-6xl font-extrabold font-mono text-[#F4F5F8] tracking-tighter">
                  {formatTimer(activeSession.remaining_duration_sec)}
                </span>
                <span className="text-xs text-[#737887] font-mono mt-2 uppercase tracking-wider">
                  {isBreak ? 'Break Remaining' : 'Active Focus Time'}
                </span>
                <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                  <span className="text-[#8B7CFF] font-bold">
                    {ratio > 0 ? `${ratio}% Attention` : 'Verifying...'}
                  </span>
                  <span className="text-[#737887]">•</span>
                  <span className="text-[#A0A4B1]">{att?.away_event_count ?? 0} Away</span>
                </div>
              </div>
            </div>

            {/* Break & Session Action Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10 z-10">
              {activeSession.is_paused ? (
                <button
                  onClick={onResumeSession}
                  className="px-6 py-3 rounded-2xl bg-[#8B7CFF] text-[#0A0B0E] font-bold text-xs hover:bg-[#7A6AE6] flex items-center gap-2 shadow-glow-violet transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume Focus
                </button>
              ) : (
                <button
                  onClick={onPauseSession}
                  className="px-6 py-3 rounded-2xl bg-[#222530] text-[#F4F5F8] border border-[#292D38] hover:bg-[#2C303E] font-semibold text-xs flex items-center gap-2 transition-all"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause Session
                </button>
              )}

              {/* Smart Break Toggles */}
              {!isBreak ? (
                <button
                  onClick={() => onStartBreak && onStartBreak(5)}
                  className="px-5 py-3 rounded-2xl bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899] hover:bg-[#EC4899]/25 font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-pink"
                >
                  <Coffee className="w-4 h-4" />
                  Take 5m Break
                </button>
              ) : (
                <button
                  onClick={() => onEndBreak && onEndBreak()}
                  className="px-5 py-3 rounded-2xl bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] hover:bg-[#4ADE80]/25 font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-attentive"
                >
                  <Zap className="w-4 h-4" />
                  End Break & Resume
                </button>
              )}

              <button
                onClick={onCompleteSession}
                className="px-6 py-3 rounded-2xl bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 text-[#8B7CFF] font-semibold text-xs hover:bg-[#8B7CFF]/25 flex items-center gap-2 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Session
              </button>

              <button
                onClick={onStopSession}
                className="px-5 py-3 rounded-2xl bg-[#14161D] text-[#737887] border border-[#292D38] hover:text-[#F87171] hover:border-[#F87171]/40 font-semibold text-xs flex items-center gap-2 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* If No Active Session: Setup New Session */
        <div className="p-8 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-6 shadow-subtle">
          <div>
            <h2 className="text-xl font-bold text-[#F4F5F8] tracking-tight">Configure Study Session</h2>
            <p className="text-xs text-[#A0A4B1] mt-1">
              Select your study mode, subject, and Pomodoro focus duration. FocusGuard monitors attention continuously.
            </p>
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#737887] mb-1.5 font-semibold">
                Session Goal / Topic Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Graph Algorithms & LeetCode Contest"
                className="w-full px-4 py-3 rounded-xl bg-[#0B0C10] border border-[#292D38] text-sm text-[#F4F5F8] focus:outline-none focus:border-[#8B7CFF] transition-colors"
              />
            </div>

            {/* Subject Picker */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#737887] mb-1.5 font-semibold">
                Subject
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                      subject === sub
                        ? 'border border-[#8B7CFF] bg-[#8B7CFF]/15 text-[#8B7CFF] font-bold shadow-glow-violet'
                        : 'border border-[#292D38] bg-[#0B0C10] text-[#A0A4B1] hover:text-[#F4F5F8]'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              {subject === 'Custom' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter custom subject name..."
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-[#0B0C10] border border-[#292D38] text-xs text-[#F4F5F8] focus:outline-none focus:border-[#8B7CFF]"
                />
              )}
            </div>

            {/* Study Mode Picker */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#737887] mb-1.5 font-semibold">
                Study Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-colors ${
                        isSelected
                          ? 'border-[#8B7CFF] bg-[#8B7CFF]/10 text-[#F4F5F8] shadow-glow-violet'
                          : 'border-[#292D38] bg-[#0B0C10] text-[#A0A4B1] hover:border-[#8B7CFF]/40'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#8B7CFF] text-[#0A0B0E]' : 'bg-[#14161D] text-[#737887]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-[#8B7CFF]' : 'text-[#F4F5F8]'}`}>{m.label}</p>
                        <p className="text-[11px] text-[#737887] mt-0.5 leading-relaxed">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#737887] mb-1.5 font-semibold">
                Focus Duration: <span className="text-[#8B7CFF] font-bold">{durationMin} minutes</span>
              </label>
              <div className="flex gap-2">
                {[15, 25, 45, 50, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationMin(d)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                      durationMin === d
                        ? 'border border-[#8B7CFF] bg-[#8B7CFF]/20 text-[#8B7CFF] font-bold'
                        : 'border border-[#292D38] bg-[#0B0C10] text-[#A0A4B1] hover:text-[#F4F5F8]'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={() => {
                const finalSub = subject === 'Custom' ? (customSubject || 'General Study') : subject;
                onStartSession(title, finalSub, mode, durationMin);
              }}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] text-[#0A0B0E] font-bold text-xs flex items-center justify-center gap-2 shadow-glow-violet hover:opacity-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Begin Focus Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
