import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import {
  LogIn,
  LogOut,
  X,
  Shield,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  Lock,
  Mail,
  Key
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onLogout,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [emailInput, setEmailInput] = useState('alex.chen@campus.edu');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectDemoUser = (user: User) => {
    setEmailInput(user.email);
    setSelectedRole(user.role);
    setPasswordInput('password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);

    setTimeout(() => {
      // Find matching user or fallback to role demo
      let user = INITIAL_USERS.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          name: emailInput.split('@')[0].replace('.', ' '),
          email: emailInput,
          role: selectedRole,
          department: selectedRole === 'ADMIN' ? 'Facilities & Safety' : 'General Academic',
          avatar: selectedRole === 'ADMIN' ? INITIAL_USERS[2].avatar : INITIAL_USERS[0].avatar,
        };
      } else {
        // Enforce the chosen role for demo flexibility
        user = { ...user, role: selectedRole };
      }

      onLogin(user);
      setIsSubmitting(false);
      setSuccessMsg(`Welcome, ${user.name}! Authenticated as ${user.role}.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    }, 400);
  };

  const handleLogoutAction = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">CampusSound Authentication</h3>
              <p className="text-[11px] text-slate-400">Spring Security & JWT Session Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          /* User is already logged in -> show account status & logout option */
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">{currentUser.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.department}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogoutAction}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Logout
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Continue Session
              </button>
            </div>
          </div>
        ) : (
          /* User is logged out -> show login form & quick demo credentials */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Demo Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Demo Accounts (College Project Evaluation)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDemoUser(INITIAL_USERS[0])}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    emailInput === INITIAL_USERS[0].email
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-300">
                    <GraduationCap className="w-3.5 h-3.5" /> Alex Chen
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Role: STUDENT</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemoUser(INITIAL_USERS[2])}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    emailInput === INITIAL_USERS[2].email
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                    <Shield className="w-3.5 h-3.5" /> Dr. Vance
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Role: ADMIN</div>
                </button>
              </div>
            </div>

            {/* Role Radio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('STUDENT')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    selectedRole === 'STUDENT'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    selectedRole === 'ADMIN'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Administrator
                </button>
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Campus Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : `Sign In as ${selectedRole}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
