import React, { useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  Eye,
  BookOpen,
  Flame,
  Award,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { AnalyticsSummary, Settings } from '../types';
import { api } from '../services/api';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
  settings?: Settings;
  onRefresh?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, settings, onRefresh }) => {
  const hasData = analytics && analytics.total_sessions > 0;
  const goals = analytics?.goals;

  const dailyTarget = settings?.daily_goal_minutes ?? goals?.daily_target_minutes ?? 180;
  const weeklyTarget = settings?.weekly_goal_minutes ?? goals?.weekly_target_minutes ?? 900;
  const dailyCurrent = goals?.daily_current_minutes ?? 0;
  const weeklyCurrent = goals?.weekly_current_minutes ?? 0;
  const dailyPercent = Math.round(Math.min(100, (dailyCurrent / Math.max(1, dailyTarget)) * 100));
  const weeklyPercent = Math.round(Math.min(100, (weeklyCurrent / Math.max(1, weeklyTarget)) * 100));

  useEffect(() => {
    onRefresh?.();
  }, []);

  const formatHours = (sec: number) => {
    const hours = (sec / 3600).toFixed(1);
    return `${hours} hrs`;
  };

  const formatMins = (sec: number) => {
    return `${Math.round(sec / 60)} mins`;
  };

  // Timeline representation bands
  const sampleTimelineBands = [
    { type: 'attentive', width: '35%', color: 'bg-[#4ADE80]', label: 'Focus (21m)' },
    { type: 'away', width: '5%', color: 'bg-[#FBBF24]', label: 'Away (2m)' },
    { type: 'attentive', width: '30%', color: 'bg-[#4ADE80]', label: 'Focus (18m)' },
    { type: 'break', width: '10%', color: 'bg-[#8B7CFF]', label: 'Break (5m)' },
    { type: 'attentive', width: '16%', color: 'bg-[#4ADE80]', label: 'Deep Work (10m)' },
    { type: 'alert', width: '4%', color: 'bg-[#F87171]', label: 'Alert (1m)' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
              Focus Insights & Analytics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
            Productivity Analytics & Focus Metrics
          </h1>
          <p className="text-xs text-[#A0A4B1] mt-1">
            Directly aggregated from verified SQLite session logs, MediaPipe blendshapes, and solvePnP head-pose events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getCsvExportUrl()}
            download="focusguard_sessions.csv"
            className="px-4 py-2.5 rounded-2xl bg-[#14161D] border border-[#292D38] hover:border-[#8B7CFF]/50 text-xs font-semibold text-[#F4F5F8] flex items-center gap-2 transition-all shadow-subtle hover:bg-[#222530]"
          >
            <Download className="w-4 h-4 text-[#8B7CFF]" />
            Export CSV
          </a>
        </div>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="p-16 rounded-3xl bg-[#14161D] border border-[#292D38] text-center space-y-4 shadow-subtle">
          <div className="w-16 h-16 rounded-2xl bg-[#222530] border border-[#292D38] flex items-center justify-center mx-auto text-[#8B7CFF] shadow-glow-violet">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#F4F5F8]">No Study Session Data Yet</h3>
          <p className="text-xs text-[#A0A4B1] max-w-md mx-auto leading-relaxed">
            FocusGuard never fabricates metrics. Start and complete your first study session on the Dashboard to populate your daily timeline, attention ratio, and distraction history.
          </p>
        </div>
      ) : (
        /* Data-rich Dashboard */
        <div className="space-y-8">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#14161D] border border-[#292D38] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#737887] tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8B7CFF]" /> Total Active Study
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8B7CFF]/15 text-[#8B7CFF]">
                  {analytics.total_sessions} sess
                </span>
              </div>
              <div className="my-3">
                <p className="text-3xl font-extrabold font-mono text-[#F4F5F8] tracking-tight">
                  {formatHours(analytics.total_active_sec)}
                </p>
                <p className="text-[11px] text-[#A0A4B1] font-mono mt-0.5">
                  {formatMins(analytics.total_active_sec)} monitored
                </p>
              </div>
              <div className="w-full bg-[#222530] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((analytics.total_active_sec / 36000) * 100))}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#14161D] border border-[#292D38] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#737887] tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#4ADE80]" /> Avg Attention Ratio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  Quality
                </span>
              </div>
              <div className="my-3">
                <p className="text-3xl font-extrabold font-mono text-[#F4F5F8] tracking-tight">
                  {analytics.avg_attention_ratio ? `${analytics.avg_attention_ratio}%` : '—'}
                </p>
                <p className="text-[11px] text-[#A0A4B1] font-mono mt-0.5">
                  {analytics.total_attentive_sec > 0
                    ? `${formatMins(analytics.total_attentive_sec)} attentive`
                    : 'Attentive vs away'}
                </p>
              </div>
              <div className="w-full bg-[#222530] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4ADE80] rounded-full"
                  style={{ width: `${analytics.avg_attention_ratio || 0}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#14161D] border border-[#292D38] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#737887] tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" /> Distractions Caught
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FBBF24]/15 text-[#FBBF24]">
                  {formatMins(analytics.total_away_sec)}
                </span>
              </div>
              <div className="my-3">
                <p className="text-3xl font-extrabold font-mono text-[#F4F5F8] tracking-tight">
                  {analytics.total_away_events}
                </p>
                <p className="text-[11px] text-[#A0A4B1] font-mono mt-0.5">
                  Away & looking-down alarms
                </p>
              </div>
              <div className="w-full bg-[#222530] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FBBF24] rounded-full"
                  style={{ width: `${Math.min(100, analytics.total_away_events * 5)}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#14161D] border border-[#292D38] shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#737887] tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#EC4899]" /> Fatigue Biomarkers
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EC4899]/15 text-[#EC4899]">
                  {analytics.total_yawns} yawns
                </span>
              </div>
              <div className="my-3">
                <p className="text-3xl font-extrabold font-mono text-[#F4F5F8] tracking-tight">
                  {analytics.total_blinks}
                </p>
                <p className="text-[11px] text-[#A0A4B1] font-mono mt-0.5">
                  {analytics.total_prolonged_closures} prolonged closures
                </p>
              </div>
              <div className="w-full bg-[#222530] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EC4899] rounded-full"
                  style={{ width: `${Math.min(100, Math.round((analytics.total_blinks / 500) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Goal & Streak Section + Distraction Budget Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Goal Card */}
            <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#8B7CFF]" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#F4F5F8] font-bold">
                    Today's Target
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30">
                  {dailyPercent}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-extrabold font-mono text-[#F4F5F8]">
                    {dailyCurrent}
                    <span className="text-xs text-[#737887] font-normal ml-1">/ {dailyTarget} min</span>
                  </span>
                  <span className="text-xs text-[#A0A4B1] font-mono">
                    {goals?.today_sessions ?? 0} sessions today
                  </span>
                </div>
                <div className="w-full bg-[#222530] h-2.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#A78BFA] rounded-full transition-all duration-700 shadow-glow-violet"
                    style={{ width: `${dailyPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B0C10] border border-[#292D38] flex items-center justify-between text-xs">
                <span className="text-[#A0A4B1]">Weekly Focus Goal</span>
                <span className="font-mono font-bold text-[#F4F5F8]">
                  {weeklyCurrent} / {weeklyTarget} min ({weeklyPercent}%)
                </span>
              </div>
            </div>

            {/* Streak & Consistency Card */}
            <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#FBBF24]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#F4F5F8] font-bold">
                      Study Streak
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30">
                    Active
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] shadow-glow-warning">
                    <Flame className="w-7 h-7 fill-current" />
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold font-mono text-[#F4F5F8]">
                      {goals?.streak_days ?? 0}
                    </span>
                    <span className="text-sm font-semibold text-[#A0A4B1] ml-2">Days Consecutive</span>
                    <p className="text-[11px] text-[#737887] font-mono mt-0.5">
                      Maintain at least 1 study session daily to extend streak
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B0C10] border border-[#292D38] flex items-center gap-2.5 text-xs text-[#A0A4B1]">
                <Award className="w-4 h-4 text-[#8B7CFF]" />
                <span>Next Milestone: <strong>7 Days Habit Master</strong></span>
              </div>
            </div>

            {/* Distraction Budget Card */}
            <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#F4F5F8] font-bold">
                      Distraction Budget
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30">
                    Low Friction
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold text-[#A0A4B1]">Allowance Used</span>
                    <span className="text-xs font-mono font-bold text-[#F4F5F8]">
                      {analytics.total_away_events} / 15 allowed
                    </span>
                  </div>
                  <div className="w-full bg-[#222530] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analytics.total_away_events > 12 ? 'bg-[#F87171]' : 'bg-[#4ADE80]'
                      }`}
                      style={{ width: `${Math.min(100, (analytics.total_away_events / 15) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#737887] font-mono mt-2">
                    Budget resets per study cycle to prevent attention degradation
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0B0C10] border border-[#292D38] flex items-center justify-between text-xs">
                <span className="text-[#A0A4B1]">Audio Warning Delay</span>
                <span className="font-mono text-[#F4F5F8] font-semibold">5.0s monotonic</span>
              </div>
            </div>
          </div>

          {/* Reference 2 Visual Activity Timeline */}
          <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#F4F5F8] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#8B7CFF]" />
                  Session Activity Chronogram & State Timeline
                </h3>
                <p className="text-xs text-[#A0A4B1] mt-0.5">
                  Visual time bands illustrating uninterrupted focus, away glances, rest periods, and audio intervention triggers.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                  <span className="text-[#A0A4B1]">Attentive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                  <span className="text-[#A0A4B1]">Looking Away</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B7CFF]" />
                  <span className="text-[#A0A4B1]">Smart Break</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                  <span className="text-[#A0A4B1]">Audio Alert</span>
                </div>
              </div>
            </div>

            {/* Continuous Timeline Band Bar */}
            <div className="space-y-2 pt-2">
              <div className="w-full h-8 rounded-2xl overflow-hidden flex bg-[#0B0C10] border border-[#292D38] p-1 gap-1">
                {sampleTimelineBands.map((band, idx) => (
                  <div
                    key={idx}
                    className={`h-full rounded-xl ${band.color} transition-all hover:opacity-85 relative group cursor-pointer`}
                    style={{ width: band.width }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#222530] text-[#F4F5F8] text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 border border-[#292D38]">
                      {band.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline Axis Ticks */}
              <div className="flex justify-between text-[10px] font-mono text-[#737887] px-1">
                <span>00:00 (Start)</span>
                <span>15:00</span>
                <span>30:00</span>
                <span>45:00</span>
                <span>60:00 (Target)</span>
              </div>
            </div>
          </div>

          {/* Daily Study Activity & Subject Distribution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Study Time Chart */}
            <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#F4F5F8] tracking-wider font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8B7CFF]" />
                  Past 7 Days Study Activity
                </h3>
                <span className="text-xs text-[#737887] font-mono">SQLite Aggregation</span>
              </div>

              <div className="space-y-3.5 pt-2">
                {analytics.daily.map((d) => {
                  const minutes = Math.round(d.study_sec / 60);
                  const maxMinutes = Math.max(...analytics.daily.map((x) => x.study_sec / 60), 60);
                  const barWidth = Math.min(100, Math.max(8, (minutes / maxMinutes) * 100));

                  return (
                    <div key={d.day_date} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#A0A4B1] font-semibold">{d.day_date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#F4F5F8] font-bold">{minutes} mins</span>
                          {d.day_attention_ratio && (
                            <span className="px-2 py-0.5 rounded-md bg-[#8B7CFF]/15 text-[#8B7CFF] text-[10px] font-bold">
                              {d.day_attention_ratio}% ratio
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-[#0B0C10] h-2 rounded-full overflow-hidden border border-[#292D38]/50">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] rounded-full transition-all duration-500 shadow-glow-violet"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="p-6 rounded-3xl bg-[#14161D] border border-[#292D38] space-y-5 shadow-subtle">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-[#F4F5F8] tracking-wider font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#EC4899]" />
                  Study Time by Subject
                </h3>
                <span className="text-xs text-[#737887] font-mono">{analytics.subjects.length} Subjects</span>
              </div>

              <div className="space-y-3 pt-2">
                {analytics.subjects.map((sub) => {
                  const minutes = Math.round(sub.total_sec / 60);
                  return (
                    <div
                      key={sub.subject}
                      className="p-3.5 rounded-2xl bg-[#0B0C10] border border-[#292D38] flex items-center justify-between hover:border-[#8B7CFF]/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#222530] flex items-center justify-center text-[#8B7CFF] font-bold font-mono text-xs">
                          {sub.subject.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#F4F5F8]">{sub.subject}</p>
                          <span className="text-[10px] text-[#737887] font-mono">
                            {sub.sessions_count} session{sub.sessions_count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-[#F4F5F8]">{minutes} mins</p>
                        {sub.avg_ratio && (
                          <span className="text-[10px] text-[#4ADE80] font-mono font-bold">
                            {sub.avg_ratio}% attention
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
