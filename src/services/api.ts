import { CampusLocation, NoiseReport, NoiseAlert, NoiseReading, AnalyticsSummary, AiInsight, User } from '../types';

export const api = {
  // Auth
  async login(email?: string, role?: 'STUDENT' | 'ADMIN'): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  // Locations
  async getLocations(): Promise<CampusLocation[]> {
    const res = await fetch('/api/locations');
    return res.json();
  },

  async updateThreshold(locationId: string, thresholdDb: number): Promise<CampusLocation> {
    const res = await fetch(`/api/locations/${locationId}/threshold`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholdDb }),
    });
    return res.json();
  },

  // Reports
  async getReports(filters?: { locationId?: string; status?: string; category?: string; userId?: string }): Promise<NoiseReport[]> {
    const params = new URLSearchParams();
    if (filters?.locationId) params.append('locationId', filters.locationId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.userId) params.append('userId', filters.userId);

    const res = await fetch(`/api/reports?${params.toString()}`);
    return res.json();
  },

  async createReport(data: {
    userId: string;
    locationId: string;
    noiseDb: number;
    category: string;
    description: string;
    source?: string;
  }): Promise<NoiseReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  async updateReportStatus(reportId: string, status: string, actionNotes?: string, reviewedBy?: string): Promise<NoiseReport> {
    const res = await fetch(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actionNotes, reviewedBy }),
    });
    return res.json();
  },

  async cancelReport(reportId: string): Promise<{ message: string }> {
    const res = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel report');
    }
    return res.json();
  },

  // Alerts
  async getAlerts(): Promise<NoiseAlert[]> {
    const res = await fetch('/api/alerts');
    return res.json();
  },

  async updateAlertStatus(alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED', acknowledgedBy?: string): Promise<NoiseAlert> {
    const res = await fetch(`/api/alerts/${alertId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, acknowledgedBy }),
    });
    return res.json();
  },

  // Readings
  async getReadings(): Promise<NoiseReading[]> {
    const res = await fetch('/api/readings');
    return res.json();
  },

  async addReading(data: { locationId: string; noiseDb: number; source?: string }): Promise<NoiseReading> {
    const res = await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch('/api/analytics/summary');
    return res.json();
  },

  // AI
  async classifyDescription(description: string): Promise<{ category: string; confidence: number; reason: string }> {
    const res = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    return res.json();
  },

  async generateReportInsight(reportId: string): Promise<AiInsight> {
    const res = await fetch(`/api/ai/insights/${reportId}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getZoneAiSummary(locationId: string): Promise<{ summary: string; topFactor?: string; recommendations: string[] }> {
    const res = await fetch('/api/ai/zone-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    });
    return res.json();
  },

  async getWeeklyAiSummary(): Promise<{
    title: string;
    executiveSummary: string;
    keyHotspots: string[];
    recommendedInterventions: string[];
  }> {
    const res = await fetch('/api/ai/weekly-summary', {
      method: 'POST',
    });
    return res.json();
  },
};
