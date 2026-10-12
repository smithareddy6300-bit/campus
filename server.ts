import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_USERS, INITIAL_LOCATIONS, INITIAL_REPORTS, INITIAL_ALERTS, INITIAL_READINGS } from './src/data/mockData';
import { NoiseReport, NoiseAlert, CampusLocation, NoiseReading, AiInsight } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// In-Memory Database State (mirroring MySQL persistence for the live runtime)
let users = [...INITIAL_USERS];
let locations: CampusLocation[] = [...INITIAL_LOCATIONS];
let reports: NoiseReport[] = [...INITIAL_REPORTS];
let alerts: NoiseAlert[] = [...INITIAL_ALERTS];
let readings: NoiseReading[] = [...INITIAL_READINGS];

// Gemini AI client (LangChain4j layer simulation)
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// REST API ROUTES (Spring Boot REST API simulation & backend)
// -------------------------------------------------------------

// 1. Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const user = users.find(u => u.email === email || (role && u.role === role)) || users[0];
  res.json({
    token: `jwt-bearer-${user.id}-${Date.now()}`,
    user,
    message: 'Authentication successful',
  });
});

app.get('/api/users/current', (req, res) => {
  res.json(users[0]);
});

// 2. Locations endpoints
app.get('/api/locations', (req, res) => {
  res.json(locations);
});

app.put('/api/locations/:id/threshold', (req, res) => {
  const { id } = req.params;
  const { thresholdDb } = req.body;
  const locIndex = locations.findIndex(l => l.id === id);
  if (locIndex === -1) {
    return res.status(404).json({ error: 'Location not found' });
  }

  locations[locIndex] = {
    ...locations[locIndex],
    thresholdDb: Number(thresholdDb),
  };
  res.json(locations[locIndex]);
});

