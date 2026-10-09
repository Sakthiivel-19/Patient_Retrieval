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
        return 'bg-indigo-100 text-indigo-950 border-indigo-300';
      case 'doctor':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'auditor':
        return 'bg-purple-100 text-purple-950 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Logged In User Pill */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border-2 border-emerald-300 shadow-sm text-left">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-900 border border-emerald-300">
          <User className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-950 leading-tight">
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
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-xl border-2 border-rose-300 hover:border-rose-400 bg-white transition-all cursor-pointer shadow-sm"
        title="Logout of current account"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout</span>
      </button>
    </div>
  );
};
