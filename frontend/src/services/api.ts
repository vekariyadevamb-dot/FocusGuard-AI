import { Settings, CalibrationData, SessionHistoryItem, AnalyticsSummary, TelemetryMessage } from '../types';

const API_BASE = '/api';

export const api = {
  async getStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },

  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async getCalibration(): Promise<CalibrationData> {
    const res = await fetch(`${API_BASE}/calibration`);
    return res.json();
  },

  async saveCalibration(data: Partial<CalibrationData>): Promise<CalibrationData> {
    const res = await fetch(`${API_BASE}/calibration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getSessions(subject?: string, mode?: string): Promise<SessionHistoryItem[]> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (mode) params.append('mode', mode);
    const res = await fetch(`${API_BASE}/sessions?${params.toString()}`);
    return res.json();
  },

  async getSessionDetail(id: string): Promise<{ session: SessionHistoryItem; events: any[] }> {
    const res = await fetch(`${API_BASE}/sessions/${id}`);
    return res.json();
  },

  async deleteSession(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async clearAllHistory(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    return res.ok;
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },

  async getGoals(): Promise<any> {
    const res = await fetch(`${API_BASE}/goals`);
    return res.json();
  },

  getCsvExportUrl(): string {
    return `${API_BASE}/export/csv`;
  }
};

export class FocusGuardWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Array<(msg: TelemetryMessage) => void> = [];
  private reconnectTimer: number | null = null;

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((cb) => cb(data));
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.reconnectTimer) {
        this.reconnectTimer = window.setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, 1500);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('WS error:', err);
    };
  }

  public subscribe(callback: (msg: TelemetryMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public send(action: string, payload?: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, payload }));
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const wsClient = new FocusGuardWebSocket();
