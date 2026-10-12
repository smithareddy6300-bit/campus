import React, { useState } from 'react';
import { CampusLocation, NoiseReport, NoiseAlert, NoiseReading, User } from '../types';
import {
  Database,
  Terminal,
  Play,
  RotateCcw,
  Check,
  Copy,
  Container,
  Table,
  Columns,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface VirtualDatabaseViewerProps {
  users: User[];
  locations: CampusLocation[];
  reports: NoiseReport[];
  alerts: NoiseAlert[];
  readings: NoiseReading[];
}

export const VirtualDatabaseViewer: React.FC<VirtualDatabaseViewerProps> = ({
  users,
  locations,
  reports,
  alerts,
  readings,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('reports');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM reports WHERE noise_db >= 50 ORDER BY noise_db DESC;');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryMessage, setQueryMessage] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const tables = [
    { name: 'reports', count: reports.length, desc: 'Student noise disturbance reports' },
    { name: 'locations', count: locations.length, desc: 'Campus acoustic zones & thresholds' },
    { name: 'alerts', count: alerts.length, desc: 'Threshold breach notifications' },
    { name: 'noise_readings', count: readings.length, desc: 'Continuous sensor & mic decibel logs' },
    { name: 'users', count: users.length, desc: 'Student and Admin accounts' },
    { name: 'ai_insights', count: reports.filter(r => r.aiInsight).length, desc: 'LangChain4j summaries & suggestions' },
  ];

  const handleCopyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Virtual SQL executor simulation
  const handleExecuteSql = () => {
    const q = sqlQuery.trim().toLowerCase();
    setQueryMessage(null);

    try {
      if (q.includes('from reports')) {
        let res = [...reports];
        if (q.includes('noise_db >') || q.includes('noise_db >=')) {
          res = res.filter(r => r.noiseDb >= 50);
        }
        if (q.includes('order by noise_db desc')) {
          res.sort((a, b) => b.noiseDb - a.noiseDb);
        }
        setQueryResult(res.map(r => ({
          report_id: r.id,
          user: r.userName,
          location: r.locationName,
          noise_db: `${r.noiseDb} dB`,
          category: r.category,
          status: r.status,
          created_at: r.createdAt.slice(0, 19).replace('T', ' '),
        })));
        setQueryMessage(`Executed query successfully. ${res.length} rows returned.`);
      } else if (q.includes('from alerts')) {
        let res = [...alerts];
        if (q.includes("severity = 'high'") || q.includes('severity="high"')) {
          res = res.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
        }
        setQueryResult(res.map(a => ({
          alert_id: a.id,
          location: a.locationName,
          noise_db: `${a.noiseDb} dB`,
          threshold_db: `${a.thresholdDb} dB`,
          excess_db: `+${a.excessDb} dB`,
          severity: a.severity,
          status: a.status,
        })));
        setQueryMessage(`Executed query successfully. ${res.length} rows returned.`);
      } else if (q.includes('from locations')) {
        setQueryResult(locations.map(l => ({
          location_id: l.id,
          name: l.name,
          zone_type: l.zoneType,
          threshold_db: `${l.thresholdDb} dB`,
          current_db: `${l.currentDb || l.thresholdDb} dB`,
          active: l.active ? 'YES' : 'NO',
        })));
        setQueryMessage(`Executed query successfully. ${locations.length} rows returned.`);
      } else if (q.includes('from users')) {
        setQueryResult(users.map(u => ({
          user_id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department || 'N/A',
        })));
        setQueryMessage(`Executed query successfully. ${users.length} rows returned.`);
      } else if (q.includes('from noise_readings')) {
        setQueryResult(readings.slice(-15).map(r => ({
          reading_id: r.id,
          location: r.locationName,
          noise_db: `${r.noiseDb} dB`,
          source: r.source,
          recorded_at: r.recordedAt.slice(0, 19).replace('T', ' '),
        })));
        setQueryMessage(`Executed query successfully. ${Math.min(15, readings.length)} rows returned.`);
      } else {
        setQueryResult(reports.slice(0, 5).map(r => ({
          report_id: r.id,
          location: r.locationName,
          noise_db: r.noiseDb,
          category: r.category,
        })));
        setQueryMessage(`Executed query on virtual database instance.`);
      }
    } catch (err) {
      setQueryMessage('SQL syntax or execution error in virtual engine.');
    }
  };

  // Table Schemas
  const getTableSchema = (tableName: string) => {
    switch (tableName) {
      case 'reports':
        return [
          { col: 'report_id', type: 'VARCHAR(36)', key: 'PRIMARY KEY', null: 'NO' },
          { col: 'user_id', type: 'VARCHAR(36)', key: 'FOREIGN KEY (users)', null: 'NO' },
          { col: 'location_id', type: 'VARCHAR(36)', key: 'FOREIGN KEY (locations)', null: 'NO' },
          { col: 'noise_db', type: 'DECIMAL(5,2)', key: '', null: 'NO' },
          { col: 'category', type: 'ENUM(...)', key: '', null: 'NO' },
          { col: 'description', type: 'TEXT', key: '', null: 'NO' },
          { col: 'status', type: 'ENUM(...)', key: 'INDEX', null: 'NO' },
          { col: 'created_at', type: 'TIMESTAMP', key: 'INDEX', null: 'NO' },
        ];
      case 'locations':
        return [
          { col: 'location_id', type: 'VARCHAR(36)', key: 'PRIMARY KEY', null: 'NO' },
          { col: 'name', type: 'VARCHAR(150)', key: '', null: 'NO' },
          { col: 'zone_type', type: 'VARCHAR(50)', key: '', null: 'NO' },
          { col: 'threshold_db', type: 'DECIMAL(5,2)', key: '', null: 'NO' },
          { col: 'active', type: 'BOOLEAN', key: '', null: 'NO' },
        ];
      case 'alerts':
        return [
          { col: 'alert_id', type: 'VARCHAR(36)', key: 'PRIMARY KEY', null: 'NO' },
          { col: 'report_id', type: 'VARCHAR(36)', key: 'FOREIGN KEY (reports)', null: 'YES' },
          { col: 'location_id', type: 'VARCHAR(36)', key: 'FOREIGN KEY (locations)', null: 'NO' },
          { col: 'noise_db', type: 'DECIMAL(5,2)', key: '', null: 'NO' },
          { col: 'threshold_db', type: 'DECIMAL(5,2)', key: '', null: 'NO' },
          { col: 'severity', type: 'ENUM(...)', key: '', null: 'NO' },
          { col: 'status', type: 'ENUM(...)', key: 'INDEX', null: 'NO' },
        ];
      default:
        return [
          { col: 'id', type: 'VARCHAR(36)', key: 'PRIMARY KEY', null: 'NO' },
          { col: 'name', type: 'VARCHAR(100)', key: '', null: 'NO' },
          { col: 'created_at', type: 'TIMESTAMP', key: '', null: 'NO' },
        ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Docker Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              Virtual MySQL 8.0 • Docker Engine • Database Folder
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Virtual Database & Docker Container Studio
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Inspect relational schemas, run interactive SQL queries against simulated MySQL tables, and view Docker Compose container orchestration.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="font-semibold text-emerald-400">Docker Launch Command:</span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[11px] text-slate-200 bg-slate-900 px-2 py-1 rounded">
                docker-compose up -d
              </code>
              <button
                onClick={() => handleCopyCommand('docker-compose up -d', 'dc')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {copiedCmd === 'dc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tier Docker Container Topology */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">campussound-mysql</div>
              <div className="text-[10px] text-slate-400">MySQL 8.0 • Port 3306</div>
              <div className="text-[10px] text-emerald-400">./database/schema.sql</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">campussound-backend</div>
              <div className="text-[10px] text-slate-400">Spring Boot 3.3 • Port 8080</div>
              <div className="text-[10px] text-indigo-300">Dockerfile Multi-Stage</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Container className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">campussound-phpmyadmin</div>
              <div className="text-[10px] text-slate-400">Web UI • Port 8081</div>
              <div className="text-[10px] text-slate-400">Virtual SQL Console</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive SQL Console & Table Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Table Directory & Schema */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-400" />
              Database Tables ({tables.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">campussound_db</span>
          </div>

          {/* Table select buttons */}
          <div className="grid grid-cols-2 gap-2">
            {tables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl.name)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedTable === tbl.name
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">{tbl.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {tbl.count} rows
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-1">{tbl.desc}</p>
              </button>
            ))}
          </div>

          {/* Schema columns for selected table */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-indigo-400" />
                Schema: <code className="text-indigo-400">{selectedTable}</code>
              </span>
              <span className="text-[10px] text-slate-500">MySQL 8.0 DDL</span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-[11px] font-mono">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-slate-400 text-[10px]">
                  <tr>
                    <th className="py-1.5 px-3">Column</th>
                    <th className="py-1.5 px-2">Type</th>
                    <th className="py-1.5 px-2">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {getTableSchema(selectedTable).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-semibold text-slate-200">{c.col}</td>
                      <td className="py-1.5 px-2 text-indigo-300">{c.type}</td>
                      <td className="py-1.5 px-2 text-[10px] text-amber-400">{c.key}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Interactive Virtual SQL Console */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Interactive Virtual SQL Query Console
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteSql}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Query
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span>Presets:</span>
            <button
              onClick={() => {
                setSqlQuery('SELECT * FROM reports WHERE noise_db >= 50 ORDER BY noise_db DESC;');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300"
            >
              Loud Reports (&gt;=50 dB)
            </button>
            <button
              onClick={() => {
                setSqlQuery("SELECT * FROM alerts WHERE severity = 'HIGH';");
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300"
            >
              High Alerts
            </button>
            <button
              onClick={() => {
                setSqlQuery('SELECT * FROM locations;');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300"
            >
              Campus Zones
            </button>
          </div>

          {/* SQL Editor Input */}
          <div className="relative">
            <textarea
              rows={3}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="SELECT * FROM ..."
            />
          </div>

          {queryMessage && (
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> {queryMessage}
            </div>
          )}

          {/* Query Results Table */}
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto min-h-[220px] max-h-[300px]">
            {queryResult && queryResult.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px]">
                  <tr>
                    {Object.keys(queryResult[0]).map((key) => (
                      <th key={key} className="py-2 px-3 uppercase whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {queryResult.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="py-2 px-3 whitespace-nowrap truncate max-w-xs">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Click "Run Query" to execute the virtual SQL statement against the in-memory database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
