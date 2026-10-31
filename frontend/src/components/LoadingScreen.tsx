import React, { useEffect, useState } from 'react';
import { Shield, Cpu, Camera, Database, RefreshCw, AlertCircle } from 'lucide-react';

interface LoadingScreenProps {
  isBackendReady: boolean;
  isTelemetryReady: boolean;
  onFinished: () => void;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isBackendReady,
  isTelemetryReady,
  onFinished,
  onRetry
}) => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Connecting to on-device vision engine...');
  const [fadingOut, setFadingOut] = useState(false);
  const [showTimeoutHelp, setShowTimeoutHelp] = useState(false);

  useEffect(() => {
    // Stage 1: Initial REST & DB probe
    const t1 = setTimeout(() => {
      setProgress((prev) => Math.max(prev, 35));
      setStatusText('Loading SQLite profiles & goals...');
    }, 400);

    // Stage 2: Waiting for backend
    const t2 = setTimeout(() => {
      setProgress((prev) => Math.max(prev, 60));
      setStatusText('Initializing MediaPipe 478-landmark neural pipeline...');
    }, 900);

    // Timeout alert if backend takes too long (>6.5s)
    const timeoutTimer = setTimeout(() => {
      if (!isTelemetryReady && !isBackendReady) {
        setShowTimeoutHelp(true);
      }
    }, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(timeoutTimer);
    };
  }, [isBackendReady, isTelemetryReady]);

  // React to actual system readiness
  useEffect(() => {
    if (isBackendReady && !isTelemetryReady) {
      setProgress((prev) => Math.max(prev, 78));
      setStatusText('Starting camera stream & head-pose calibration...');
    }

    if (isBackendReady || isTelemetryReady) {
      // If either backend REST or telemetry stream is active, advance progress
      setProgress(100);
      setStatusText('FocusGuard AI Engine Online — Ready');
      setShowTimeoutHelp(false);

      const finishTimer = setTimeout(() => {
        setFadingOut(true);
      }, 500);

      const unmountTimer = setTimeout(() => {
        onFinished();
      }, 1100);

      return () => {
        clearTimeout(finishTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [isBackendReady, isTelemetryReady]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C10] select-none transition-opacity duration-700 ease-in-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Radial Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#8B7CFF]/5 blur-3xl pointer-events-none animate-pulse" />

      {/* Futuristic HUD Corner Brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#8B7CFF]/30" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#8B7CFF]/30" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#8B7CFF]/30" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#8B7CFF]/30" />

      {/* Main Center Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-8">
        
        {/* Animated Focus Logo */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer dashed spinning ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#8B7CFF]/40 animate-[spin_10s_linear_infinite]" />
          
          {/* Middle counter-rotating ring */}
          <div className="absolute inset-2 rounded-full border border-[#EC4899]/30 border-t-transparent animate-[spin_6s_linear_infinite_reverse]" />

          {/* Inner pulsating glow container */}
          <div className="w-16 h-16 rounded-2xl bg-[#14161D] border border-[#292D38] flex items-center justify-center shadow-glow-violet transition-transform duration-500 scale-100 group-hover:scale-105">
            <svg
              className="w-8 h-8 text-[#8B7CFF]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" className="fill-[#8B7CFF]" />
              <path d="M3 12a9 9 0 0 1 18 0" />
              <path d="M3 12a9 9 0 0 0 18 0" />
              <circle cx="12" cy="12" r="8" className="opacity-40" />
            </svg>
          </div>

          {/* Glowing Ping Dot */}
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B7CFF] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8B7CFF]" />
          </span>
        </div>

        {/* Brand Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14161D] border border-[#292D38] text-[11px] font-mono text-[#8B7CFF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <span>AI STUDY MONITOR & PRODUCTIVITY</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F4F5F8]">
            FOCUSGUARD <span className="bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs text-[#737887] font-mono">
            Stay Present. Study Smarter.
          </p>
        </div>

        {/* Progress Bar & Real-Time Status */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A0A4B1] truncate max-w-[260px] text-left">{statusText}</span>
            <span className="text-[#8B7CFF] font-bold">{progress}%</span>
          </div>

          <div className="w-full bg-[#14161D] h-2 rounded-full overflow-hidden border border-[#292D38]">
            <div
              className="h-full bg-gradient-to-r from-[#8B7CFF] to-[#EC4899] rounded-full transition-all duration-500 ease-out shadow-glow-violet"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Subsystem Readiness Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full font-mono text-[11px]">
          <div className="p-2.5 rounded-xl bg-[#14161D] border border-[#292D38] flex flex-col items-center gap-1">
            <Cpu className={`w-3.5 h-3.5 ${isBackendReady ? 'text-[#4ADE80]' : 'text-[#737887]'}`} />
            <span className="text-[#737887] text-[10px]">Vision Engine</span>
            <span className={`font-bold ${isBackendReady ? 'text-[#4ADE80]' : 'text-[#A0A4B1]'}`}>
              {isBackendReady ? 'Online' : 'Booting'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14161D] border border-[#292D38] flex flex-col items-center gap-1">
            <Camera className={`w-3.5 h-3.5 ${isTelemetryReady ? 'text-[#4ADE80]' : 'text-[#737887]'}`} />
            <span className="text-[#737887] text-[10px]">Webcam</span>
            <span className={`font-bold ${isTelemetryReady ? 'text-[#4ADE80]' : 'text-[#A0A4B1]'}`}>
              {isTelemetryReady ? 'Active' : 'Standby'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14161D] border border-[#292D38] flex flex-col items-center gap-1">
            <Database className={`w-3.5 h-3.5 ${isBackendReady ? 'text-[#8B7CFF]' : 'text-[#737887]'}`} />
            <span className="text-[#737887] text-[10px]">SQLite DB</span>
            <span className={`font-bold ${isBackendReady ? 'text-[#8B7CFF]' : 'text-[#A0A4B1]'}`}>
              {isBackendReady ? 'Ready' : 'Syncing'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#14161D] border border-[#292D38] flex flex-col items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span className="text-[#737887] text-[10px]">Privacy</span>
            <span className="text-[#8B7CFF] font-bold">100% Local</span>
          </div>
        </div>

        {/* Timeout Fallback Alert */}
        {showTimeoutHelp && (
          <div className="p-4 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-left space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FBBF24]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Vision Engine Not Responding Yet</span>
            </div>
            <p className="text-[11px] text-[#A0A4B1] leading-relaxed">
              Waiting for the Python vision server on <code className="text-[#F4F5F8] font-mono">127.0.0.1:8765</code>. Ensure <code className="text-[#8B7CFF] font-mono">./run_all.fish</code> or <code className="text-[#8B7CFF] font-mono">./run_all.sh</code> is running in your terminal.
            </p>
            <div className="flex items-center gap-2 mt-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-xl bg-[#FBBF24] text-black text-xs font-bold hover:bg-[#F59E0B] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Connection
                </button>
              )}
              <button
                onClick={onFinished}
                className="px-3 py-1.5 rounded-xl bg-[#222530] text-[#F4F5F8] border border-[#292D38] text-xs font-medium hover:bg-[#292D38] transition-colors"
              >
                Enter Dashboard Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
