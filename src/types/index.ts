export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  avatar?: string;
}

export type ZoneType = 'Library' | 'Classroom' | 'Study Hall' | 'Cafeteria' | 'Parking' | 'Sports Complex' | 'Dormitory' | 'Auditorium';

export interface CampusLocation {
  id: string;
  name: string;
  zoneType: ZoneType;
  thresholdDb: number;
  active: boolean;
  description: string;
  mapX: number; // percentage 0-100 on campus map
  mapY: number; // percentage 0-100 on campus map
  currentDb?: number;
}

export type NoiseCategory = 'traffic' | 'construction' | 'event' | 'crowd' | 'equipment' | 'other';

export type ReportStatus = 'SUBMITTED' | 'REVIEWED' | 'ACTION_TAKEN' | 'CLOSED';

export type MeasurementSource = 'STUDENT_MIC' | 'PHONE_SENSOR' | 'MANUAL_ESTIMATE' | 'IOT_SENSOR';

export interface NoiseReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  locationId: string;
  locationName: string;
  noiseDb: number;
  category: NoiseCategory;
  description: string;
  status: ReportStatus;
  source: MeasurementSource;
  actionNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  hasAlert?: boolean;
  alertId?: string;
  aiInsight?: AiInsight;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface NoiseAlert {
  id: string;
  reportId?: string;
  locationId: string;
  locationName: string;
  noiseDb: number;
  thresholdDb: number;
  excessDb: number;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface NoiseReading {
  id: string;
  locationId: string;
  locationName: string;
  noiseDb: number;
  recordedAt: string;
  source: MeasurementSource;
}

export interface AiInsight {
  id: string;
  reportId: string;
  summary: string;
  category: NoiseCategory;
  suggestion: string;
  createdAt: string;
  model: string;
  isAiGenerated: boolean;
}

export interface AnalyticsSummary {
  averageDb: number;
  peakDb: number;
  totalReports: number;
  activeAlerts: number;
  highestReportedZone: {
    name: string;
    avgDb: number;
    reportCount: number;
  };
  reportsByCategory: Record<string, number>;
  reportsByStatus: Record<string, number>;
  reportsByZone: Array<{ zone: string; count: number; avgDb: number; threshold: number }>;
  hourlyTrend: Array<{ hour: string; avgDb: number; reportCount: number }>;
  whoThreshold: number; // 35 dB WHO reference
}

export interface JavaSourceFile {
  path: string;
  category: 'config' | 'model' | 'repository' | 'service' | 'controller' | 'ai' | 'security' | 'database' | 'docker' | 'doc';
  description: string;
  content: string;
}

export interface VirtualTableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  nullable: boolean;
}

export interface VirtualTableSchema {
  tableName: string;
  columns: VirtualTableColumn[];
  rowCount: number;
}
