import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/api';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  UserPlus,
  CalendarCheck,
  Receipt,
  CreditCard,
  Percent,
  DoorOpen,
  Clock,
  BarChart3,
  UserCheck,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ACADEMIC_STAFF', 'CASHIER'] },
    { path: '/parent', label: 'Parent Portal', icon: UserCheck, roles: ['PARENT'] },
    { path: '/students', label: 'Học viên', icon: Users, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/teachers', label: 'Giáo viên', icon: GraduationCap, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/courses', label: 'Môn học', icon: BookOpen, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/classes', label: 'Lớp học', icon: School, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/enrollments', label: 'Đăng ký học', icon: UserPlus, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/attendance', label: 'Điểm danh', icon: CalendarCheck, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
    { path: '/billing', label: 'Hóa đơn học phí', icon: Receipt, roles: ['ADMIN', 'CASHIER'] },
    { path: '/payments', label: 'Thanh toán', icon: CreditCard, roles: ['ADMIN', 'CASHIER'] },
    { path: '/promotions', label: 'Khuyến mãi', icon: Percent, roles: ['ADMIN', 'CASHIER'] },
    { path: '/rooms', label: 'Phòng học', icon: DoorOpen, roles: ['ADMIN'] },
    { path: '/schedule-slots', label: 'Ca học', icon: Clock, roles: ['ADMIN'] },
    { path: '/reports', label: 'Báo cáo thống kê', icon: BarChart3, roles: ['ADMIN', 'ACADEMIC_STAFF', 'CASHIER'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-md shadow-brand-500/20">
              YO
            </div>
            <span className="text-xl font-bold tracking-wider text-slate-50">
              YOEDU
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {filteredItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
