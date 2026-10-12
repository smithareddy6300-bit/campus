/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { CampusMap } from './components/CampusMap';
import { StudentReportForm } from './components/StudentReportForm';
import { ReportsList } from './components/ReportsList';
import { AlertsPanel } from './components/AlertsPanel';
import { AiInsightsTab } from './components/AiInsightsTab';
import { JavaProjectExplorer } from './components/JavaProjectExplorer';
import { VirtualDatabaseViewer } from './components/VirtualDatabaseViewer';
import { LoginModal } from './components/LoginModal';
import { IoTStreamSimulator } from './components/IoTStreamSimulator';
import { api } from './services/api';
import { INITIAL_USERS } from './data/mockData';
import { CampusLocation, NoiseReport, NoiseAlert, NoiseReading, AnalyticsSummary, User, UserRole } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]); // Default to student Alex Chen
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [reports, setReports] = useState<NoiseReport[]>([]);
  const [alerts, setAlerts] = useState<NoiseAlert[]>([]);
  const [readings, setReadings] = useState<NoiseReading[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all initial data from REST API
  const refreshData = async () => {
    try {
      const [locs, reps, alts, anal, rds] = await Promise.all([
        api.getLocations(),
        api.getReports(),
        api.getAlerts(),
        api.getAnalytics(),
        api.getReadings(),
      ]);
      setLocations(locs);
      setReports(reps);
      setAlerts(alts);
      setAnalytics(anal);
      setReadings(rds);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to load initial data:', err);
      setError('Could not connect to backend server. Retrying...');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Authentication Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  // Role Switcher (for active session)
  const handleSwitchUser = (role: UserRole) => {
    if (role === 'ADMIN') {
      const admin = INITIAL_USERS.find(u => u.role === 'ADMIN') || INITIAL_USERS[2];
      setCurrentUser(admin);
    } else {
      const student = INITIAL_USERS.find(u => u.role === 'STUDENT') || INITIAL_USERS[0];
      setCurrentUser(student);
    }
  };

  // Callback when a new report is submitted
  const handleNewReport = (newReport: NoiseReport) => {
    setReports(prev => [newReport, ...prev]);
    refreshData(); // update alerts & analytics
  };

  // Callback when a report status is updated
  const handleReportUpdated = (updated: NoiseReport) => {
    setReports(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    refreshData();
  };

  // Callback when report is cancelled
  const handleReportCancelled = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    refreshData();
  };

  // Callback when alert status is updated
  const handleAlertUpdated = (updated: NoiseAlert) => {
    setAlerts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    refreshData();
  };

  // Callback when zone threshold is changed
  const handleUpdateThreshold = async (locationId: string, newThreshold: number) => {
    try {
      const updatedLoc = await api.updateThreshold(locationId, newThreshold);
      setLocations(prev => prev.map(l => (l.id === updatedLoc.id ? updatedLoc : l)));
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Callback when IoT sensor emits new reading
  const handleNewReading = (reading: NoiseReading) => {
    setReadings(prev => [...prev.slice(-30), reading]);
    setLocations(prev =>
      prev.map(l => (l.id === reading.locationId ? { ...l, currentDb: reading.noiseDb } : l))
    );
  };

  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Initializing CampusSound Environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header with Login/Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Admin Dashboard */}
        {activeTab === 'dashboard' && analytics && (
          <AdminDashboard
            analytics={analytics}
            locations={locations}
            reports={reports}
            alerts={alerts}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab 2: Campus Map */}
        {activeTab === 'map' && (
          <CampusMap
            locations={locations}
            reports={reports}
            onSelectLocationForReport={(locId) => {
              setActiveTab('report');
            }}
            onUpdateThreshold={handleUpdateThreshold}
          />
        )}

        {/* Tab 3: Report Noise Form */}
        {activeTab === 'report' && (
          <StudentReportForm
            locations={locations}
            currentUserId={currentUser ? currentUser.id : null}
            onOpenLogin={handleOpenLogin}
            onReportSubmitted={handleNewReport}
          />
        )}

        {/* Tab 4: Incidents & Audit List */}
        {activeTab === 'reports' && (
          <ReportsList
            reports={reports}
            locations={locations}
            currentUserRole={currentUser ? currentUser.role : 'STUDENT'}
            currentUserId={currentUser ? currentUser.id : ''}
            onReportUpdated={handleReportUpdated}
            onReportCancelled={handleReportCancelled}
          />
        )}

        {/* Tab 5: Alerts & Thresholds */}
        {activeTab === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            locations={locations}
            onAlertUpdated={handleAlertUpdated}
            onUpdateThreshold={handleUpdateThreshold}
          />
        )}

        {/* Tab 6: LangChain4j AI Workbench */}
        {activeTab === 'ai' && (
          <AiInsightsTab
            locations={locations}
            reports={reports}
          />
        )}

        {/* Tab 7: Virtual Database & Docker Studio */}
        {activeTab === 'database' && (
          <VirtualDatabaseViewer
            users={INITIAL_USERS}
            locations={locations}
            reports={reports}
            alerts={alerts}
            readings={readings}
          />
        )}

        {/* Tab 8: Spring Boot & Java Project Explorer */}
        {activeTab === 'java' && (
          <JavaProjectExplorer />
        )}

        {/* ESP32 / IoT Telemetry Bottom Drawer */}
        <IoTStreamSimulator
          locations={locations}
          onNewReading={handleNewReading}
          onAlertTriggered={refreshData}
        />
      </main>

      {/* Authentication Modal (Login / Logout / Demo Credentials) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            CampusSound — Smart Campus Noise Environment Reporting & Analysis System
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MySQL 8.0 • Docker Engine</span>
            <span>•</span>
            <span>Spring Boot 3.3 + LangChain4j</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('database')}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Virtual Database & Docker
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('java')}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Export Project (.ZIP)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
