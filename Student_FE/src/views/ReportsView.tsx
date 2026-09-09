import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  BarChart3, TrendingUp, Briefcase, FileText, UserCheck, AlertCircle, GraduationCap, Layers
} from 'lucide-react';
import { reportsApi } from '../features/reports/reports.api';

import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

type TabType = 'finance' | 'attendance' | 'academic';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('finance');
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number>(6);

  const { data: monthlyRevData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['reports-monthly-rev', filterYear],
    queryFn: async () => reportsApi.getMonthlyRevenue(filterYear)
  });

  const { data: courseRevData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['reports-course-rev', filterYear, filterMonth],
    queryFn: async () => reportsApi.getCourseRevenue({ year: filterYear, month: filterMonth })
  });

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

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const chartMonthlyData = [...(monthlyRevData || [])]
    .sort((a, b) => a.month - b.month)
    .map(item => ({ name: `T${item.month}`, 'Phải thu': item.totalFinalAmount, 'Thực thu': item.totalAmountPaid }));

  const chartCourseData = (courseRevData || []).map(item => ({ name: item.className, 'Doanh thu': item.totalAmountPaid })).slice(0, 5);

  const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 p-3 rounded-lg"><BarChart3 size={24} /></div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Báo cáo Thống kê & Phân tích</h2>
            <p className="text-sm text-foreground-muted mt-1">Phân tích tình hình tài chính, chuyên cần và học lực.</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-xl flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['finance', 'attendance', 'academic'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab ? 'bg-brand-600 text-white' : 'text-foreground-secondary hover:bg-surface-hover'
              }`}
            >
              {tab === 'finance' && 'Báo cáo Tài chính'}
              {tab === 'attendance' && 'Điểm danh & Chuyên cần'}
              {tab === 'academic' && 'Học lực & Sĩ số lớp'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
             <option value={2026}>Năm 2026</option>
             <option value={2025}>Năm 2025</option>
          </Select>
          <Select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
             {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </Select>
        </div>
      </div>

      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500"/> Biểu đồ Doanh thu (Năm {filterYear})</h3>
              <div className="h-64">
                {isMonthlyLoading ? <div className="h-full flex items-center justify-center text-foreground-muted">Đang tải...</div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis dataKey="name" stroke="currentColor" className="text-foreground-muted" fontSize={10} tickLine={false} />
                      <YAxis stroke="currentColor" className="text-foreground-muted" fontSize={10} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                      <Tooltip formatter={(v: any) => [formatVND(v), '']} contentStyle={{ backgroundColor: 'var(--color-surface, #ffffff)', borderColor: 'var(--color-border, #e2e8f0)', color: 'var(--color-foreground, #0f172a)' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="Thực thu" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="Phải thu" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.05} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Briefcase size={16} className="text-brand-500"/> Doanh thu theo Lớp (Tháng {filterMonth}/{filterYear})</h3>
              <div className="h-64">
                 {isCourseLoading ? <div className="h-full flex items-center justify-center text-foreground-muted">Đang tải...</div> : chartCourseData.length === 0 ? <div className="h-full flex items-center justify-center text-foreground-muted text-sm">Chưa có giao dịch</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartCourseData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                          <XAxis dataKey="name" stroke="currentColor" className="text-foreground-muted" fontSize={10} tickLine={false} />
                          <YAxis stroke="currentColor" className="text-foreground-muted" fontSize={10} tickLine={false} tickFormatter={v => `${v/1000000}M`} />
                          <Tooltip formatter={(v: any) => [formatVND(v), '']} contentStyle={{ backgroundColor: 'var(--color-surface, #ffffff)', borderColor: 'var(--color-border, #e2e8f0)', color: 'var(--color-foreground, #0f172a)' }} />
                          <Bar dataKey="Doanh thu" radius={[4, 4, 0, 0]}>
                             {chartCourseData.map((_, i) => <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 )}
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
             <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2"><FileText size={16} className="text-brand-500"/> Chi tiết doanh thu năm {filterYear}</h4>
             </div>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Phải thu</TableHead>
                      <TableHead className="text-right">Thực thu</TableHead>
                      <TableHead className="text-right">Dư nợ</TableHead>
                      <TableHead className="text-center">Hóa đơn</TableHead>
                      <TableHead className="text-center">Đã trả/Chưa trả</TableHead>
                      <TableHead className="text-right">Tỷ lệ thu</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {isMonthlyLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                   : chartMonthlyData.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8"><EmptyState title="Không có dữ liệu" description="Chưa có hóa đơn nào" /></TableCell></TableRow>
                   : (monthlyRevData || []).map((row, idx) => {
                      const rate = row.totalFinalAmount === 0 ? 0 : (row.totalAmountPaid * 100 / row.totalFinalAmount);
                      return (
                         <TableRow key={idx}>
                            <TableCell className="font-medium text-foreground">Tháng {row.month}/{row.year}</TableCell>
                            <TableCell className="text-right font-mono text-foreground-secondary">{formatVND(row.totalFinalAmount)}</TableCell>
                            <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{formatVND(row.totalAmountPaid)}</TableCell>
                            <TableCell className="text-right font-mono text-red-500 font-semibold">{formatVND(row.totalBalance)}</TableCell>
                            <TableCell className="text-center">{row.totalInvoices}</TableCell>
                            <TableCell className="text-center"><span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.paidInvoices}</span> / <span className="text-red-500 font-medium">{row.unpaidInvoices}</span></TableCell>
                            <TableCell className="text-right font-mono text-brand-600 dark:text-brand-400 font-semibold">{rate.toFixed(1)}%</TableCell>
                         </TableRow>
                      )
                   })}
                </TableBody>
             </Table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-surface border border-border rounded-xl overflow-hidden lg:col-span-2">
               <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2"><UserCheck size={16} className="text-brand-500"/> Tỷ lệ chuyên cần lớp (Tháng {filterMonth}/{filterYear})</h4>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Lớp học</TableHead>
                        <TableHead className="text-center">Lượt</TableHead>
                        <TableHead className="text-center text-emerald-600 dark:text-emerald-400">Có mặt</TableHead>
                        <TableHead className="text-center text-amber-600 dark:text-amber-400">Đi muộn</TableHead>
                        <TableHead className="text-center text-red-500">Vắng</TableHead>
                        <TableHead className="text-right">Tỷ lệ</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {isAttendanceSummaryLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     : !attendanceSummaryData?.length ? <TableRow><TableCell colSpan={6} className="py-8"><EmptyState title="Không có dữ liệu" description="Chưa có điểm danh" /></TableCell></TableRow>
                     : attendanceSummaryData.map((row: any, i: number) => (
                        <TableRow key={i}>
                           <TableCell className="font-medium text-foreground">{row.className}</TableCell>
                           <TableCell className="text-center text-foreground-muted">{row.totalSessions}</TableCell>
                           <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-medium">{row.presentCount}</TableCell>
                           <TableCell className="text-center text-amber-600 dark:text-amber-400 font-medium">{row.lateCount}</TableCell>
                           <TableCell className="text-center text-red-500 font-medium">{row.absentCount}</TableCell>
                           <TableCell className="text-right font-mono text-brand-600 dark:text-brand-400 font-semibold">{row.attendanceRate}%</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
                  <h4 className="font-semibold text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/> Vắng nhiều nhất</h4>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Mã</TableHead>
                        <TableHead className="text-center">Số buổi</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {isTopAbsentLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     : !topAbsentData?.length ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-foreground-muted">Chưa có dữ liệu</TableCell></TableRow>
                     : topAbsentData.map((row: any, i: number) => (
                        <TableRow key={i}>
                           <TableCell className="text-foreground font-medium">{row.studentName}</TableCell>
                           <TableCell className="text-foreground-muted font-mono text-xs">{row.studentCode}</TableCell>
                           <TableCell className="text-center text-red-500 font-bold">{row.absentCount}</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
         </div>
      )}

      {activeTab === 'academic' && (
         <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2"><GraduationCap size={16} className="text-violet-500"/> Xếp loại học lực (Tháng {filterMonth}/{filterYear})</h4>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Lớp</TableHead>
                        <TableHead className="text-center">Đầu điểm</TableHead>
                        <TableHead className="text-center">Điểm TB</TableHead>
                        <TableHead className="text-center text-violet-500">Min - Max</TableHead>
                        <TableHead className="text-center text-emerald-600 dark:text-emerald-400">Xuất Sắc</TableHead>
                        <TableHead className="text-center text-blue-500">Giỏi</TableHead>
                        <TableHead className="text-center text-amber-500">Khá</TableHead>
                        <TableHead className="text-center text-red-500">TB/Yếu</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {isLearningLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     : !learningSummaryData?.length ? <TableRow><TableCell colSpan={8} className="py-8"><EmptyState title="Không có dữ liệu" description="Chưa có điểm tháng này" /></TableCell></TableRow>
                     : learningSummaryData.map((row: any, i: number) => (
                        <TableRow key={i}>
                           <TableCell className="font-medium text-foreground">{row.className}</TableCell>
                           <TableCell className="text-center text-foreground-muted">{row.totalStudents}</TableCell>
                           <TableCell className="text-center font-bold text-violet-600 dark:text-violet-400">{(row.averageScore || 0).toFixed(1)}</TableCell>
                           <TableCell className="text-center text-foreground-secondary">{(row.minScore || 0).toFixed(1)} - {(row.maxScore || 0).toFixed(1)}</TableCell>
                           <TableCell className="text-center text-emerald-600 dark:text-emerald-400 font-semibold">{row.excellentCount}</TableCell>
                           <TableCell className="text-center text-blue-600 dark:text-blue-400 font-semibold">{row.goodCount}</TableCell>
                           <TableCell className="text-center text-amber-600 dark:text-amber-400 font-semibold">{row.averageCount}</TableCell>
                           <TableCell className="text-center text-red-500 font-semibold">{row.weakCount}</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>

            <div className="bg-surface border border-border rounded-xl overflow-hidden">
               <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2"><Layers size={16} className="text-amber-500"/> Sĩ số lớp & Lấp đầy</h4>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Lớp học</TableHead>
                        <TableHead>Mã Lớp</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-center">Tối đa</TableHead>
                        <TableHead className="text-center">Hiện tại</TableHead>
                        <TableHead>Lấp đầy</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {isEnrollmentLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     : !classEnrollmentData?.length ? <TableRow><TableCell colSpan={7} className="py-8"><EmptyState title="Không có dữ liệu" description="Chưa có lớp" /></TableCell></TableRow>
                     : classEnrollmentData.map((row: any, i: number) => (
                        <TableRow key={i}>
                           <TableCell className="font-medium text-foreground">{row.className}</TableCell>
                           <TableCell className="text-foreground-secondary">{row.classCode}</TableCell>
                           <TableCell className="text-foreground-secondary">
                             <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                               row.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                               row.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                               'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                             }`}>
                               {row.status}
                             </span>
                           </TableCell>
                           <TableCell className="text-center text-foreground-muted">{row.maxStudents}</TableCell>
                           <TableCell className="text-center font-bold text-foreground">{row.enrolledCount}</TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <div className="w-24 bg-surface-hover h-2 rounded-full overflow-hidden">
                                    <div className="bg-brand-500 h-full rounded-full" style={{ width: `${Math.min(row.fillRate, 100)}%` }} />
                                 </div>
                                 <span className="font-mono text-xs font-medium text-brand-600 dark:text-brand-400">{row.fillRate}%</span>
                              </div>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
         </div>
      )}
    </div>
  );
};

export default ReportsView;
