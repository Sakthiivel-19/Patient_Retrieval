import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Activity, ShieldCheck, FileSpreadsheet, LayoutDashboard, Users } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global Clinical Navigation Header */}
      <header className="glass-nav sticky top-0 z-40 px-6 py-3 flex items-center justify-between shadow-lg">
        {/* Brand Logo & Subtitle */}
        <div
          onClick={() => {
            setSelectedPatientId(null);
            setViewMode(isAdmin ? 'admin' : 'workspace');
          }}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold font-heading text-slate-100 tracking-tight">
              CareLens <span className="text-cyan-400">AI</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Secure Clinical History Intelligence
            </div>
          </div>
        </div>

        {/* Action Controls & User Switcher */}
        <div className="flex items-center gap-3">
          {/* Admin Console button is strictly visible to Admin only */}
          {isAdmin && (
            <button
              onClick={() => {
                setSelectedPatientId(null);
                setViewMode(viewMode === 'admin' ? 'workspace' : 'admin');
              }}
              className={`inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl transition-all font-mono font-medium shadow-sm cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-indigo-950/30'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              {viewMode === 'admin' ? 'Patient Directory' : 'Admin Console'}
            </button>
          )}

          <button
            onClick={() => setShowSecurityDemo(true)}
            className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-300 text-emerald-950 transition-all font-mono font-bold shadow-sm cursor-pointer hover:border-emerald-500"
          >
            <Activity className="w-4 h-4 text-emerald-700" />
            Security Suite
          </button>

          <button
            onClick={() => setShowGlobalAudit(true)}
            className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-300 text-slate-950 transition-all font-mono font-bold shadow-sm cursor-pointer hover:border-emerald-500"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Audit Log
          </button>

          <UserSwitcher
            user={currentUser}
            onLogout={handleLogout}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
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

      {/* Global Modals */}
      {showSecurityDemo && (
        <SecurityDemoSuite onClose={() => setShowSecurityDemo(false)} />
      )}

      {showGlobalAudit && (
        <SecurityAuditDrawer onClose={() => setShowGlobalAudit(false)} />
      )}
    </div>
  );
}
