import React, { useState } from 'react';
import {
  Clock,
  Target,
  Sparkles,
  Play,
  ArrowRight,
  Maximize2,
  Minimize2,
  Flame,
  CheckCircle2,
  Layers,
  Smile,
  Coffee
} from 'lucide-react';
import { FrameTelemetry, ActiveSession, SessionHistoryItem, AnalyticsSummary, StudyMode } from '../types';

interface DashboardViewProps {
  telemetry: FrameTelemetry | null;
  activeSession: ActiveSession | null;
  recentSessions: SessionHistoryItem[];
  analytics?: AnalyticsSummary | null;
  onStartSession: (title: string, subject: string, mode: StudyMode | string, durationMin: number) => void;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  telemetry,
  activeSession,
  recentSessions,
  analytics,
  onStartSession,
  onNavigate
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [selectedMode, setSelectedMode] = useState<StudyMode>('coding');
  const [customTitle, setCustomTitle] = useState('Deep Focus & Problem Solving');
  const [subject] = useState('Computer Science');
  const [isExpandedCamera, setIsExpandedCamera] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const att = telemetry?.attention;
  const pose = telemetry?.pose;
  const goals = analytics?.goals;

  const attentionRatio = att?.attention_ratio ?? (analytics?.avg_attention_ratio ?? 0);
  const smartBreakSuggested = att?.smart_break_suggested;

