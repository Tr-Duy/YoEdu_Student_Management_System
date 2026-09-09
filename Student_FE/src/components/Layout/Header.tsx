import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, User, Bell, LogOut } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'brand';
      case 'ACADEMIC_STAFF':
        return 'info';
      case 'CASHIER':
        return 'success';
      case 'PARENT':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 sticky top-0 z-30 transition-colors">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label="Mở menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button 
          className="relative rounded-md p-2 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          aria-label="Thông báo"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-500"></span>
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-4 pl-4 border-l border-border">
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-semibold text-foreground leading-none">
                {user.fullname}
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-foreground-muted">
                  @{user.username}
                </span>
                <Badge variant={getRoleVariant(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </div>
            
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-foreground-secondary border border-border">
              <User size={16} />
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="rounded-md p-2 text-foreground-muted hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
