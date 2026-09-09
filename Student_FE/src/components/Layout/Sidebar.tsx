import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ACADEMIC_STAFF', 'CASHIER'] },
        { path: '/parent', label: 'Parent Portal', icon: UserCheck, roles: ['PARENT'] },
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        { path: '/students', label: 'Học viên', icon: Users, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
        { path: '/teachers', label: 'Giáo viên', icon: GraduationCap, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
        { path: '/courses', label: 'Môn học', icon: BookOpen, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
        { path: '/classes', label: 'Lớp học', icon: School, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
        { path: '/enrollments', label: 'Đăng ký học', icon: UserPlus, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/attendance', label: 'Điểm danh', icon: CalendarCheck, roles: ['ADMIN', 'ACADEMIC_STAFF'] },
        { path: '/billing', label: 'Hóa đơn học phí', icon: Receipt, roles: ['ADMIN', 'CASHIER'] },
        { path: '/payments', label: 'Thanh toán', icon: CreditCard, roles: ['ADMIN', 'CASHIER'] },
        { path: '/promotions', label: 'Khuyến mãi', icon: Percent, roles: ['ADMIN', 'CASHIER'] },
      ]
    },
    {
      title: 'RESOURCES',
      items: [
        { path: '/rooms', label: 'Phòng học', icon: DoorOpen, roles: ['ADMIN'] },
        { path: '/schedule-slots', label: 'Ca học', icon: Clock, roles: ['ADMIN'] },
      ]
    },
    {
      title: 'REPORTING',
      items: [
        { path: '/reports', label: 'Báo cáo thống kê', icon: BarChart3, roles: ['ADMIN', 'ACADEMIC_STAFF', 'CASHIER'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 font-bold text-white">
              YO
            </div>
            <span className="text-lg font-bold tracking-wider text-slate-100">
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
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 custom-scrollbar">
          {menuGroups.map((group, index) => {
            const visibleItems = group.items.filter(item => user && item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={index} className="space-y-1">
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-brand-400 border-l-2 border-brand-500'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 shrink-0">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
