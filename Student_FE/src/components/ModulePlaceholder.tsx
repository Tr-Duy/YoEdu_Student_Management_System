import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: string[];
  stats?: { label: string; value: string | number }[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  icon,
  actions = [],
  stats = []
}) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Module Title Card */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50">{title}</h2>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          </div>
        </div>

        {/* User Role Quick Info */}
        <div className="glass bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-white/5 text-xs text-slate-300">
          Vai trò hiện tại: <span className="font-bold text-brand-400">{user?.role}</span>
        </div>
      </div>

      {/* Module Stats (Optional Grid) */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass glass-hover rounded-2xl p-6 border border-white/5 card-glow">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {stat.label}
              </span>
              <span className="text-2xl font-black text-slate-100">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Operations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 border border-white/5 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Các nghiệp vụ đã sẵn sàng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl bg-slate-900/40 p-4 border border-white/5 hover:border-brand-500/30 transition-all group"
              >
                <div className="h-2 w-2 rounded-full bg-brand-500 group-hover:scale-125 transition-all"></div>
                <span className="text-sm text-slate-300 font-medium">{action}</span>
              </div>
            ))}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};
