import React, { useState } from 'react';
import {
  Trash2,
  Filter,
  AlertTriangle,
  X,
  FileText,
  Search
} from 'lucide-react';
import { SessionHistoryItem } from '../types';
import { api } from '../services/api';

interface HistoryViewProps {
  sessions: SessionHistoryItem[];
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onRefresh }) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<{ session: SessionHistoryItem; events: any[] } | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const subjects = ['all', ...Array.from(new Set(sessions.map((s) => s.subject)))];

  const filtered = sessions.filter((s) => {
    if (subjectFilter !== 'all' && s.subject !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.mode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenDetail = async (id: string) => {
    setSelectedSessionId(id);
    setLoadingDetail(true);
    try {
      const data = await api.getSessionDetail(id);
      setSessionDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this session record?')) {
      await api.deleteSession(id);
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
        setSessionDetail(null);
      }
      onRefresh();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL study session history? This action cannot be undone.')) {
      await api.clearAllHistory();
      setSelectedSessionId(null);
      setSessionDetail(null);
      onRefresh();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
              Persistent Records
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
            Study Session History & Event Logs
          </h1>
          <p className="text-xs text-[#A0A4B1] mt-1">
            Complete local audit trail of your focused study sessions, attention ratios, and distraction timestamps.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2.5 rounded-2xl border border-[#F87171]/30 bg-[#F87171]/10 hover:bg-[#F87171]/20 text-[#F87171] text-xs font-mono font-semibold flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All History
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#14161D] border border-[#292D38]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737887]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, or mode..."
            className="w-full bg-[#0B0C10] border border-[#292D38] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#F4F5F8] placeholder-[#737887] focus:outline-none focus:border-[#8B7CFF] transition-all"
          />
        </div>

        {/* Subject Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#737887] shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                  subjectFilter === sub
                    ? 'bg-[#8B7CFF] text-[#0A0B0E] shadow-glow-violet'
                    : 'bg-[#0B0C10] border border-[#292D38] text-[#A0A4B1] hover:text-[#F4F5F8]'
                }`}
              >
                {sub === 'all' ? 'All Subjects' : sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="rounded-3xl bg-[#14161D] border border-[#292D38] overflow-hidden shadow-subtle">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-[#737887] text-xs font-mono">
            No study sessions found matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#292D38] bg-[#0B0C10] text-[#737887] font-mono uppercase text-[10px]">
                  <th className="py-3.5 px-6">Session Title</th>
                  <th className="py-3.5 px-4">Subject & Mode</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Attention</th>
                  <th className="py-3.5 px-4">Blinks / Yawns</th>
                  <th className="py-3.5 px-4">Distractions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292D38]/50">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleOpenDetail(s.id)}
                    className="hover:bg-[#222530]/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <p className="font-semibold text-[#F4F5F8] group-hover:text-[#8B7CFF] transition-colors">{s.title}</p>
                      <span className="text-[10px] text-[#737887] font-mono">
                        {s.start_time.substring(0, 19).replace('T', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#222530] text-[#8B7CFF] border border-[#292D38] text-[10px] font-mono font-semibold">
                        {s.subject}
                      </span>
                      <span className="ml-2 text-[10px] text-[#A0A4B1] font-mono">
                        {s.mode}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#F4F5F8]">
                      {Math.round(s.active_duration_sec / 60)} min
                    </td>
                    <td className="py-4 px-4 font-mono font-extrabold text-[#4ADE80]">
                      {s.attention_ratio}%
                    </td>
                    <td className="py-4 px-4 text-[#A0A4B1] font-mono text-[11px]">
                      {s.blink_count} blinks • {s.yawn_count} yawns
                    </td>
                    <td className="py-4 px-4 font-mono text-[#FBBF24]">
                      {s.away_event_count}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          s.status === 'COMPLETED'
                            ? 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30'
                            : 'bg-[#222530] text-[#A0A4B1] border-[#292D38]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        title="Delete record"
                        className="p-2 rounded-xl text-[#737887] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#14161D] border border-[#292D38] rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#292D38] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#F4F5F8] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8B7CFF]" />
                  Session Audit Log & Telemetry
                </h3>
                <p className="text-[10px] text-[#737887] mt-0.5 font-mono">
                  ID: {selectedSessionId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSessionId(null);
                  setSessionDetail(null);
                }}
                className="p-2 rounded-xl text-[#737887] hover:text-[#F4F5F8] hover:bg-[#222530] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-[#8B7CFF] font-mono animate-pulse">
                Fetching session events and pose telemetry from SQLite...
              </div>
            ) : sessionDetail ? (
              <div className="space-y-5">
                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                    <span className="text-[10px] text-[#737887] uppercase">Attention Ratio</span>
                    <p className="text-xl font-extrabold text-[#4ADE80] mt-1">
                      {sessionDetail.session.attention_ratio}%
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                    <span className="text-[10px] text-[#737887] uppercase">Attentive Time</span>
                    <p className="text-xl font-extrabold text-[#F4F5F8] mt-1">
                      {Math.round(sessionDetail.session.attentive_sec / 60)} min
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0B0C10] border border-[#292D38]">
                    <span className="text-[10px] text-[#737887] uppercase">Away Time</span>
                    <p className="text-xl font-extrabold text-[#FBBF24] mt-1">
                      {Math.round(sessionDetail.session.away_sec / 60)} min
                    </p>
                  </div>
                </div>

                {/* Event Logs Timeline */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-[#A0A4B1] mb-3 font-bold tracking-wider">
                    Timestamped Detection Events ({sessionDetail.events.length})
                  </h4>
                  {sessionDetail.events.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#0B0C10] border border-[#292D38] text-center text-xs text-[#737887] font-mono">
                      No sustained distraction or alert triggers logged during this session. Flawless focus!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto font-mono">
                      {sessionDetail.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-2xl bg-[#0B0C10] border border-[#292D38] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <AlertTriangle className={`w-3.5 h-3.5 ${ev.alert_triggered ? 'text-[#F87171]' : 'text-[#FBBF24]'}`} />
                            <span className="font-semibold text-[#F4F5F8]">{ev.event_type}</span>
                            <span className="text-[10px] text-[#737887]">
                              ({ev.duration_sec.toFixed(1)}s away)
                            </span>
                          </div>
                          <span className="text-[10px] text-[#737887]">
                            {ev.start_time.substring(11, 19)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