// 3. Reports endpoints (Operational decision flow)
app.get('/api/reports', (req, res) => {
  const { locationId, status, category, userId } = req.query;
  let filtered = [...reports];

  if (locationId) {
    filtered = filtered.filter(r => r.locationId === locationId);
  }
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  if (category) {
    filtered = filtered.filter(r => r.category === category);
  }
  if (userId) {
    filtered = filtered.filter(r => r.userId === userId);
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

app.get('/api/reports/:id', (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.post('/api/reports', (req, res) => {
  const { userId, locationId, noiseDb, category, description, source } = req.body;

  if (!locationId || noiseDb === undefined || !category || !description) {
    return res.status(400).json({ error: 'Missing required fields: locationId, noiseDb, category, description' });
  }

  const location = locations.find(l => l.id === locationId);
  if (!location) {
    return res.status(404).json({ error: 'Selected location not found' });
  }

  const user = users.find(u => u.id === userId) || users[0];
  const reportId = `rep-${Date.now()}`;
  const now = new Date().toISOString();

  // Step 5 of flow: Compare reported value with configured location threshold
  const threshold = location.thresholdDb;
  const excess = Number(noiseDb) - threshold;
  let hasAlert = false;
  let alertId: string | undefined;

  if (excess > 0) {
    hasAlert = true;
    alertId = `alt-${Date.now()}`;
    const severity = excess >= 20 ? 'CRITICAL' : excess >= 12 ? 'HIGH' : excess >= 6 ? 'MEDIUM' : 'LOW';

    const newAlert: NoiseAlert = {
      id: alertId,
      reportId,
      locationId: location.id,
      locationName: location.name,
      noiseDb: Number(noiseDb),
      thresholdDb: threshold,
      excessDb: Math.round(excess * 10) / 10,
      severity,
      message: `Acoustic breach in ${location.name}: recorded ${noiseDb} dB exceeds threshold of ${threshold} dB by +${excess.toFixed(1)} dB.`,
      status: 'ACTIVE',
      createdAt: now,
    };
    alerts.unshift(newAlert);
  }

  const newReport: NoiseReport = {
    id: reportId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    locationId: location.id,
    locationName: location.name,
    noiseDb: Number(noiseDb),
    category,
    description,
    status: 'SUBMITTED',
    source: source || 'STUDENT_MIC',
    createdAt: now,
    updatedAt: now,
    hasAlert,
    alertId,
  };

  reports.unshift(newReport);

  // Also add to readings history
  readings.push({
    id: `rd-${Date.now()}`,
    locationId: location.id,
    locationName: location.name,
    noiseDb: Number(noiseDb),
    recordedAt: now,
    source: source || 'STUDENT_MIC',
  });

  // Update currentDb on location
  location.currentDb = Number(noiseDb);

  res.status(201).json(newReport);
});

// Update report status (Admin audit workflow)
app.put('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, actionNotes, reviewedBy } = req.body;

  const reportIndex = reports.findIndex(r => r.id === id);
  if (reportIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const existing = reports[reportIndex];
  reports[reportIndex] = {
    ...existing,
    status: status || existing.status,
    actionNotes: actionNotes !== undefined ? actionNotes : existing.actionNotes,
    reviewedBy: reviewedBy || existing.reviewedBy || 'Admin',
    updatedAt: new Date().toISOString(),
  };

  res.json(reports[reportIndex]);
});

// Student can cancel own unreviewed report
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const repIndex = reports.findIndex(r => r.id === id);
  if (repIndex === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (reports[repIndex].status !== 'SUBMITTED') {
    return res.status(400).json({ error: 'Cannot cancel report that is already under review or closed' });
  }

  reports.splice(repIndex, 1);
  res.json({ message: 'Report successfully cancelled' });
});

// 4. Alerts endpoints
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.put('/api/alerts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, acknowledgedBy } = req.body;

  const alertIndex = alerts.findIndex(a => a.id === id);
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const existing = alerts[alertIndex];
  alerts[alertIndex] = {
    ...existing,
    status,
    acknowledgedBy: acknowledgedBy || existing.acknowledgedBy,
    resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : existing.resolvedAt,
  };

  res.json(alerts[alertIndex]);
});

// 5. Readings endpoints (IoT sensor stream)
app.get('/api/readings', (req, res) => {
  res.json(readings.slice(-40)); // return last 40 readings
});

app.post('/api/readings', (req, res) => {
  const { locationId, noiseDb, source } = req.body;
  const location = locations.find(l => l.id === locationId);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }

  const newReading: NoiseReading = {
    id: `rd-${Date.now()}`,
    locationId: location.id,
    locationName: location.name,
    noiseDb: Number(noiseDb),
    recordedAt: new Date().toISOString(),
    source: source || 'IOT_SENSOR',
  };
  readings.push(newReading);
  location.currentDb = Number(noiseDb);

  // Check threshold
  if (Number(noiseDb) > location.thresholdDb) {
    const excess = Number(noiseDb) - location.thresholdDb;
    const severity = excess >= 20 ? 'CRITICAL' : excess >= 12 ? 'HIGH' : excess >= 6 ? 'MEDIUM' : 'LOW';
    const alert: NoiseAlert = {
      id: `alt-sensor-${Date.now()}`,
      locationId: location.id,
      locationName: location.name,
      noiseDb: Number(noiseDb),
      thresholdDb: location.thresholdDb,
      excessDb: Math.round(excess * 10) / 10,
      severity,
      message: `ESP32/IoT sensor breach in ${location.name}: detected ${noiseDb} dB (limit: ${location.thresholdDb} dB).`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    alerts.unshift(alert);
  }

  res.status(201).json(newReading);
});

// 6. Analytics endpoints
app.get('/api/analytics/summary', (req, res) => {
  const totalReports = reports.length;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;

  const dbValues = reports.map(r => r.noiseDb);
  const averageDb = dbValues.length ? Math.round(dbValues.reduce((a, b) => a + b, 0) / dbValues.length) : 48;
  const peakDb = dbValues.length ? Math.max(...dbValues) : 82;

  // Category counts
  const reportsByCategory: Record<string, number> = {
    traffic: 0,
    construction: 0,
    event: 0,
    crowd: 0,
    equipment: 0,
    other: 0,
  };
  reports.forEach(r => {
    reportsByCategory[r.category] = (reportsByCategory[r.category] || 0) + 1;
  });

  // Status counts
  const reportsByStatus: Record<string, number> = {
    SUBMITTED: 0,
    REVIEWED: 0,
    ACTION_TAKEN: 0,
    CLOSED: 0,
  };
  reports.forEach(r => {
    reportsByStatus[r.status] = (reportsByStatus[r.status] || 0) + 1;
  });

  // Reports by zone
  const zoneStats = locations.map(loc => {
    const locReports = reports.filter(r => r.locationId === loc.id);
    const avg = locReports.length
      ? Math.round(locReports.reduce((sum, r) => sum + r.noiseDb, 0) / locReports.length)
      : loc.currentDb || loc.thresholdDb;
    return {
      zone: loc.name,
      count: locReports.length,
      avgDb: avg,
      threshold: loc.thresholdDb,
    };
  });

  // Highest reported zone
  const highestZone = [...zoneStats].sort((a, b) => b.count - a.count)[0] || {
    zone: 'Academic Block A',
    avgDb: 56,
    count: 2,
  };

  // Hourly trend (past 8 hours)
  const hourlyTrend = [
    { hour: '08:00', avgDb: 38, reportCount: 1 },
    { hour: '10:00', avgDb: 52, reportCount: 3 },
    { hour: '12:00', avgDb: 71, reportCount: 6 },
    { hour: '14:00', avgDb: 64, reportCount: 4 },
    { hour: '16:00', avgDb: 58, reportCount: 3 },
    { hour: '18:00', avgDb: 76, reportCount: 5 },
    { hour: '20:00', avgDb: 49, reportCount: 2 },
    { hour: 'Now', avgDb: averageDb, reportCount: totalReports },
  ];

  res.json({
    averageDb,
    peakDb,
    totalReports,
    activeAlerts,
    highestReportedZone: {
      name: highestZone.zone,
      avgDb: highestZone.avgDb,
      reportCount: highestZone.count,
    },
    reportsByCategory,
    reportsByStatus,
    reportsByZone: zoneStats,
    hourlyTrend,
    whoThreshold: 35, // WHO Classroom baseline reference
  });
});

// Helper to call AI with timeout
async function callAiWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// 7. LangChain4j / Gemini AI layer endpoints
app.post('/api/ai/classify', async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // If Gemini is available, call Gemini 3.8 Flash
  if (aiClient) {
    try {
      const prompt = `You are a campus sound monitoring classifier assistant.
Categorize this student noise complaint description into EXACTLY one of these categories:
- traffic
- construction
- event
- crowd
- equipment
- other

Student description: "${description}"
Respond with ONLY a JSON object: {"category": "<one_of_the_categories>", "confidence": 0.95, "reason": "<1-line reason>"}`;

      const response = await callAiWithTimeout(
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        3500
      );

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    } catch (err) {
      console.warn('AI classification failed, falling back to heuristic:', err);
    }
  }

  // Heuristic rule-based fallback
  const lower = description.toLowerCase();
  let category = 'other';
  let reason = 'General ambient noise';

  if (lower.includes('truck') || lower.includes('car') || lower.includes('bus') || lower.includes('traffic') || lower.includes('honk')) {
    category = 'traffic';
    reason = 'Contains vehicular transit keywords';
  } else if (lower.includes('drill') || lower.includes('hammer') || lower.includes('construction') || lower.includes('renovat') || lower.includes('build')) {
    category = 'construction';
    reason = 'Contains structural or tool construction keywords';
  } else if (lower.includes('speaker') || lower.includes('music') || lower.includes('party') || lower.includes('concert') || lower.includes('club') || lower.includes('event')) {
    category = 'event';
    reason = 'Relates to amplified sound or student gatherings';
  } else if (lower.includes('yell') || lower.includes('shout') || lower.includes('laugh') || lower.includes('group') || lower.includes('crowd') || lower.includes('talking')) {
    category = 'crowd';
    reason = 'Corresponds to congregational human vocal chatter';
  } else if (lower.includes('ac') || lower.includes('fan') || lower.includes('hvac') || lower.includes('generator') || lower.includes('motor') || lower.includes('hum')) {
    category = 'equipment';
    reason = 'Mechanical / electrical equipment acoustic footprint';
  }

  res.json({
    category,
    confidence: 0.88,
    reason,
  });
});

app.post('/api/ai/insights/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const report = reports.find(r => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const location = locations.find(l => l.id === report.locationId);
  const zoneName = location ? location.name : report.locationName;
  const threshold = location ? location.thresholdDb : 45;

  let summary = `Noise reading of ${report.noiseDb} dB recorded in ${zoneName} exceeding baseline threshold (${threshold} dB).`;
  let suggestion = `Inspect ${report.category} sources in ${zoneName} and coordinate with campus facilities to adhere to quiet academic windows.`;

  if (aiClient) {
    try {
      const prompt = `You are the CampusSound Acoustic Intelligence Assistant (LangChain4j AI Service).
Analyze this verified campus noise complaint:
- Zone: ${zoneName} (Threshold: ${threshold} dB)
- Measured Noise: ${report.noiseDb} dB (WHO classroom guideline: 35 dB)
- Category: ${report.category}
- Student description: "${report.description}"

Provide non-binding operational assistance for campus administrators.
Respond ONLY in valid JSON format:
{
  "summary": "1 concise sentence summarizing the acoustic issue and impact",
  "category": "${report.category}",
  "suggestion": "1-2 practical operational actions (e.g. reschedule maintenance, deploy acoustic baffles, verify sound check times)"
}`;

      const response = await callAiWithTimeout(
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        3500
      );

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.summary && parsed.suggestion) {
        summary = parsed.summary;
        suggestion = parsed.suggestion;
      }
    } catch (err) {
      console.warn('AI insight generation fallback:', err);
    }
  }

  const insight: AiInsight = {
    id: `ins-${Date.now()}`,
    reportId: report.id,
    summary,
    category: report.category,
    suggestion,
    createdAt: new Date().toISOString(),
    model: aiClient ? 'LangChain4j / Gemini 3.8 Flash' : 'CampusSound Rule Engine',
    isAiGenerated: true,
  };

  // Attach to report
  report.aiInsight = insight;

  res.json(insight);
});