  // Time-based welcoming greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (activeSession || isStarting) return;
    setIsStarting(true);
    onStartSession(customTitle, subject, selectedMode, selectedDuration);
    setTimeout(() => setIsStarting(false), 800);
  };

  // Timer ring calculations
  const totalPlannedSec = activeSession ? activeSession.planned_duration_sec : selectedDuration * 60;
  const remainingSec = activeSession ? activeSession.remaining_duration_sec : totalPlannedSec;
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingSec / (totalPlannedSec || 1)));
  const timerRadius = 76;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerStrokeDashoffset = timerCircumference * (1 - progressRatio);

  // Motivational quote of the day
  const motivationalQuotes = [
    'Small wins build deep focus.',
    'Show up. Stay present. Repeat.',
    'One focused minute at a time.',
    'Deep work is the superpower of the 21st century.',
    'Focus on the process, results follow naturally.'
  ];
  const quote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  // 7-day chart calculation from real analytics
  const dailyRecords = analytics?.daily || [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = daysOfWeek[d.getDay()];
    const rec = dailyRecords.find((r) => r.day_date === dateStr);
    const mins = rec ? Math.round(rec.study_sec / 60) : 0;
    return { dateStr, dayName, mins, isToday: i === 6 };
  });
  const maxMins = Math.max(60, ...past7Days.map((d) => d.mins));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Welcome Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" />
            </span>
            <span className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider">
              AI Study Companion
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F3FF] tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">ready to get in the zone?</span>
          </h1>
          <p className="text-xs text-[#A1A1B5] mt-1">
            Zero-cloud, privacy-first computer vision monitoring your natural posture and attention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121426] border border-white/10 text-xs text-[#A1A1B5]">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Today's Target: <strong className="text-[#F5F3FF] font-mono">{goals?.daily_target_minutes ?? 180}m</strong></span>
          </div>
        </div>
      </div>

      {/* Smart Break Recommendation Alert */}
      {smartBreakSuggested && (
        <div className="p-4 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-between shadow-subtle animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FBBF24]/20 text-[#FBBF24]">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#FBBF24]">Smart Break Suggested</h3>
              <p className="text-xs text-[#A1A1B5] mt-0.5">
                Our vision engine noticed subtle fatigue indicators. Taking a 5-minute break will restore cognitive focus.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('session')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FBBF24] text-black hover:bg-[#F59E0B] transition-colors"
          >
            Take 5m Break
          </button>
        </div>
      )}

      {/* 2. Simplified High-Impact Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Focus Time Today */}
        <div className="p-5 rounded-2xl bg-[#121426] border border-white/5 hover:border-[#8B5CF6]/30 transition-all duration-200 shadow-subtle group">
          <div className="flex items-center justify-between text-[#A1A1B5]">
            <span className="text-xs font-medium text-[#63657E]">Focus Today</span>
            <div className="p-2 rounded-xl bg-[#8B5CF6]/10 text-[#A78BFA] group-hover:bg-[#8B5CF6]/20 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-mono">
              {goals?.daily_current_minutes ? `${goals.daily_current_minutes}m` : formatSec(att?.attentive_sec ?? 0)}
            </span>
            <p className="text-[11px] text-[#A1A1B5] mt-0.5">
              Goal: {goals?.daily_target_minutes ?? 180}m ({goals?.daily_progress_percent ?? 0}%)
            </p>
          </div>
          <div className="w-full bg-[#0E1020] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, goals?.daily_progress_percent ?? 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Attention Ratio */}
        <div className="p-5 rounded-2xl bg-[#121426] border border-white/5 hover:border-[#8B5CF6]/30 transition-all duration-200 shadow-subtle group">
          <div className="flex items-center justify-between text-[#A1A1B5]">
            <span className="text-xs font-medium text-[#63657E]">Attention Ratio</span>
            <div className="p-2 rounded-xl bg-[#34D399]/10 text-[#34D399] group-hover:bg-[#34D399]/20 transition-colors">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-mono">
              {attentionRatio > 0 ? `${Math.round(attentionRatio)}%` : '—'}
            </span>
            <p className="text-[11px] text-[#A1A1B5] mt-0.5">
              {attentionRatio >= 75 ? 'Optimal high focus' : attentionRatio > 0 ? 'Normal attentiveness' : 'Awaiting active session'}
            </p>
          </div>
          <div className="w-full bg-[#0E1020] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#34D399] to-[#38BDF8] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, attentionRatio))}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Completed Sessions */}
        <div className="p-5 rounded-2xl bg-[#121426] border border-white/5 hover:border-[#8B5CF6]/30 transition-all duration-200 shadow-subtle group">
          <div className="flex items-center justify-between text-[#A1A1B5]">
            <span className="text-xs font-medium text-[#63657E]">Sessions Done</span>
            <div className="p-2 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] group-hover:bg-[#38BDF8]/20 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-mono">
              {analytics?.total_sessions ?? recentSessions.length}
            </span>
            <p className="text-[11px] text-[#A1A1B5] mt-0.5">
              {goals?.today_sessions ?? 0} completed today
            </p>
          </div>
          <div className="text-[11px] text-[#38BDF8] flex items-center gap-1.5 font-medium">
            <span>Verified in SQLite</span>
          </div>
        </div>

        {/* Metric 4: Daily Streak */}
        <div className="p-5 rounded-2xl bg-[#121426] border border-white/5 hover:border-[#8B5CF6]/30 transition-all duration-200 shadow-subtle group">
          <div className="flex items-center justify-between text-[#A1A1B5]">
            <span className="text-xs font-medium text-[#63657E]">Study Streak</span>
            <div className="p-2 rounded-xl bg-[#FBBF24]/10 text-[#FBBF24] group-hover:bg-[#FBBF24]/20 transition-colors">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-[#F5F3FF] tracking-tight font-mono">
              {goals?.streak_days ? `${goals.streak_days} days` : '1 day'}
            </span>
            <p className="text-[11px] text-[#A1A1B5] mt-0.5">
              Keep consistency alive
            </p>
          </div>
          <div className="text-[11px] text-[#FBBF24] flex items-center gap-1.5 font-medium">
            <Flame className="w-3 h-3 fill-current" />
            <span>Active focus streak</span>
          </div>
        </div>
      </div>

      {/* 3. Main Stage: Prominent Live Camera Preview & Interactive Focus Timer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Hero Live Camera Viewport */}
        <div className={`lg:col-span-7 p-6 rounded-3xl bg-[#121426] border border-white/5 flex flex-col justify-between shadow-elevated relative overflow-hidden transition-all duration-300 ${isExpandedCamera ? 'lg:col-span-12' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center text-[#A78BFA] border border-[#8B5CF6]/20">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F5F3FF] tracking-tight">Live Vision Monitor</h2>
                <p className="text-[11px] text-[#63657E]">Real-time facial landmark mesh & posture tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpandedCamera(!isExpandedCamera)}
                className="p-2 rounded-xl bg-[#0E1020] border border-white/5 text-[#A1A1B5] hover:text-[#F5F3FF] hover:border-white/10 transition-colors"
                title={isExpandedCamera ? 'Compact View' : 'Expand View'}
              >
                {isExpandedCamera ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onNavigate('monitor')}
                className="px-3 py-1.5 rounded-xl bg-[#0E1020] border border-white/5 hover:border-[#8B5CF6]/40 text-xs text-[#A78BFA] hover:text-[#F5F3FF] flex items-center gap-1.5 font-medium transition-all"
              >
                Full HUD <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Camera Frame Viewport */}
          <div className="w-full aspect-video bg-[#080910] rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10 group shadow-inner">
            {telemetry?.preview_base64 ? (
              <img
                src={`data:image/jpeg;base64,${telemetry.preview_base64}`}
                alt="Live Camera Feed"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-[#63657E]">
                <Smile className="w-10 h-10 stroke-[1.5] animate-pulse text-[#8B5CF6]" />
                <p className="text-xs text-[#A1A1B5]">Connecting to /dev/video0 camera stream...</p>
              </div>
            )}

            {/* Glowing Corner Brackets for Luxury Edge Accent */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#8B5CF6]/60 pointer-events-none rounded-tl-sm" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#8B5CF6]/60 pointer-events-none rounded-tr-sm" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#38BDF8]/60 pointer-events-none rounded-bl-sm" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#38BDF8]/60 pointer-events-none rounded-br-sm" />

            {/* Floating Live Status Pill */}
            <div className="absolute top-3 left-3 ml-6 bg-[#090A12]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-[#F5F3FF] flex items-center gap-2 shadow-elevated">
              <span className={`w-2 h-2 rounded-full ${telemetry?.has_face ? 'bg-[#34D399] shadow-glow-attentive animate-pulse' : 'bg-[#FBBF24]'}`} />
              <span>{telemetry?.has_face ? "You're looking focused" : 'Adjusting face gaze...'}</span>
            </div>

            {/* Discrete Diagnostics Badge */}
            {pose && pose.valid && (
              <div className="absolute bottom-3 left-3 ml-6 bg-[#090A12]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] text-[#A1A1B5] font-mono flex items-center gap-3">
                <span>Yaw <strong className="text-[#A78BFA]">{pose.yaw > 0 ? `+${pose.yaw}` : pose.yaw}°</strong></span>
                <span>Pitch <strong className="text-[#38BDF8]">{pose.pitch > 0 ? `+${pose.pitch}` : pose.pitch}°</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right (5 cols): Interactive Focus Session & Pomodoro Controller */}
        <div className={`lg:col-span-5 p-6 rounded-3xl bg-[#121426] border border-white/5 flex flex-col justify-between shadow-elevated ${isExpandedCamera ? 'hidden' : ''}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A78BFA]" />
                <h2 className="text-sm font-bold text-[#F5F3FF] tracking-tight">Focus Session</h2>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
                {activeSession ? 'IN PROGRESS' : 'READY'}
              </span>
            </div>

            {activeSession ? (
              /* Active Timer Mode */
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                {/* Circular Animated Focus Ring */}
                <div className="relative w-44 h-44 flex items-center justify-center my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                    <defs>
                      <linearGradient id="dashTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#38BDF8" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="90"
                      cy="90"
                      r={timerRadius}
                      className="stroke-white/5 fill-none"
                      strokeWidth="7"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r={timerRadius}
                      stroke="url(#dashTimerGrad)"
                      className="fill-none transition-all duration-500 ease-out"
                      strokeWidth="7"
                      strokeDasharray={timerCircumference}
                      strokeDashoffset={timerStrokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-extrabold font-mono text-[#F5F3FF] tracking-tight">
                      {formatTimer(activeSession.remaining_duration_sec)}
                    </span>
                    <span className="text-[10px] text-[#63657E] uppercase tracking-wider mt-1 font-semibold">
                      {activeSession.is_break ? 'Break Time' : 'Deep Work'}
                    </span>
                  </div>
                </div>

                <div className="w-full p-3.5 rounded-2xl bg-[#0E1020] border border-white/5 text-left">
                  <p className="text-xs font-semibold text-[#F5F3FF] truncate">{activeSession.title}</p>
                  <p className="text-[11px] text-[#A1A1B5] mt-0.5">{activeSession.subject} • {activeSession.mode} mode</p>
                </div>

                <button
                  onClick={() => onNavigate('session')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-glow-violet transition-all"
                >
                  Session Controls & Break <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Idle / Start Focus Session Mode */
              <div className="space-y-4">
                {/* Duration Presets */}
                <div>
                  <label className="text-[11px] text-[#63657E] font-medium block mb-2">Duration Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '25m Focus', min: 25 },
                      { label: '45m Deep', min: 45 },
                      { label: '50m Flow', min: 50 },
                    ].map((preset) => (
                      <button
                        key={preset.min}
                        onClick={() => setSelectedDuration(preset.min)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedDuration === preset.min
                            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 text-[#F5F3FF] shadow-glow-violet'
                            : 'bg-[#0E1020] border border-white/5 text-[#A1A1B5] hover:text-[#F5F3FF]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div>
                  <label className="text-[11px] text-[#63657E] font-medium block mb-2">Study Mode</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['coding', 'reading', 'lecture', 'revision'] as StudyMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMode(m)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all ${
                          selectedMode === m
                            ? 'bg-gradient-to-r from-[#8B5CF6]/25 to-[#38BDF8]/25 text-[#F5F3FF] border border-[#8B5CF6]/40'
                            : 'bg-[#0E1020] border border-white/5 text-[#63657E] hover:text-[#A1A1B5]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Title Input */}
                <div>
                  <label className="text-[11px] text-[#63657E] font-medium block mb-1">Session Subject / Goal</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Graph Algorithms & Problem Solving"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0E1020] border border-white/5 text-xs text-[#F5F3FF] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                  />
                </div>

                {/* Prominent Gradient Start Button (Prevents duplicate clicks) */}
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#38BDF8] hover:opacity-95 text-[#090A12] font-bold text-xs flex items-center justify-center gap-2 shadow-glow-violet transition-all transform active:scale-[0.99] disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isStarting ? 'Starting Session...' : `Start ${selectedDuration}m Focus Session`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Weekly Focus Visualization & Recent Sessions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Weekly Focus Chart (7-Day Visualization from Real Data) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#121426] border border-white/5 shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-[#F5F3FF] tracking-tight">7-Day Focus Time</h2>
              <p className="text-[11px] text-[#63657E]">Daily monitored study duration in minutes</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-[#A78BFA] hover:text-[#F5F3FF] font-medium transition-colors"
            >
              Detailed Insights →
            </button>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {past7Days.map((d, idx) => {
              const heightPercent = Math.max(8, Math.round((d.mins / maxMins) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded-lg bg-[#0E1020] border border-white/10 text-[10px] text-[#F5F3FF] whitespace-nowrap pointer-events-none shadow-elevated z-10 font-mono">
                    {d.mins} mins
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-[#0E1020] h-32 rounded-xl flex items-end p-1 border border-white/5 overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        d.isToday
                          ? 'bg-gradient-to-t from-[#8B5CF6] to-[#38BDF8] shadow-glow-violet'
                          : 'bg-white/10 group-hover:bg-[#8B5CF6]/50'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span className={`text-[11px] ${d.isToday ? 'text-[#A78BFA] font-bold' : 'text-[#63657E]'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Recent Completed Sessions Table */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#121426] border border-white/5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#F5F3FF] tracking-tight">Recent Sessions</h2>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-[#A78BFA] hover:text-[#F5F3FF] font-medium transition-colors"
              >
                All History →
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-12 text-[#63657E] text-xs space-y-2">
                <Target className="w-8 h-8 mx-auto text-[#63657E]/50 stroke-[1.5]" />
                <p>No completed study sessions yet.</p>
                <p className="text-[11px] text-[#A1A1B5]">Start your first focus session above to record attention.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSessions.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onNavigate('history')}
                    className="p-3 rounded-2xl bg-[#0E1020] border border-white/5 hover:border-white/10 cursor-pointer flex items-center justify-between transition-all group"
                  >
                    <div className="truncate mr-3">
                      <p className="text-xs font-semibold text-[#F5F3FF] group-hover:text-[#A78BFA] transition-colors truncate">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-[#63657E]">
                        {s.subject} • {Math.round(s.active_duration_sec / 60)}m duration
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#34D399] font-mono">
                        {s.attention_ratio}%
                      </span>
                      <p className="text-[9px] text-[#63657E]">attention</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Encouraging Subtle Motivational Footer */}
      <div className="py-4 px-6 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/5 via-[#38BDF8]/5 to-transparent border border-white/5 flex items-center justify-between text-xs text-[#A1A1B5]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span className="italic tracking-tight">"{quote}"</span>
        </div>
        <span className="text-[10px] text-[#63657E] hidden sm:inline">FocusGuard AI • Privacy-First Study Companion</span>
      </div>
    </div>
  );
};
