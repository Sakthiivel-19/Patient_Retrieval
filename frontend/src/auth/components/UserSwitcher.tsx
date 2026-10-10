import React from 'react';
import { User, LogOut } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserSwitcherProps {
  user: UserType;
  onLogout: () => void;
  onSwitchUser?: (email: string) => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({ user, onLogout }) => {
  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'doctor':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'auditor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Logged In User Pill */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-left">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
          <User className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 leading-tight">
            {user.full_name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)} uppercase tracking-wider`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Explicit Logout Action */}
      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl border border-rose-200 hover:border-rose-300 bg-white transition-all cursor-pointer shadow-2xs"
        title="Logout of current account"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout</span>
      </button>
    </div>
  );
};