// AI zone summary (summarize multiple complaints in one zone)
app.post('/api/ai/zone-summary', async (req, res) => {
  const { locationId } = req.body;
  const location = locations.find(l => l.id === locationId);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }

  const zoneReports = reports.filter(r => r.locationId === locationId);
  if (zoneReports.length === 0) {
    return res.json({
      summary: `No noise complaints currently filed for ${location.name}. Ambient noise level remains stable around ${location.currentDb || location.thresholdDb} dB.`,
      suggestions: ['Maintain continuous IoT sensor monitoring.'],
    });
  }

  if (aiClient) {
    try {
      const descriptions = zoneReports.map(r => `- [${r.noiseDb} dB, ${r.category}]: ${r.description}`).join('\n');
      const prompt = `As a campus acoustic analyst, synthesize these ${zoneReports.length} complaints for zone "${location.name}" (Threshold: ${location.thresholdDb} dB):
${descriptions}

Respond in JSON:
{
  "summary": "2-sentence recurring pattern analysis",
  "topFactor": "Primary root cause",
  "recommendations": ["action item 1", "action item 2"]
}`;

      const response = await callAiWithTimeout(
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        3500
      );

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return res.json(JSON.parse(cleanJson));
    } catch (err) {
      console.warn('Zone summary AI error:', err);
    }
  }

  // Fallback
  res.json({
    summary: `${zoneReports.length} reports logged for ${location.name}. Dominant disturbance stems from ${zoneReports[0].category} with peak readings reaching ${Math.max(...zoneReports.map(r => r.noiseDb))} dB.`,
    topFactor: zoneReports[0].category,
    recommendations: [
      `Review operational schedules adjacent to ${location.name}.`,
      `Enforce quiet study threshold compliance (${location.thresholdDb} dB).`,
    ],
  });
});

