import React from 'react';
import { Sliders, Code2, BookOpen, Headphones, RotateCcw, Check } from 'lucide-react';
import { StudyMode } from '../types';

interface StudyModesViewProps {
  activeMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
}

export const StudyModesView: React.FC<StudyModesViewProps> = ({ activeMode, onSelectMode }) => {
  const modes: Array<{
    id: StudyMode;
    title: string;
    tagline: string;
    description: string;
    yawThreshold: string;
    pitchThreshold: string;
    icon: any;
    recommendedFor: string;
  }> = [
    {
      id: 'coding',
      title: 'Coding Mode',
      tagline: 'Built for software development, terminal work & DSA',
      description:
        'Allows natural downward glances at notebooks, keyboard, or secondary IDE terminal without triggering false distraction alarms. Generous pitch-down margin of -30°.',
      yawThreshold: '±25°',
      pitchThreshold: '+18° up / -30° down',
      icon: Code2,
      recommendedFor: 'Competitive Programming, LeetCode, Full-Stack Dev'
    },
    {
      id: 'reading',
      title: 'Reading Mode',
      tagline: 'Tailored for textbooks, research papers & documentation',
      description:
        'Accommodates wide saccadic eye movements and line-by-line scanning across long text or dual-monitor PDF readers. Relaxed horizontal margins.',
      yawThreshold: '±28°',
      pitchThreshold: '±22°',
      icon: BookOpen,
      recommendedFor: 'Research papers, textbooks, exam revision'
    },
    {
      id: 'lecture',
      title: 'Lecture Mode',
      tagline: 'High-attentiveness mode for video tutorials & online classes',
      description:
        'Maintains stricter head orientation thresholds to alert you when your attention drifts away from an online lecture or video tutorial.',
      yawThreshold: '±18°',
      pitchThreshold: '+16° / -20°',
      icon: Headphones,
      recommendedFor: 'Coursera, YouTube lectures, live webinars'
    },
    {
      id: 'revision',
      title: 'Revision Mode',
      tagline: 'Pomodoro intervals with planned active recall breaks',
      description:
        'Balances disciplined focus sessions with prompt smart break reminders to prevent cognitive burnout and maximize memory retention.',
      yawThreshold: '±22°',
      pitchThreshold: '±20°',
      icon: RotateCcw,
      recommendedFor: 'Flashcards, formula sheets, mock test reviews'
    },
    {
      id: 'custom',
      title: 'Custom Mode',
      tagline: 'User-configurable thresholds and sensitivity',
      description:
        'Fine-tune your own angular degrees, cooldown periods, and alert thresholds in the Alerts & Audio settings.',
      yawThreshold: 'Configurable',
      pitchThreshold: 'Configurable',
      icon: Sliders,
      recommendedFor: 'Special desk ergonomic setups and multi-monitor rigs'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#8B7CFF] animate-pulse shadow-glow-violet" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B7CFF] font-semibold">
            Contextual Adaptation
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#F4F5F8] tracking-tight">
          Configured Study Modes
        </h1>
        <p className="text-xs text-[#A0A4B1] mt-1">
          Each mode applies genuine computer-vision angular tolerances to prevent false alerts based on activity ergonomics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;

          return (
            <div
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`p-7 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-[#8B7CFF] bg-[#14161D] shadow-glow-violet ring-1 ring-[#8B7CFF]/50'
                  : 'border-[#292D38] bg-[#14161D] hover:border-[#8B7CFF]/40 hover:bg-[#222530]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${isActive ? 'bg-[#8B7CFF] text-[#0A0B0E] shadow-glow-violet' : 'bg-[#222530] text-[#8B7CFF]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#8B7CFF] bg-[#8B7CFF]/15 px-3 py-1 rounded-full border border-[#8B7CFF]/30">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[#737887] hover:text-[#A0A4B1]">Click to activate</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#F4F5F8] tracking-tight">{m.title}</h3>
                <p className="text-xs text-[#8B7CFF] font-mono mt-0.5 font-medium">{m.tagline}</p>
                <p className="text-xs text-[#A0A4B1] mt-2.5 leading-relaxed">{m.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#292D38] space-y-2 text-[11px] font-mono">
                <div className="flex justify-between text-[#A0A4B1]">
                  <span className="text-[#737887]">Yaw Margin:</span>
                  <span className="text-[#F4F5F8] font-semibold">{m.yawThreshold}</span>
                </div>
                <div className="flex justify-between text-[#A0A4B1]">
                  <span className="text-[#737887]">Pitch Margin:</span>
                  <span className="text-[#F4F5F8] font-semibold">{m.pitchThreshold}</span>
                </div>
                <div className="pt-1 text-[11px] text-[#737887] font-sans">
                  Best for: <span className="text-[#A0A4B1] font-medium">{m.recommendedFor}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
