import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../../types';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('doctor.sarah@carelens.ai');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      onLoginSuccess({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as any,
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FEFAF3]">
      <div className="bg-white p-8 max-w-md w-full shadow-2xl rounded-3xl border-2 border-emerald-300 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-700/20 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-950 flex items-center gap-2">
              CareLens <span className="text-emerald-800">AI</span>
            </h1>
            <p className="text-xs text-slate-700 font-mono font-semibold tracking-wide">
              Secure Clinical History Intelligence
            </p>
          </div>
        </div>

        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2 shadow-xs">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-700" />
          <div>
            <span className="font-bold">Compare → Verify → Update</span>
            <p className="text-emerald-900 font-medium text-[11px] mt-0.5">
              Authorize → Retrieve → Generate → Cite
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs text-rose-950 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 bg-white text-slate-950 border-emerald-300 font-medium"
                placeholder="doctor@carelens.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 bg-white text-slate-950 border-emerald-300 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 mt-2 font-bold"
          >
            {loading ? 'Authenticating...' : 'Secure Staff Login'}
          </button>
        </form>

        {/* Quick Demo Switcher Presets */}
        <div className="mt-8 pt-6 border-t border-emerald-200">
          <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Demo Personas (One-Click Select):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect('doctor.sakthi@carelens.ai', 'password123')}
              className="p-2.5 text-left rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-300 text-[11px] transition-all cursor-pointer"
            >
              <div className="font-bold text-emerald-950">Dr. Sakthi, MD</div>
              <div className="text-slate-700 font-medium text-[10px]">Doctor (Has P001 & P002)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect('doctor.varun@carelens.ai', 'password123')}
              className="p-2.5 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[11px] transition-all cursor-pointer"
            >
              <div className="font-bold text-amber-950">Dr. Varun, MD</div>
              <div className="text-slate-700 font-medium text-[10px]">Doctor (No P001 Grant)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect('doctor.rakshana@carelens.ai', 'password123')}
              className="p-2.5 text-left rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-[11px] transition-all cursor-pointer"
            >
              <div className="font-bold text-teal-950">Dr. Rakshana, MD</div>
              <div className="text-slate-700 font-medium text-[10px]">Specialist (P001 & VIP P999)</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect('admin@carelens.ai', 'admin123')}
              className="p-2.5 text-left rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-[11px] transition-all cursor-pointer"
            >
              <div className="font-bold text-indigo-950">Admin System</div>
              <div className="text-slate-700 font-medium text-[10px]">Full Access & Governance</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