// AI weekly executive summary
app.post('/api/ai/weekly-summary', async (req, res) => {
  if (aiClient) {
    try {
      const summaryStats = {
        totalReports: reports.length,
        activeAlerts: alerts.filter(a => a.status === 'ACTIVE').length,
        avgDb: Math.round(reports.reduce((s, r) => s + r.noiseDb, 0) / (reports.length || 1)),
        peakDb: Math.max(...reports.map(r => r.noiseDb), 82),
      };

      const prompt = `Generate a weekly campus environmental acoustic briefing for the College Dean and Facilities Committee.
Data:
- Total Student Reports: ${summaryStats.totalReports}
- Active Threshold Alerts: ${summaryStats.activeAlerts}
- Campus Average Noise: ${summaryStats.avgDb} dB
- Peak Level Recorded: ${summaryStats.peakDb} dB
- WHO Classroom Guideline: 35 dB(A)

Format response as JSON:
{
  "title": "Weekly Campus Acoustic Environment Briefing",
  "executiveSummary": "3-sentence high level summary",
  "keyHotspots": ["hotspot 1", "hotspot 2"],
  "recommendedInterventions": ["intervention 1", "intervention 2", "intervention 3"]
}`;

      const response = await callAiWithTimeout(
        aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        3500
      );

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return res.json(JSON.parse(cleanJson));
    } catch (err) {
      console.warn('Weekly summary AI error:', err);
    }
  }

  res.json({
    title: 'Weekly Campus Acoustic Environment Briefing',
    executiveSummary: `Over the past cycle, campus acoustic sensors and student monitors registered ${reports.length} reports. Average ambient reading settled at 58 dB, with primary deviations concentrated in instructional zones during mid-day transit and scheduled facilities maintenance.`,
    keyHotspots: [
      'Main Library 2F - Mechanical HVAC vibration exceeding 35 dB WHO reference',
      'Academic Block A - Daytime pathway drilling during core lecture periods',
    ],
    recommendedInterventions: [
      'Implement mandatory quiet hours (35 dB) for all facilities maintenance near instructional halls between 09:00 - 16:00',
      'Calibrate acoustic dampening louvers in library central ventilation',
      'Deploy two additional ESP32 edge decibel monitors in study quad',
    ],
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER MIDDLEWARE (for Single Port 3000 execution)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusSound Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
