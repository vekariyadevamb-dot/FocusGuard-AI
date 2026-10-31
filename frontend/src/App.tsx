import React, { useEffect, useState } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { LiveMonitorView } from './components/LiveMonitorView';
import { ActiveSessionView } from './components/ActiveSessionView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { CalibrationView } from './components/CalibrationView';
import { StudyModesView } from './components/StudyModesView';
import { SettingsView } from './components/SettingsView';
import { PrivacyView } from './components/PrivacyView';
import { LoadingScreen } from './components/LoadingScreen';

import {
  FrameTelemetry,
  ActiveSession,
  Settings,
  SessionHistoryItem,
  AnalyticsSummary,
  TelemetryMessage,
  StudyMode
} from './types';
import { api, wsClient } from './services/api';
import { soundSynth } from './services/audio';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [telemetry, setTelemetry] = useState<FrameTelemetry | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [settings, setSettings] = useState<Settings>({
    ui_theme: 'dark',
    sound_enabled: true,
    sound_volume: 0.8,
    alert_sound: 'chime',
    alert_threshold_sec: 5.0,
    alert_cooldown_sec: 6.0,
    sensitivity: 'medium',
    active_mode: 'coding',
    camera_index: 0,
    inference_fps: 15,
    show_preview: true,
    show_landmarks: true,
    prolonged_closure_sec: 2.0,
    yawn_threshold_sec: 1.5,
    smart_breaks_enabled: true,
    max_uninterrupted_minutes: 50,
    daily_goal_minutes: 180,
    weekly_goal_minutes: 900
  });

  // Load initial REST data
  const loadData = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      soundSynth.setPreferences(s.sound_enabled, s.sound_volume);

      const sessList = await api.getSessions();
      setRecentSessions(sessList);

      const ana = await api.getAnalytics();
      setAnalytics(ana);
      setIsBackendReady(true);
    } catch (e) {
      console.warn('Error loading initial data:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Connect WebSocket
    wsClient.connect();

    const unsubscribe = wsClient.subscribe((msg: TelemetryMessage) => {
      if (msg.type === 'TELEMETRY') {
        setTelemetry(msg.frame);
        setActiveSession(msg.session);

        // Audible Alert trigger
        if (msg.frame?.attention?.trigger_alert) {
          soundSynth.playAlert(settings.alert_sound || 'warning');
        }
      } else if (msg.type === 'TEST_ALERT') {
        soundSynth.playAlert(settings.alert_sound || 'chime');
      } else if (msg.type === 'SESSION_FINISHED') {
        loadData();
      }
    });

    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, [settings.alert_sound]);

  // Actions
  const handleStartSession = (title: string, subject: string, mode: StudyMode | string, durationMin: number) => {
    wsClient.send('start_session', {
      title,
      subject,
      mode,
      planned_duration_sec: durationMin * 60
    });
    setCurrentTab('session');
  };

  const handlePauseSession = () => {
    wsClient.send('pause_session');
  };

  const handleResumeSession = () => {
    wsClient.send('resume_session');
  };

  const handleStopSession = () => {
    wsClient.send('stop_session');
  };

  const handleCompleteSession = () => {
    wsClient.send('complete_session');
    loadData();
  };

  const handleStartBreak = (durationMin: number = 5) => {
    wsClient.send('start_break', { durationMin });
  };

  const handleEndBreak = () => {
    wsClient.send('end_break');
  };

  const handleStartCalibration = () => {
    wsClient.send('start_calibration');
    setCurrentTab('calibration');
  };

  const handleTriggerTestAlert = () => {
    soundSynth.playAlert(settings.alert_sound || 'chime');
  };

  const handleUpdateSettings = async (updated: Partial<Settings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    soundSynth.setPreferences(newSettings.sound_enabled, newSettings.sound_volume);
    await api.updateSettings(updated);
    try {
      const ana = await api.getAnalytics();
      setAnalytics(ana);
    } catch (e) {
      console.warn('Error refreshing analytics after settings update:', e);
    }
  };

  useEffect(() => {
    if (currentTab === 'analytics' || currentTab === 'dashboard' || currentTab === 'history') {
      loadData();
    }
  }, [currentTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100">
      {/* Initial Startup Loading Screen */}
      {showLoadingScreen && (
        <LoadingScreen
          isBackendReady={isBackendReady}
          isTelemetryReady={telemetry !== null}
          onFinished={() => setShowLoadingScreen(false)}
          onRetry={loadData}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        isSessionActive={!!activeSession}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <TopBar
          attentionState={telemetry?.attention?.state ?? 'MONITORING_INITIALIZING'}
          awaySeconds={telemetry?.attention?.away_duration_sec ?? 0}
          alertThreshold={telemetry?.attention?.alert_threshold_sec ?? 5}
          activeSession={activeSession}
          cameraHealthy={telemetry?.camera_healthy ?? false}
          fps={telemetry?.fps ?? 0}
          soundEnabled={settings.sound_enabled}
          onToggleSound={() => handleUpdateSettings({ sound_enabled: !settings.sound_enabled })}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              telemetry={telemetry}
              activeSession={activeSession}
              recentSessions={recentSessions}
              analytics={analytics}
              onStartSession={handleStartSession}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'monitor' && (
            <LiveMonitorView
              telemetry={telemetry}
              onStartCalibration={handleStartCalibration}
              onTriggerTestAlert={handleTriggerTestAlert}
              onToggleLandmarks={(show) => handleUpdateSettings({ show_landmarks: show })}
              showLandmarks={settings.show_landmarks}
            />
          )}

          {currentTab === 'session' && (
            <ActiveSessionView
              activeSession={activeSession}
              telemetry={telemetry}
              onStartSession={handleStartSession}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
              onStopSession={handleStopSession}
              onCompleteSession={handleCompleteSession}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              settings={settings}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              sessions={recentSessions}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'calibration' && (
            <CalibrationView
              telemetry={telemetry}
              onStartCalibration={handleStartCalibration}
            />
          )}

          {currentTab === 'modes' && (
            <StudyModesView
              activeMode={settings.active_mode}
              onSelectMode={(mode) => handleUpdateSettings({ active_mode: mode })}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdate={handleUpdateSettings}
              onTriggerTestAlert={handleTriggerTestAlert}
            />
          )}

          {currentTab === 'privacy' && (
            <PrivacyView
              settings={settings}
              onUpdate={handleUpdateSettings}
              onDataCleared={loadData}
            />
          )}
        </main>
      </div>
    </div>
  );
};
