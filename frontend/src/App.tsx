import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Activity, ShieldCheck, FileSpreadsheet, LayoutDashboard, Users, LogOut, Menu, X, Stethoscope } from 'lucide-react';
import { User } from './types';
import { authService } from './auth/services/authService';
import { LoginForm } from './auth/components/LoginForm';
import { UserSwitcher } from './auth/components/UserSwitcher';
import { PatientDirectory } from './patients/components/PatientDirectory';
import { PatientWorkspacePage } from './workspace/pages/PatientWorkspacePage';
import { SecurityDemoSuite } from './workspace/components/SecurityDemoSuite';
import { SecurityAuditDrawer } from './workspace/components/SecurityAuditDrawer';
import { AdminDashboard } from './admin/components/AdminDashboard';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showSecurityDemo, setShowSecurityDemo] = useState(false);
  const [showGlobalAudit, setShowGlobalAudit] = useState(false);
  const [viewMode, setViewMode] = useState<'workspace' | 'admin'>('workspace');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setSelectedPatientId(null);
  };

  const handleSwitchUser = async (email: string) => {
    const pass = email.includes('admin') ? 'admin123' : 'password123';
    try {
      const res = await authService.login(email, pass);
      const newUser: User = {
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as any,
      };
      setCurrentUser(newUser);
      
      // Strict role-based navigation: non-admins cannot stay in admin console
      if (newUser.role !== 'admin') {
        setViewMode('workspace');
      } else {
        setViewMode('admin');
      }
      setSelectedPatientId(null);
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  if (!currentUser) {
    return <LoginForm onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const isAdmin = currentUser.role?.toLowerCase() === 'admin';
  const isPatientDirectoryActive = !selectedPatientId && viewMode === 'workspace';
  const isWorkspaceActive = selectedPatientId !== null && viewMode === 'workspace';
  const isAdminActive = viewMode === 'admin';

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* DESKTOP DARK NAVY-TEAL SIDEBAR                                           */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-64 bg-[#081F26] border-r border-teal-900/30 text-white flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
        {/* Top: Logo & Nav links */}
        <div className="p-5 flex flex-col gap-6">
          {/* Logo & Brand Header */}
          <div
            onClick={() => {
              setSelectedPatientId(null);
              setViewMode(isAdmin ? 'admin' : 'workspace');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[#081F26] shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-[#081F26]" />
            </div>
            <div>
              <div className="text-lg font-bold font-heading text-white tracking-tight flex items-center gap-1.5">
                CareLens <span className="text-emerald-400">AI</span>
              </div>
              <div className="text-[11px] text-teal-300/80 font-mono">
                Clinical Intelligence
              </div>
            </div>
          </div>

          {/* Clinical Queue Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-800/40 text-[11px] font-mono text-teal-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure EHR Gateway</span>
          </div>

          {/* Navigation Links with Active Highlight */}
          <nav className="flex flex-col gap-1.5">
            {/* Patient Directory */}
            <button
              type="button"
              onClick={() => {
                setSelectedPatientId(null);
                setViewMode('workspace');
              }}
              className={`flex items-center gap-3 py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                isPatientDirectoryActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 pl-4'
              }`}
            >
              <Users className={`w-4 h-4 ${isPatientDirectoryActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Patient Directory</span>
            </button>

            {/* Active Patient Workspace Link (when a patient is open) */}
            {selectedPatientId && (
              <button
                type="button"
                onClick={() => setViewMode('workspace')}
                className={`flex items-center justify-between py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                  isWorkspaceActive
                    ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 pl-4'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isWorkspaceActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">Active Workspace</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedPatientId}
                </span>
              </button>
            )}

            {/* Admin Console (Strictly visible to Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId(null);
                  setViewMode('admin');
                }}
                className={`flex items-center gap-3 py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                  isAdminActive
                    ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 pl-4'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${isAdminActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Admin Console</span>
              </button>
            )}

            {/* Divider */}
            <div className="my-3 border-t border-teal-900/40" />

            {/* Security Suite */}
            <button
              type="button"
              onClick={() => setShowSecurityDemo(true)}
              className="flex items-center gap-3 py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer text-left"
            >
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Security Suite</span>
            </button>

            {/* Audit Trail */}
            <button
              type="button"
              onClick={() => setShowGlobalAudit(true)}
              className="flex items-center gap-3 py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer text-left"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Audit Trail</span>
            </button>
          </nav>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-4 border-t border-teal-900/40 bg-[#06171D]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-teal-300/80 font-mono uppercase tracking-wider mt-0.5">
                {currentUser.role}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout of current account"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE SIDEBAR DRAWER (When Screen < MD)                                  */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80%] bg-[#081F26] text-white flex flex-col justify-between h-full z-10 p-5 shadow-2xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[#081F26]">
                    <Shield className="w-4 h-4 text-[#081F26]" />
                  </div>
                  <span className="font-bold font-heading text-white">CareLens AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(null);
                    setViewMode('workspace');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                    isPatientDirectoryActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                      : 'text-slate-300 pl-4'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Patient Directory</span>
                </button>

                {selectedPatientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('workspace');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                      isWorkspaceActive
                        ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                        : 'text-slate-300 pl-4'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Active Workspace ({selectedPatientId})</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(null);
                      setViewMode('admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 py-2.5 pr-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-left ${
                      isAdminActive
                        ? 'bg-emerald-500/15 text-emerald-300 border-l-4 border-emerald-400 pl-3'
                        : 'text-slate-300 pl-4'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin Console</span>
                  </button>
                )}

                <div className="my-2 border-t border-teal-900/40" />

                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityDemo(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 px-4 text-xs font-medium text-slate-300"
                >
                  <Activity className="w-4 h-4" />
                  <span>Security Suite</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowGlobalAudit(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 px-4 text-xs font-medium text-slate-300"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Audit Trail</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-teal-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
                <div className="text-[10px] text-teal-300 font-mono">{currentUser.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 font-bold"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA WITH LIGHT GRAY BACKGROUND (#F8FAFC)                   */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 bg-[#F8FAFC] flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Mobile hamburger + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span
                onClick={() => {
                  setSelectedPatientId(null);
                  setViewMode('workspace');
                }}
                className="hover:text-emerald-700 cursor-pointer font-semibold text-slate-700"
              >
                CareLens AI
              </span>
              <span>/</span>
              <span className="text-slate-900 font-semibold font-mono">
                {isAdminActive
                  ? 'Admin Console'
                  : selectedPatientId
                  ? `Patient Workspace (${selectedPatientId})`
                  : 'Patient Directory'}
              </span>
            </div>
          </div>

          {/* Quick Action Controls & User Switcher */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSecurityDemo(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Security Suite</span>
            </button>

            <button
              onClick={() => setShowGlobalAudit(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Trail</span>
            </button>

            <UserSwitcher
              user={currentUser}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 pb-16 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {isAdmin && viewMode === 'admin' ? (
            <AdminDashboard
              onOpenPatientWorkspace={async (patientId, doctorEmail) => {
                if (doctorEmail) {
                  await handleSwitchUser(doctorEmail);
                }
                setSelectedPatientId(patientId);
                setViewMode('workspace');
              }}
              onSwitchToDoctor={async (doctorEmail) => {
                await handleSwitchUser(doctorEmail);
                setSelectedPatientId(null);
                setViewMode('workspace');
              }}
            />
          ) : selectedPatientId ? (
            <PatientWorkspacePage
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          ) : (
            <PatientDirectory
              currentUser={currentUser}
              onSelectPatient={(id) => setSelectedPatientId(id)}
              onOpenSecurityDemo={() => setShowSecurityDemo(true)}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      {showSecurityDemo && (
        <SecurityDemoSuite onClose={() => setShowSecurityDemo(false)} />
      )}

      {showGlobalAudit && (
        <SecurityAuditDrawer onClose={() => setShowGlobalAudit(false)} />
      )}
    </div>
  );
}
