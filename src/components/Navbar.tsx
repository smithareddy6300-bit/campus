import React from 'react';
import { User, UserRole } from '../types';
import {
  Volume2,
  BarChart3,
  MapPin,
  FilePlus,
  ListFilter,
  AlertTriangle,
  Sparkles,
  FolderCode,
  Shield,
  GraduationCap,
  LogIn,
  LogOut,
  Database
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onSwitchUser: (role: UserRole) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  onOpenLogin,
  onLogout,
  activeAlertCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'report', label: 'Report Noise', icon: FilePlus },
    { id: 'reports', label: 'Incidents & Audit', icon: ListFilter },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    { id: 'ai', label: 'LangChain4j AI', icon: Sparkles },
    { id: 'database', label: 'Virtual DB & Docker', icon: Database, highlight: true },
    { id: 'java', label: 'Spring Boot & Java', icon: FolderCode },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/50">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">CampusSound</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Noise Reporting & Analysis System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth State & Role Switcher */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <>
                {/* Role Switcher Pill */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
                  <button
                    onClick={() => onSwitchUser('STUDENT')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      currentUser.role === 'STUDENT'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Switch to Student view"
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span className="hidden sm:inline">Student</span>
                  </button>

                  <button
                    onClick={() => onSwitchUser('ADMIN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      currentUser.role === 'ADMIN'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Switch to Admin view"
                  >
                    <Shield className="w-3 h-3" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                </div>

                {/* Profile snippet */}
                <div
                  onClick={onOpenLogin}
                  className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 cursor-pointer group"
                  title="Click to view account"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 transition-all"
                  />
                  <div className="text-left text-[11px]">
                    <div className="font-semibold text-slate-200 leading-tight group-hover:text-white truncate max-w-[110px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Sign out of CampusSound"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              /* Logged Out State -> Prominent Login Button */
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 whitespace-nowrap ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
