import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Coins,
  History,
  FileText,
  Briefcase,
  Layers,
  GraduationCap,
  CalendarDays,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { reportsApi } from '../features/reports/reports.api';

type TabType = 'finance' | 'attendance' | 'academic';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('finance');
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number>(6);

  // ----------------------------------------------------
  // DATA FETCHING (React Query)
  // ----------------------------------------------------
  // Tab 1: Finance Reports
  const { data: monthlyRevData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['reports-monthly-rev', filterYear],
    queryFn: async () => reportsApi.getMonthlyRevenue(filterYear)
  });

  const { data: courseRevData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['reports-course-rev', filterYear, filterMonth],
    queryFn: async () => reportsApi.getCourseRevenue({ year: filterYear, month: filterMonth })
  });

  // Tab 2: Attendance & Absenteeism Reports
  const { data: attendanceSummaryData, isLoading: isAttendanceSummaryLoading } = useQuery({
    queryKey: ['reports-attendance-summary', filterYear, filterMonth],
    queryFn: async () => reportsApi.getAttendanceSummary({ year: filterYear, month: filterMonth }),
    enabled: activeTab === 'attendance'
  });

  const { data: topAbsentData, isLoading: isTopAbsentLoading } = useQuery({
    queryKey: ['reports-top-absent', filterYear, filterMonth],
    queryFn: async () => reportsApi.getTopAbsentStudents({ year: filterYear, month: filterMonth, limit: 10 }),
    enabled: activeTab === 'attendance'
  });

  // Tab 3: Academic Scores & Sĩ số Reports
  const { data: learningSummaryData, isLoading: isLearningLoading } = useQuery({
    queryKey: ['reports-learning-summary', filterYear, filterMonth],
    queryFn: async () => reportsApi.getLearningSummary({ year: filterYear, month: filterMonth }),
    enabled: activeTab === 'academic'
  });

  const { data: classEnrollmentData, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: ['reports-class-enrollment'],
    queryFn: async () => reportsApi.getClassEnrollmentSummary(),
    enabled: activeTab === 'academic'
  });

  // ----------------------------------------------------
  // HELPERS & CONSTANTS
  // ----------------------------------------------------
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const chartMonthlyData = [...(monthlyRevData || [])]
    .sort((a, b) => a.month - b.month)
    .map(item => ({
      name: `T${item.month}`,
      'Phải thu': item.totalFinalAmount,
      'Thực thu': item.totalAmountPaid
    }));

  const chartCourseData = (courseRevData || []).map(item => ({
    name: item.className,
    'Doanh thu': item.totalAmountPaid
  })).slice(0, 5);

  const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 relative">
      {/* Header Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <BarChart3 size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Báo cáo Thống kê & Phân tích</h2>
            <p className="text-slate-400 text-sm mt-1">
              Phân tích chuyên sâu về tình hình tài chính doanh thu, mức độ chuyên cần đi học và kết quả kiểm tra xếp loại học lực của học viên.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Controller & Filters */}
      <div className="glass rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between border border-white/5">
        {/* Tab triggers */}
        <div className="flex items-center gap-2 overflow-x-auto bg-slate-950/40 p-1.5 rounded-2xl border border-slate-900">
          {(['finance', 'attendance', 'academic'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'finance' && 'Báo cáo Tài chính'}
              {tab === 'attendance' && 'Điểm danh & Chuyên cần'}
              {tab === 'academic' && 'Học lực & Sĩ số lớp'}
            </button>
          ))}
        </div>

        {/* Global Year/Month Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-4 text-xs text-slate-200 font-bold focus:outline-none focus:border-brand-500 cursor-pointer appearance-none pr-8"
            >
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-4 text-xs text-slate-200 font-bold focus:outline-none focus:border-brand-500 cursor-pointer appearance-none pr-8"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          TAB 1: FINANCIAL REPORTS
          ========================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Recharts Plots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Biểu đồ Doanh thu tháng (Thực thu vs Phải thu - Năm {filterYear})
              </h3>
              <div className="h-64 w-full">
                {isMonthlyLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                      <Tooltip formatter={(v: any) => [formatVND(v), '']} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="Thực thu" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="Phải thu" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.05} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Briefcase size={16} className="text-brand-400" />
                Đóng góp Doanh thu theo Lớp học (Top 5 - Tháng {filterMonth}/{filterYear})
              </h3>
              <div className="h-64 w-full">
                {isCourseLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs animate-pulse">Loading...</div>
                ) : chartCourseData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">Chưa có giao dịch thanh toán nào ghi nhận.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartCourseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                      <Tooltip formatter={(v: any) => [formatVND(v), '']} />
                      <Bar dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {chartCourseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileText size={16} className="text-brand-400" />
                Báo cáo tài chính doanh thu chi tiết các tháng trong năm {filterYear}
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Thời gian</th>
                    <th className="py-4 px-6 text-right">Tổng phải thu (Final Amount)</th>
                    <th className="py-4 px-6 text-right">Tổng thực thu (Collected)</th>
                    <th className="py-4 px-6 text-right">Tổng dư nợ (Balance)</th>
                    <th className="py-4 px-6 text-center">Tổng số hóa đơn</th>
                    <th className="py-4 px-6 text-center">Đã trả / Chưa trả</th>
                    <th className="py-4 px-6 text-right">Tỷ lệ thu hồi nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {isMonthlyLoading && (
                    [...Array(3)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto"></div></td>
                        <td className="py-4.5 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto"></div></td>
                        <td className="py-4.5 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-24 ml-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-16 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-16 ml-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isMonthlyLoading && chartMonthlyData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">Chưa ghi nhận hóa đơn học phí nào phát hành trong năm này.</td>
                    </tr>
                  )}

                  {!isMonthlyLoading && (monthlyRevData || []).map((row, idx) => {
                    const collectRate = row.totalFinalAmount === 0 ? 0 : (row.totalAmountPaid * 100.0 / row.totalFinalAmount);
                    return (
                      <tr key={idx} className="hover:bg-slate-900/25 transition-all duration-150">
                        <td className="py-4 px-6 font-bold text-slate-100">
                          Tháng {row.month}/{row.year}
                        </td>
                        <td className="py-4 px-6 font-mono font-extrabold text-right text-slate-200">
                          {formatVND(row.totalFinalAmount)}
                        </td>
                        <td className="py-4 px-6 font-mono font-extrabold text-right text-emerald-400">
                          {formatVND(row.totalAmountPaid)}
                        </td>
                        <td className="py-4 px-6 font-mono font-extrabold text-right text-red-400">
                          {formatVND(row.totalBalance)}
                        </td>
                        <td className="py-4 px-6 font-mono font-semibold text-center text-slate-300">
                          {row.totalInvoices}
                        </td>
                        <td className="py-4 px-6 text-center text-xs">
                          <span className="text-emerald-400 font-bold">{row.paidInvoices}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-red-450 font-bold">{row.unpaidInvoices}</span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-brand-400">
                          {collectRate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ATTENDANCE & ABSENTEEISM
          ========================================== */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Class Attendance summaries */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl lg:col-span-2">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <UserCheck size={16} className="text-brand-400" />
                Thống kê Tỷ lệ đi học chuyên cần theo Lớp học (Tháng {filterMonth}/{filterYear})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Tên Lớp học</th>
                    <th className="py-4 px-6 text-center">Tổng lượt điểm danh</th>
                    <th className="py-4 px-6 text-center text-emerald-400">Đi học</th>
                    <th className="py-4 px-6 text-center text-amber-400">Đi muộn</th>
                    <th className="py-4 px-6 text-center text-red-400">Vắng mặt</th>
                    <th className="py-4 px-6 text-right">Tỷ lệ Chuyên cần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {isAttendanceSummaryLoading && (
                    [...Array(3)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-right"><div className="h-4 bg-slate-800 rounded w-12 ml-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isAttendanceSummaryLoading && (!attendanceSummaryData || attendanceSummaryData.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">Chưa ghi nhận buổi điểm danh nào của các lớp học trong tháng này.</td>
                    </tr>
                  )}

                  {!isAttendanceSummaryLoading && attendanceSummaryData && attendanceSummaryData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/25 transition-all duration-150">
                      <td className="py-4 px-6 font-bold text-slate-100">{row.className}</td>
                      <td className="py-4 px-6 font-mono text-center text-slate-350">{row.totalCount} lượt</td>
                      <td className="py-4 px-6 font-mono text-center text-emerald-400 font-bold">{row.presentCount}</td>
                      <td className="py-4 px-6 font-mono text-center text-amber-400 font-bold">{row.lateCount}</td>
                      <td className="py-4 px-6 font-mono text-center text-red-400 font-bold">{row.absentCount}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-brand-400">{row.attendanceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Absent Students list */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h4 className="font-bold text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Học viên vắng học nhiều nhất
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Học viên</th>
                    <th className="py-4 px-6">Mã số</th>
                    <th className="py-4 px-6 text-center text-red-400">Số buổi nghỉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {isTopAbsentLoading && (
                    [...Array(4)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isTopAbsentLoading && (!topAbsentData || topAbsentData.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500">Học sinh chuyên cần tuyệt đối, không ghi nhận trường hợp nghỉ nhiều.</td>
                    </tr>
                  )}

                  {!isTopAbsentLoading && topAbsentData && topAbsentData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-red-950/10 transition-all duration-150">
                      <td className="py-4 px-6 font-bold text-slate-100">{row.studentName}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">{row.studentCode}</td>
                      <td className="py-4 px-6 font-mono text-center text-red-400 font-extrabold">{row.absentCount} buổi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: ACADEMIC GRADES & CAPACITY UTILIZATION
          ========================================== */}
      {activeTab === 'academic' && (
        <div className="space-y-6 animate-fade-in">
          {/* Learning Results Summary */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-violet-400" />
                Tổng hợp Xếp loại học lực & Bảng điểm trung bình theo Lớp học (Tháng {filterMonth}/{filterYear})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Tên Lớp học</th>
                    <th className="py-4 px-6 text-center">Đầu điểm</th>
                    <th className="py-4 px-6 text-center">Điểm TB</th>
                    <th className="py-4 px-6 text-center text-violet-400">Min - Max</th>
                    <th className="py-4 px-6 text-center text-emerald-400">Xuất Sắc (9-10)</th>
                    <th className="py-4 px-6 text-center text-blue-400">Giỏi (8-9)</th>
                    <th className="py-4 px-6 text-center text-amber-400">Khá (6.5-8)</th>
                    <th className="py-4 px-6 text-center text-red-400">Trung bình / Yếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {isLearningLoading && (
                    [...Array(2)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-16 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isLearningLoading && (!learningSummaryData || learningSummaryData.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">Chưa cập nhật bảng xếp loại điểm học lực của học viên các lớp học tháng này.</td>
                    </tr>
                  )}

                  {!isLearningLoading && learningSummaryData && learningSummaryData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/25 transition-all duration-150">
                      <td className="py-4 px-6 font-bold text-slate-100">{row.className}</td>
                      <td className="py-4 px-6 font-mono text-center text-slate-400">{row.totalScoreCount}</td>
                      <td className="py-4 px-6 font-mono text-center font-bold text-violet-400">{row.avgScore.toFixed(1)}</td>
                      <td className="py-4 px-6 font-mono text-center text-slate-450">{row.minScore.toFixed(1)} - {row.maxScore.toFixed(1)}</td>
                      <td className="py-4 px-6 font-mono text-center text-emerald-400 font-extrabold">{row.excellentCount} em</td>
                      <td className="py-4 px-6 font-mono text-center text-blue-400 font-bold">{row.goodCount} em</td>
                      <td className="py-4 px-6 font-mono text-center text-amber-400 font-bold">{row.averageCount} em</td>
                      <td className="py-4 px-6 font-mono text-center text-red-400 font-bold">{row.weakCount} em</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classroom capacities utilization */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                Thống kê Sĩ số lớp học & Tỷ lệ lấp đầy phòng học
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Tên Lớp học</th>
                    <th className="py-4 px-6">Môn học</th>
                    <th className="py-4 px-6">Phòng học</th>
                    <th className="py-4 px-6">Lịch học thời gian</th>
                    <th className="py-4 px-6 text-center">Học viên tối đa</th>
                    <th className="py-4 px-6 text-center">Đã tuyển sĩ số</th>
                    <th className="py-4 px-6">Tỷ lệ lấp đầy chỗ ngồi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {isEnrollmentLoading && (
                    [...Array(2)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6 text-center"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                      </tr>
                    ))
                  )}

                  {!isEnrollmentLoading && (!classEnrollmentData || classEnrollmentData.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">Chưa ghi nhận lớp học nào đang hoạt động tuyển sinh.</td>
                    </tr>
                  )}

                  {!isEnrollmentLoading && classEnrollmentData && classEnrollmentData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/25 transition-all duration-150">
                      <td className="py-4 px-6 font-bold text-slate-100">{row.className}</td>
                      <td className="py-4 px-6 text-slate-300">{row.courseName}</td>
                      <td className="py-4 px-6 text-slate-300 font-semibold">{row.roomName}</td>
                      <td className="py-4 px-6 text-slate-400 text-xs">{row.scheduleSlotLabel}</td>
                      <td className="py-4 px-6 font-mono text-center text-slate-300">{row.maxStudents} em</td>
                      <td className="py-4 px-6 font-mono text-center font-bold text-slate-200">{row.enrolledCount} em</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className="bg-brand-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(row.fillRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-bold text-brand-400 whitespace-nowrap">{row.fillRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
