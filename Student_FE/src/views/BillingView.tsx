import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Eye,
  X,
  Receipt,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  Gift,
  AlertTriangle,
  History,
  Search,
  Filter,
  RefreshCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { billingApi } from '../features/billing/billing.api';
import { studentsApi } from '../features/students/students.api';
import { classesApi } from '../features/classes/classes.api';
import { promotionsApi } from '../features/promotions/promotions.api';
import type { InvoiceResponse } from '../types/yoedu';

// Zod validation for single invoice creation
const invoiceFormSchema = z.object({
  studentId: z.string().min(1, 'Học viên là bắt buộc'),
  courseClassId: z.string().min(1, 'Lớp học là bắt buộc'),
  monthInput: z.string().min(1, 'Tháng đóng học phí là bắt buộc'),
  promotionId: z.string().optional(),
  originalAmount: z.string().min(1, 'Số tiền là bắt buộc'),
  dueDate: z.string().optional(),
  note: z.string().optional()
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const BillingView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
    search: '',
    studentId: '',
    classId: '',
    status: '',
    month: ''
  });
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);

  // Add Toast helper
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ----------------------------------------------------
  // DATA FETCHING (React Query)
  // ----------------------------------------------------
  // 1. Fetch Students (for dropdown lists)
  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await studentsApi.search({ size: 1000 });
      return res.content;
    }
  });

  // 2. Fetch Course Classes (for dropdown lists)
  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: async () => {
      const res = await classesApi.search({ size: 1000 });
      return res.content;
    }
  });

  // 3. Fetch Promotions (for dropdown lists)
  const { data: promotionsData } = useQuery({
    queryKey: ['promotions-list'],
    queryFn: async () => promotionsApi.getAll()
  });

  // 4. Fetch Global Invoices
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices-search', filters],
    queryFn: async () => {
      return billingApi.searchInvoices({
        page: filters.page,
        size: filters.size,
        search: filters.search || undefined,
        studentId: filters.studentId ? Number(filters.studentId) : undefined,
        classId: filters.classId ? Number(filters.classId) : undefined,
        status: filters.status || undefined,
        month: filters.month || undefined
      });
    }
  });

  // 5. Fetch Global Invoice Stats
  const { data: statsData } = useQuery({
    queryKey: ['invoices-stats', filters],
    queryFn: async () => {
      return billingApi.getInvoiceStats({
        search: filters.search || undefined,
        studentId: filters.studentId ? Number(filters.studentId) : undefined,
        classId: filters.classId ? Number(filters.classId) : undefined,
        status: filters.status || undefined,
        month: filters.month || undefined
      });
    }
  });

  // 6. Fetch Overdue Warnings
  const { data: warningsData, isLoading: isWarningsLoading } = useQuery({
    queryKey: ['overdue-warnings'],
    queryFn: async () => billingApi.getOverdueWarnings(),
    enabled: showWarningsOnly
  });

  // ----------------------------------------------------
  // MUTATIONS (React Query)
  // ----------------------------------------------------
  const createInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      // billingMonth must be formatted as YYYY-MM-01
      const formattedMonth = `${values.monthInput}-01`;

      const payload = {
        studentId: Number(values.studentId),
        courseClassId: Number(values.courseClassId),
        billingMonth: formattedMonth,
        originalAmount: Number(values.originalAmount),
        promotionId: values.promotionId ? Number(values.promotionId) : null,
        dueDate: values.dueDate ? values.dueDate : undefined,
        note: values.note || ''
      };

      return billingApi.createInvoice(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-search'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-stats'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-warnings'] });
      addToast('Tạo hóa đơn học phí thành công!', 'success');
      setIsCreateOpen(false);
      reset();
    },
    onError: (err: any) => {
      addToast(err?.message || 'Không thể tạo hóa đơn học phí.', 'error');
    }
  });

  // ----------------------------------------------------
  // REACT HOOK FORM SETUP
  // ----------------------------------------------------
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      studentId: '',
      courseClassId: '',
      monthInput: new Date().toISOString().slice(0, 7), // YYYY-MM
      promotionId: '',
      originalAmount: '0',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: ''
    }
  });

  const watchClassId = watch('courseClassId');

  // Pre-fill amount when class changes
  useEffect(() => {
    if (watchClassId && classesData) {
      const selectedClass = classesData.find(c => c.id === Number(watchClassId));
      if (selectedClass) {
        setValue('originalAmount', selectedClass.tuitionFee.toString());
      }
    }
  }, [watchClassId, classesData, setValue]);

  const onSubmitForm = (values: InvoiceFormValues) => {
    createInvoiceMutation.mutate(values);
  };

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatMonth = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status?: string) => {
    let cleanStatus = status || 'UNPAID';
    if (cleanStatus === 'PARTIALLY_PAID') cleanStatus = 'PARTIAL';

    switch (cleanStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold">
            Đã thanh toán
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 text-xs font-bold">
            Trả một phần
          </span>
        );
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 px-2.5 py-0.5 text-xs font-bold">
            Chưa thanh toán
          </span>
        );
      case 'OVERPAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 text-xs font-bold">
            Đóng dư
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2.5 py-0.5 text-xs font-bold">
            {cleanStatus}
          </span>
        );
    }
  };

  // Calculations for Stats
  const activeInvoicesList = invoicesData?.content || [];
  const totalPages = invoicesData?.totalPages || 0;
  
  const totalUnpaid = statsData?.totalUnpaidAmount || 0;
  const totalPaid = statsData?.totalPaidAmount || 0;
  const totalInvoicesCount = statsData?.totalInvoicesCount || 0;

  return (
    <div className="space-y-6 relative">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xl border animate-slide-in max-w-sm ${
              toast.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-950/40 text-emerald-400'
                : 'border-red-500/25 bg-red-950/40 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <AlertCircle size={20} className="shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <Receipt size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Hóa đơn & Học phí</h2>
            <p className="text-slate-400 text-sm mt-1">
              Tra cứu hóa đơn của học viên, lập hóa đơn đơn lẻ hoặc hàng loạt và rà soát công nợ quá hạn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setShowWarningsOnly(!showWarningsOnly);
            }}
            className={`flex items-center justify-center gap-2 rounded-2xl border text-sm font-bold px-5 py-3.5 transition-all cursor-pointer w-full md:w-auto ${
              showWarningsOnly
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={18} />
            <span>Nợ Quá Hạn ({warningsData?.length || 0})</span>
          </button>

          <button
            onClick={() => {
              setIsCreateOpen(true);
              setValue('studentId', filters.studentId);
              if (filters.classId) setValue('courseClassId', filters.classId);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer w-full md:w-auto shrink-0"
          >
            <Plus size={18} />
            <span>Tạo Hóa đơn</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {!showWarningsOnly && (
        <div className="glass rounded-3xl p-5 border border-white/5 shadow-lg space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã hóa đơn, tên học viên, mã học viên..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 0 }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
              <div className="relative shrink-0">
                <select
                  value={filters.studentId}
                  onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value, page: 0 }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-100 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
                >
                  <option value="">-- Tất cả Học viên --</option>
                  {studentsData?.map((stu) => (
                    <option key={stu.id} value={stu.id}>{stu.fullName} ({stu.studentCode})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative shrink-0">
                <select
                  value={filters.classId}
                  onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value, page: 0 }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-100 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
                >
                  <option value="">-- Tất cả Lớp học --</option>
                  {classesData?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative shrink-0">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-100 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
                >
                  <option value="">-- Trạng thái --</option>
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="PARTIAL">Trạng thái Nợ (Partial)</option>
                  <option value="OVERPAID">Đóng dư</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative shrink-0">
                <input
                  type="month"
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value, page: 0 }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setFilters({ page: 0, size: 10, search: '', studentId: '', classId: '', status: '', month: '' })}
                className="shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all border border-slate-700"
              >
                <RefreshCcw size={16} /> Xóa lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tra cứu Stats summary card */}
      {!showWarningsOnly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số hóa đơn</span>
              <h3 className="text-2xl font-black text-slate-100 mt-1">{totalInvoicesCount} hóa đơn</h3>
            </div>
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
              <History size={20} />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Đã hoàn thành đóng</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatVND(totalPaid)}</h3>
            </div>
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học phí còn nợ</span>
              <h3 className="text-2xl font-black text-red-400 mt-1">{formatVND(totalUnpaid)}</h3>
            </div>
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-red-400">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
        {!showWarningsOnly ? (
          // Standard Invoice List View
          <div>
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base">
                Danh sách hóa đơn
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Mã Hóa đơn</th>
                    <th className="py-4 px-6">Lớp học</th>
                    <th className="py-4 px-6">Tháng đóng</th>
                    <th className="py-4 px-6">Tổng học phí</th>
                    <th className="py-4 px-6">Khuyến mãi</th>
                    <th className="py-4 px-6">Đã đóng</th>
                    <th className="py-4 px-6">Còn nợ</th>
                    <th className="py-4 px-6">Hạn nộp</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {isInvoicesLoading && (
                    [...Array(3)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                        <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-12 mx-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isInvoicesLoading && activeInvoicesList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-500">
                        {filters.search || filters.studentId || filters.classId || filters.status || filters.month
                          ? 'Không tìm thấy hóa đơn phù hợp với bộ lọc.'
                          : 'Chưa có hóa đơn nào.'}
                      </td>
                    </tr>
                  )}

                  {!isInvoicesLoading && activeInvoicesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/25 transition-all duration-150">
                      <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                        {inv.invoiceCode}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {inv.className}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {formatMonth(inv.billingMonth)}
                      </td>
                      <td className="py-4 px-6 font-mono font-extrabold text-slate-100">
                        {formatVND(inv.finalAmount)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {inv.promotionName ? (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 border border-slate-700 font-medium">
                            <Gift size={11} className="text-brand-400" />
                            {inv.promotionName} (-{formatVND(inv.discountAmount)})
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-emerald-400 font-bold">
                        {formatVND(inv.amountPaid)}
                      </td>
                      <td className="py-4 px-6 font-mono text-red-400 font-bold">
                        {formatVND(inv.balanceAmount)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsDetailsOpen(true);
                            }}
                            title="Xem chi tiết hóa đơn"
                            className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Trang {filters.page + 1} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={filters.page === 0}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={filters.page >= totalPages - 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Overdue Warnings View
          <div>
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
                <AlertTriangle size={18} />
                Danh sách Học viên nợ học phí quá hạn (&gt; 1 tháng)
              </h3>
              <button
                onClick={() => setShowWarningsOnly(false)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-850 px-3.5 py-2 rounded-xl transition-all border border-slate-700 cursor-pointer"
              >
                Quay lại Tra cứu
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Mã Hóa đơn</th>
                    <th className="py-4 px-6">Học viên</th>
                    <th className="py-4 px-6">Lớp học</th>
                    <th className="py-4 px-6">Tháng hóa đơn</th>
                    <th className="py-4 px-6">Hạn đóng nộp</th>
                    <th className="py-4 px-6">Số tiền nợ lại</th>
                    <th className="py-4 px-6">Số ngày quá hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {isWarningsLoading && (
                    [...Array(3)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-36"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                      </tr>
                    ))
                  )}

                  {!isWarningsLoading && (!warningsData || warningsData.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-500">
                        Không phát hiện trường hợp nợ học phí quá hạn nào! Hệ thống tài chính cực kỳ lành mạnh.
                      </td>
                    </tr>
                  )}

                  {!isWarningsLoading && warningsData && warningsData.map((war: any) => (
                    <tr key={war.invoiceId} className="hover:bg-amber-950/10 hover:border-l-2 hover:border-l-amber-500 transition-all duration-150">
                      <td className="py-4 px-6 font-mono font-bold text-amber-500 text-xs">
                        {war.invoiceCode}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-100">
                        {war.studentName}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {war.className}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {formatMonth(war.billingMonth)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {formatDate(war.dueDate)}
                      </td>
                      <td className="py-4 px-6 font-mono text-red-400 font-extrabold text-sm">
                        {formatVND(war.balanceAmount)}
                      </td>
                      <td className="py-4 px-6 font-bold text-amber-400 font-mono">
                        {war.overdueDays} ngày quá hạn
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: VIEW DETAILS
          ========================================== */}
      {isDetailsOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedInvoice.invoiceCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Hóa đơn học phí</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student and Class Header card */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-xs block">Tên Học viên</span>
                    <span className="text-slate-100 font-extrabold mt-1 text-base block">
                      {selectedInvoice.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-xs block">Lớp học liên kết</span>
                    <span className="text-slate-100 font-bold mt-1 text-sm block">
                      {selectedInvoice.className}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 text-xs block">Tháng đóng học phí</span>
                    <span className="text-slate-200 font-semibold mt-1 text-sm block">
                      {formatMonth(selectedInvoice.billingMonth)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-xs block">Hạn đóng nộp cuối</span>
                    <span className="text-slate-200 font-semibold mt-1 text-sm block">
                      {formatDate(selectedInvoice.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial aggregates */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  Chi tiết tài chính hóa đơn
                </h4>

                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-slate-400">Học phí gốc lớp học</span>
                  <span className="font-mono text-slate-100 font-semibold">{formatVND(selectedInvoice.originalAmount)}</span>
                </div>

                {selectedInvoice.promotionName && (
                  <div className="flex justify-between items-center text-sm py-1 text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Gift size={14} />
                      Áp dụng ưu đãi: {selectedInvoice.promotionName}
                    </span>
                    <span className="font-mono font-bold">- {formatVND(selectedInvoice.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm py-2 border-t border-slate-800/80 font-bold">
                  <span className="text-slate-200">Tổng tiền phải thanh toán</span>
                  <span className="font-mono text-brand-400 text-base">{formatVND(selectedInvoice.finalAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-1 border-t border-slate-800/40 text-emerald-400 font-semibold">
                  <span>Số tiền đã thanh toán</span>
                  <span className="font-mono">{formatVND(selectedInvoice.amountPaid)}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-2 border-t border-slate-800/60 text-red-400 font-bold">
                  <span>Dư nợ học phí còn lại</span>
                  <span className="font-mono text-lg">{formatVND(selectedInvoice.balanceAmount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.note && (
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Ghi chú học phí</span>
                  <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed font-medium">
                    {selectedInvoice.note}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-2.5 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE SINGLE INVOICE
          ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">Tạo hóa đơn học phí đơn lẻ</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Thông tin học tập & học phí
                </h4>

                {/* Select Student */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chọn học viên *</label>
                  <select
                    {...register('studentId')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">-- Chọn Học viên --</option>
                    {studentsData?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-red-400 text-xs mt-1">{errors.studentId.message}</p>}
                </div>

                {/* Select Class */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chọn Lớp học *</label>
                  <select
                    {...register('courseClassId')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">-- Chọn Lớp học --</option>
                    {classesData?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatVND(c.tuitionFee)})
                      </option>
                    ))}
                  </select>
                  {errors.courseClassId && <p className="text-red-400 text-xs mt-1">{errors.courseClassId.message}</p>}
                </div>

                {/* Select Promotion */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chương trình khuyến mãi ưu đãi</label>
                  <select
                    {...register('promotionId')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">-- Không áp dụng khuyến mãi --</option>
                    {promotionsData?.filter(p => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.discountType === 'PERCENTAGE' || p.discountType === 'PERCENT' ? `Giảm ${p.discountValue}%` : `Giảm ${formatVND(p.discountValue)}`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tuition Fee amount */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học phí gốc (VND) *</label>
                  <input
                    type="number"
                    {...register('originalAmount')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  {errors.originalAmount && <p className="text-red-400 text-xs mt-1">{errors.originalAmount.message}</p>}
                </div>

                {/* Month input (HTML5 Month Picker) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tháng hóa đơn *</label>
                    <input
                      type="month"
                      {...register('monthInput')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {errors.monthInput && <p className="text-red-400 text-xs mt-1">{errors.monthInput.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Hạn thanh toán</label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ghi chú đính kèm</label>
                  <textarea
                    rows={2}
                    {...register('note')}
                    placeholder="Ghi chú đính kèm hóa đơn..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {createInvoiceMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Xuất Hóa đơn'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingView;
