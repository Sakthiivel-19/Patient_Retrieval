import React, { useState } from 'react';
import { Shield, Mail, Lock, Sparkles, AlertCircle, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../../types';
import heroImage from '../../assets/healthcare-hero.jpg';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Please enter your hospital email address';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Please enter your password';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (loading) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      onLoginSuccess({
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role as any,
      });
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('failed') ||
        msg.toLowerCase().includes('unauthorized') ||
        err?.status === 401
      ) {
        setError('Invalid email or password. Please verify your credentials and try again.');
      } else if (
        msg.toLowerCase().includes('unable to reach') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('failed to fetch')
      ) {
        setError('Unable to reach the authentication service. Please check your network connection.');
      } else {
        setError('Authentication failed. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#02181B] flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-x-hidden">
      {/* Outer Viewport Container (96% feel on desktop with smooth rounded corners) */}
      <div className="w-full max-w-[1540px] h-full lg:h-[94vh] min-h-[660px] max-h-[960px] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/70 border border-teal-900/40 flex flex-col lg:flex-row bg-[#062E2E]">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: Healthcare Photographic Panel (~42% desktop width)          */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white">
          {/* Background Realistic Clinical Photograph */}
          <img
            src={heroImage}
            alt="Healthcare professionals caring for patient"
            className="absolute inset-0 w-full h-full object-cover object-center select-none"
            loading="eager"
          />

          {/* Dark Overlay with Clinical Teal Tint */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#02171A] via-[#042428]/60 to-[#02171A]/40" />

          {/* Layered Translucent Teal & Green Geometric Accents */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          
          {/* Subtle Geometric Angle / Frosted Shield Accent */}
          <div className="absolute top-1/3 -left-12 w-64 h-64 border border-teal-300/20 rounded-[48px] rotate-12 backdrop-blur-[1px] pointer-events-none" />

          {/* Top Panel Brand Accent Pill */}
          <div className="relative z-10 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-teal-400/30 w-fit text-xs font-mono font-medium text-teal-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CareLens Clinical Core • Active</span>
          </div>

          {/* Bottom Headline & Supporting Statement */}
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl xl:text-4xl font-bold font-heading text-white tracking-tight leading-[1.15]">
              Smarter Clinical History. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-200 to-teal-100">
                Better Healthcare Decisions.
              </span>
            </h2>

            <div className="flex items-start gap-3 pt-1">
              <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
              </div>
              <p className="text-sm xl:text-base text-teal-100/90 font-normal leading-relaxed">
                Securely access, verify, and retrieve patient histories with confidence.
              </p>
            </div>

            {/* Evidence & Integrity Micro Badges */}
            <div className="pt-4 flex items-center gap-4 text-[11px] font-mono text-teal-200/80">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Audited
              </span>
              <span className="text-teal-400/50">•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" /> Evidence-Cited AI
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Deep Teal Login Area (~58% desktop width)                    */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[58%] h-full bg-[#062E2E] bg-gradient-to-br from-[#07363A] via-[#062E2E] to-[#041F21] relative flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-[520px] h-[520px] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          {/* CareLens AI Branding Header */}
          <div className="relative z-10 flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/25 text-[#042428] mb-3">
              <Shield className="w-7 h-7 text-[#042428]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
              CareLens <span className="text-teal-300">AI</span>
            </h1>
            <p className="text-xs text-teal-200/80 font-mono font-medium tracking-wider uppercase mt-1">
              Secure Clinical History Intelligence
            </p>
          </div>

          {/* Centered Elegant Login Card */}
          <div className="relative z-10 w-full max-w-[490px] bg-white rounded-2xl sm:rounded-3xl p-7 sm:p-9 shadow-2xl shadow-teal-950/60 border border-teal-100/80">
            {/* Card Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Sign in to your hospital workspace.
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2.5 font-medium animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Controlled Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {/* Hospital Email Field */}
              <div>
                <label
                  htmlFor="hospital-email-input"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Hospital Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-teal-700 absolute left-3.5 pointer-events-none" />
                  <input
                    id="hospital-email-input"
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                      if (error) setError('');
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all outline-none ${
                      fieldErrors.email
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white'
                        : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20'
                    }`}
                    placeholder="Enter your hospital email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="staff-password-input"
                  className="block text-xs font-bold text-slate-800 mb-1.5"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-teal-700 absolute left-3.5 pointer-events-none" />
                  <input
                    id="staff-password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                      if (error) setError('');
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-all outline-none ${
                      fieldErrors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white'
                        : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={loading}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 text-slate-400 hover:text-teal-800 focus:outline-none cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Secure Staff Login Submit Button (Teal-to-Mint Gradient) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 shadow-md shadow-teal-900/20 hover:shadow-lg hover:shadow-teal-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Secure Staff Login</span>
                )}
              </button>
            </form>

            {/* Restrained Security Note */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <Shield className="w-4 h-4 text-teal-700 flex-shrink-0" />
              <span>Secure access for authorized hospital staff</span>
            </div>
          </div>

          {/* Workflow Subtext Banner at Bottom */}
          <div className="relative z-10 mt-6 text-center text-[11px] font-mono text-teal-200/70">
            <span>Compare → Verify → Update</span>
            <span className="mx-2 text-teal-400/50">•</span>
            <span>Authorize → Retrieve → Generate → Cite</span>
          </div>
        </div>

      </div>
    </div>
  );
};
