import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'ACADEMIC_STAFF':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'CASHIER':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'PARENT':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 backdrop-blur-md sticky top-0 z-30">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="hidden text-lg font-semibold text-slate-100 sm:block">
          Hệ thống Quản lý Giáo dục YOEDU
        </h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon (Sleek Placeholder) */}
        <button className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="hidden flex-col items-end text-right md:flex">
              <span className="text-sm font-semibold text-slate-100 leading-tight">
                {user.fullname}
              </span>
              <span className="text-xs text-slate-400 leading-normal">
                @{user.username}
              </span>
              <span className={`mt-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700 shadow-inner">
              <User size={18} />
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="rounded-xl p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
