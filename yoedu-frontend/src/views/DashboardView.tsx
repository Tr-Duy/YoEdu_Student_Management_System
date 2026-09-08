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
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  Coins,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { reportsApi } from '../features/reports/reports.api';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = 2026;
  const currentMonth = 6; // June 2026 as per local clock

  // ----------------------------------------------------
  // DATA FETCHING (React Query)
  // ----------------------------------------------------
  // 1. Fetch Dashboard Cards Statistics (GET /api/reports/dashboard-stats)
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => reportsApi.getDashboardStats()
  });

  // 2. Fetch Monthly Revenue for Recharts Chart (GET /api/reports/revenue/monthly?year=2026)
  const { data: monthlyRevData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['monthly-revenue-chart', currentYear],
    queryFn: async () => reportsApi.getMonthlyRevenue(currentYear)
  });

  // 3. Fetch Course Revenue for Recharts Chart (GET /api/reports/revenue/course?year=2026&month=6)
  const { data: courseRevData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course-revenue-chart', currentYear, currentMonth],
    queryFn: async () => reportsApi.getCourseRevenue({ year: currentYear, month: currentMonth })
  });

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  // Pre-process Monthly Revenue data for Recharts (orders chronologically)
  const chartMonthlyData = [...(monthlyRevData || [])]
    .sort((a, b) => a.month - b.month)
    .map(item => ({
      name: `Tháng ${item.month}`,
      'Phải thu': item.totalFinalAmount,
      'Thực thu (Doanh thu)': item.totalAmountPaid,
      'Còn nợ': item.totalBalance
    }));

  // Pre-process Course Revenue data for Recharts (takes top 5 or sorted)
  const chartCourseData = (courseRevData || [])
    .map(item => ({
      name: item.className,
      'Thực thu': item.totalAmountPaid,
      'Phải thu': item.totalFinalAmount
    }))
    .slice(0, 6);

  // Curated Sleek Palette for charts
  const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

  const stats = statsData as any;

  return (
    <div className="space-y-6 relative">
      {/* Header Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Trung tâm Điều hành YOEDU</h2>
            <p className="text-slate-400 text-sm mt-1">
              Theo dõi thời gian thực kết quả tài chính, sĩ số lớp học và tiến độ đào tạo của trung tâm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-slate-800 text-slate-350 border border-slate-700 px-4 py-2 rounded-xl">
            Năm học 2026 - Học kỳ Hè
          </span>
        </div>
      </div>

      {/* Stats Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* 1. Students Count */}
        <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group hover:border-brand-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học viên hoạt động</span>
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400 group-hover:bg-brand-500/10 transition-all duration-350">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 leading-none">
              {isStatsLoading ? '...' : stats?.studentsCount} em
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
              <TrendingUp size={10} className="text-emerald-400" />
              Đang tham gia học tập
            </p>
          </div>
        </div>

        {/* 2. Courses Count */}
        <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group hover:border-violet-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số môn học</span>
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-white/5 text-violet-400 group-hover:bg-violet-500/10 transition-all duration-350">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 leading-none">
              {isStatsLoading ? '...' : stats?.coursesCount} môn
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Chương trình giáo dục chuẩn</p>
          </div>
        </div>

        {/* 3. Classes Count */}
        <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lớp học đang mở</span>
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-white/5 text-amber-400 group-hover:bg-amber-500/10 transition-all duration-350">
              <School size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100 leading-none">
              {isStatsLoading ? '...' : stats?.classesCount} lớp
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Đầy đủ ca sáng/chiều/tối</p>
          </div>
        </div>

        {/* 4. Current Month Revenue */}
        <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Doanh thu tháng này</span>
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-350">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-400 leading-none">
              {isStatsLoading ? '...' : formatVND(Number(stats?.currentMonthRevenue))}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Học phí thực nhận</p>
          </div>
        </div>

        {/* 5. Unpaid Invoices Count */}
        <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group hover:border-red-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số hóa đơn chưa đóng</span>
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-white/5 text-red-400 group-hover:bg-red-500/10 transition-all duration-350">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-400 leading-none">
              {isStatsLoading ? '...' : stats?.unpaidInvoicesCount} hóa đơn
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
              <AlertCircle size={10} className="text-red-400" />
              Cần rà soát đôn đốc thu
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Doanh thu theo tháng */}
        <div className="glass rounded-3xl p-6 border border-white/5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-400" />
                Biểu đồ Doanh thu học phí theo tháng (Năm {currentYear})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                So sánh số tiền phải thu, thực thu tài chính và dư nợ nợ tồn đọng qua các tháng.
              </p>
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            {isMonthlyLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm animate-pulse">
                Đang tải dữ liệu biểu đồ doanh thu tháng...
              </div>
            ) : chartMonthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Chưa ghi nhận dữ liệu doanh thu tháng.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                    formatter={(value: any) => [formatVND(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="Thực thu (Doanh thu)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Phải thu"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Doanh thu theo khóa / lớp học */}
        <div className="glass rounded-3xl p-6 border border-white/5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award size={18} className="text-violet-400" />
                Biểu đồ doanh thu đóng góp theo Lớp học (Tháng {currentMonth}/{currentYear})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Xếp hạng và hiển thị tổng số tiền thực thu của các lớp học đóng góp cao nhất.
              </p>
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            {isCourseLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm animate-pulse">
                Đang tải dữ liệu doanh thu theo lớp...
              </div>
            ) : chartCourseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Chưa ghi nhận dữ liệu đóng học phí lớp trong tháng này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCourseData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${v / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                    formatter={(value: any) => [formatVND(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Thực thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45}>
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

      {/* Quick Action Navigation Grid */}
      <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
        <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={16} className="text-brand-400" />
          Truy cập nhanh nghiệp vụ văn phòng
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left cursor-pointer group"
          >
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Quản lý Học viên</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">Tra cứu & đăng ký học</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-200 transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/billing')}
            className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left cursor-pointer group"
          >
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Tài chính học phí</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">Lập hóa đơn & đôn nợ</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-200 transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/payments')}
            className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left cursor-pointer group"
          >
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Thanh toán học phí</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">Ghi nhận biên lai đóng phí</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-200 transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left cursor-pointer group"
          >
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Báo cáo & Phân tích</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">Tổng hợp tài chính học vụ</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-200 transition-all group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
