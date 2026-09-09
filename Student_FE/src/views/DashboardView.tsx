import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Users,
  BookOpen,
  School,
  Coins,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight
} from 'lucide-react';
import { reportsApi } from '../features/reports/reports.api';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = 2026;
  const currentMonth = 6;

  // Fetch Dashboard Cards Statistics
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => reportsApi.getDashboardStats()
  });

  // Fetch Monthly Revenue
  const { data: monthlyRevData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['monthly-revenue-chart', currentYear],
    queryFn: async () => reportsApi.getMonthlyRevenue(currentYear)
  });

  // Fetch Course Revenue
  const { data: courseRevData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course-revenue-chart', currentYear, currentMonth],
    queryFn: async () => reportsApi.getCourseRevenue({ year: currentYear, month: currentMonth })
  });

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const chartMonthlyData = [...(monthlyRevData || [])]
    .sort((a, b) => a.month - b.month)
    .map(item => ({
      name: `Tháng ${item.month}`,
      'Phải thu': item.totalFinalAmount,
      'Thực thu': item.totalAmountPaid,
      'Còn nợ': item.totalBalance
    }));

  const chartCourseData = (courseRevData || [])
    .map(item => ({
      name: item.className,
      'Thực thu': item.totalAmountPaid,
      'Phải thu': item.totalFinalAmount
    }))
    .slice(0, 6);

  const BAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
  const stats = statsData as any;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Tổng quan</h2>
          <p className="text-sm text-slate-400 mt-1">Kết quả tài chính, sĩ số lớp học và tiến độ đào tạo.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm font-medium text-slate-300">
          Năm học 2026 - Học kỳ Hè
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Học viên"
          value={isStatsLoading ? '...' : stats?.studentsCount}
          subtitle="Đang tham gia học"
          icon={<Users size={18} className="text-blue-500" />}
        />
        <StatCard
          title="Môn học"
          value={isStatsLoading ? '...' : stats?.coursesCount}
          subtitle="Chương trình chuẩn"
          icon={<BookOpen size={18} className="text-violet-500" />}
        />
        <StatCard
          title="Lớp học"
          value={isStatsLoading ? '...' : stats?.classesCount}
          subtitle="Đang mở"
          icon={<School size={18} className="text-amber-500" />}
        />
        <StatCard
          title="Doanh thu tháng"
          value={isStatsLoading ? '...' : formatVND(Number(stats?.currentMonthRevenue))}
          subtitle="Thực nhận"
          icon={<Coins size={18} className="text-emerald-500" />}
        />
        <StatCard
          title="Hóa đơn nợ"
          value={isStatsLoading ? '...' : stats?.unpaidInvoicesCount}
          subtitle="Cần đôn đốc"
          icon={<AlertCircle size={18} className="text-rose-500" />}
          danger
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              Doanh thu theo tháng
            </h3>
          </div>
          <div className="h-72 w-full">
            {isMonthlyLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Đang tải...</div>
            ) : chartMonthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '13px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: any) => [formatVND(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                  <Area type="monotone" dataKey="Thực thu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="Phải thu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorDue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-100 flex items-center gap-2">
              <Award size={16} className="text-violet-400" />
              Đóng góp theo lớp
            </h3>
          </div>
          <div className="h-72 w-full">
            {isCourseLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Đang tải...</div>
            ) : chartCourseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCourseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '13px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: any) => [formatVND(value), '']}
                    cursor={{ fill: '#334155', opacity: 0.2 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="Thực thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartCourseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <ActionCard title="Quản lý Học viên" desc="Tra cứu & đăng ký" path="/students" navigate={navigate} />
          <ActionCard title="Tài chính học phí" desc="Lập hóa đơn & đôn nợ" path="/billing" navigate={navigate} />
          <ActionCard title="Thanh toán" desc="Ghi nhận biên lai" path="/payments" navigate={navigate} />
          <ActionCard title="Báo cáo" desc="Tổng hợp tài chính" path="/reports" navigate={navigate} />
        </div>
      </div>
    </div>
  );
};

function StatCard({ title, value, subtitle, icon, danger = false }: any) {
  return (
    <div className={`bg-slate-900 border ${danger ? 'border-rose-500/20' : 'border-slate-800'} rounded-xl p-4 flex flex-col justify-between h-28`}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${danger ? 'text-rose-400' : 'text-slate-100'} leading-none`}>{value}</div>
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, path, navigate }: any) {
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl transition-colors text-left group"
    >
      <div>
        <span className="text-sm font-medium text-slate-200 block">{title}</span>
        <span className="text-xs text-slate-500 mt-0.5 block">{desc}</span>
      </div>
      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
    </button>
  );
}

export default DashboardView;
