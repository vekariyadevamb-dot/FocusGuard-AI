import React from 'react';
import {
  LayoutDashboard,
  Camera,
  Timer,
  BarChart3,
  History,
  Compass,
  Sliders,
  Volume2,
  ShieldCheck
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'monitor'
  | 'session'
  | 'analytics'
  | 'history'
  | 'calibration'
  | 'modes'
  | 'settings'
  | 'privacy';

interface SidebarProps {
  currentTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  isSessionActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, isSessionActive }) => {
  const navigationGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'monitor', label: 'Live Focus', icon: Camera },
        { id: 'session', label: 'Focus Sessions', icon: Timer, badge: isSessionActive ? 'ACTIVE' : undefined },
      ]
    },
    {
      group: 'INSIGHTS',
      items: [
        { id: 'analytics', label: 'Insights & Goals', icon: BarChart3 },
        { id: 'history', label: 'Session History', icon: History },
      ]
    },
    {
      group: 'PREFERENCES',
      items: [
        { id: 'calibration', label: 'Calibration', icon: Compass },
        { id: 'modes', label: 'Study Modes', icon: Sliders },
        { id: 'settings', label: 'Alerts & Audio', icon: Volume2 },
        { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#080910] border-r border-white/5 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header with Custom Focus-Ring / Eye Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] p-[1px] shadow-glow-violet relative overflow-hidden group">
            <div className="w-full h-full bg-[#0E1020] rounded-[15px] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#A78BFA] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" fill="#8B5CF6" />
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="8" strokeDasharray="3 3" className="opacity-40" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#F5F3FF]">FocusGuard</span>
              <span className="text-[9px] uppercase tracking-wider text-[#A78BFA] bg-[#8B5CF6]/15 px-1.5 py-0.5 rounded-md border border-[#8B5CF6]/30 font-semibold">
                AI
              </span>
            </div>
            <p className="text-[11px] text-[#63657E] tracking-tight mt-0.5">Study companion</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-3.5 py-4 space-y-6">
          {navigationGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 pb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#63657E] font-semibold">
                  {grp.group}
                </span>
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id as NavItem)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-[#8B5CF6]/5 text-[#F5F3FF] border border-[#8B5CF6]/40 shadow-glow-violet'
                        : 'text-[#A1A1B5] hover:text-[#F5F3FF] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#A78BFA]' : 'text-[#63657E] group-hover:text-[#A1A1B5]'}`} />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-gradient-to-b from-[#8B5CF6] to-[#38BDF8] rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info: Engine & Hardware Status */}
      <div className="p-4 m-3 rounded-2xl bg-[#0E1020] border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-[#A1A1B5]">
            <span className="w-2 h-2 rounded-full bg-[#34D399] shadow-glow-attentive animate-pulse" />
            <span className="text-xs font-medium tracking-tight">Vision Engine</span>
          </span>
          <span className="text-[10px] text-[#A78BFA] font-medium bg-[#8B5CF6]/15 px-2 py-0.5 rounded-md border border-[#8B5CF6]/20">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#63657E]">
          <span>Camera: /dev/video0</span>
          <span className="text-[#38BDF8]">100% Local</span>
        </div>
      </div>
    </aside>
  );
};
