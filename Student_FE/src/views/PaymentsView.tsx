import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  Plus,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Calendar,
  DollarSign,
  ChevronDown,
  Coins,
  History,
  FileText,
  User
} from 'lucide-react';
import { billingApi } from '../features/billing/billing.api';
import { paymentsApi } from '../features/payments/payments.api';
import { studentsApi } from '../features/students/students.api';
import type { PaymentResponse, InvoiceResponse, StudentResponse } from '../types/yoedu';

// Zod validation for recording a payment
const paymentFormSchema = z.object({
  studentId: z.string().min(1, 'Học viên là bắt buộc'),
  invoiceId: z.string().min(1, 'Hóa đơn học phí là bắt buộc'),
  paidAmount: z.string().min(1, 'Số tiền đóng là bắt buộc'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']),
  datetimeInput: z.string().min(1, 'Thời gian thanh toán là bắt buộc'),
  note: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const PaymentsView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStudentId, setFilterStudentId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals States
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
  // 1. Fetch Students (for filter and dropdown lists)
  const { data: studentsData } = useQuery({
    queryKey: ['students-list-payments'],
    queryFn: async () => {
      const res = await studentsApi.search({ size: 1000 });
      return res.content;
    }
  });

  // 2. Fetch Payments History (getAll maps to /api/payments/all)
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery<PaymentResponse[]>({
    queryKey: ['payments-all', filterStudentId],
    queryFn: async () => {
      return paymentsApi.getAll();
    }
  });

  // 3. Fetch Invoices for Selected Student in form
  const [formSelectedStudentId, setFormSelectedStudentId] = useState<number | null>(null);
  const { data: studentInvoicesData } = useQuery<InvoiceResponse[]>({
    queryKey: ['form-student-invoices', formSelectedStudentId],
    queryFn: async () => {
      if (!formSelectedStudentId) return [];
      return billingApi.getInvoicesByStudent(formSelectedStudentId);
    },
    enabled: !!formSelectedStudentId
  });

  // Filter out paid invoices for the form selection dropdown
  const unpaidInvoices = studentInvoicesData?.filter(inv => inv.status !== 'PAID') || [];

  // ----------------------------------------------------
  // MUTATIONS (React Query)
  // ----------------------------------------------------
  const recordPaymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      // datetimeInput is YYYY-MM-DDTHH:mm, we append seconds to fit LocalDateTime ISO format
      const paidAtIso = `${values.datetimeInput}:00`;
      
      const payload = {
        invoiceId: Number(values.invoiceId),
        paidAmount: Number(values.paidAmount),
        paymentMethod: values.paymentMethod,
        paidAt: paidAtIso,
        note: values.note || ''
      };

      return billingApi.recordPayment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-all'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-student'] });
      addToast('Ghi nhận thanh toán học phí thành công!', 'success');
      setIsRecordOpen(false);
      reset();
      setFormSelectedStudentId(null);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra khi ghi nhận thanh toán.', 'error');
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
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: '',
      invoiceId: '',
      paidAmount: '0',
      paymentMethod: 'BANK_TRANSFER',
      datetimeInput: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm local offset
      note: ''
    }
  });

  const watchStudentId = watch('studentId');
  const watchInvoiceId = watch('invoiceId');

  // Trigger cascade loading when student changes
  useEffect(() => {
    if (watchStudentId) {
      setFormSelectedStudentId(Number(watchStudentId));
      setValue('invoiceId', '');
      setValue('paidAmount', '0');
    }
  }, [watchStudentId, setValue]);

  // Pre-fill payment amount with invoice balance when invoice changes
  useEffect(() => {
    if (watchInvoiceId && studentInvoicesData) {
      const selectedInvoice = studentInvoicesData.find(i => i.id === Number(watchInvoiceId));
      if (selectedInvoice) {
        setValue('paidAmount', selectedInvoice.balanceAmount.toString());
      }
    }
  }, [watchInvoiceId, studentInvoicesData, setValue]);

  const onSubmitForm = (values: PaymentFormValues) => {
    const selectedInvoice = studentInvoicesData?.find(i => i.id === Number(values.invoiceId));
    if (selectedInvoice && Number(values.paidAmount) > selectedInvoice.balanceAmount) {
      addToast(`Số tiền đóng không được vượt quá số dư còn nợ: ${formatVND(selectedInvoice.balanceAmount)}`, 'error');
      return;
    }
    if (Number(values.paidAmount) <= 0) {
      addToast('Số tiền thanh toán phải lớn hơn 0!', 'error');
      return;
    }

    recordPaymentMutation.mutate(values);
  };

  // ----------------------------------------------------
  // HELPERS & FILTERING
  // ----------------------------------------------------
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    // Formats both LocalDateTime ISO (YYYY-MM-DDTHH:mm:ss) and LocalDate (YYYY-MM-DD)
    const datePart = dateStr.split('T')[0];
    const timePart = dateStr.includes('T') ? dateStr.split('T')[1].slice(0, 5) : '';
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const dmy = `${parts[2]}/${parts[1]}/${parts[0]}`;
      return timePart ? `${timePart} ${dmy}` : dmy;
    }
    return dateStr;
  };

  const getMethodBadgeColor = (method?: string) => {
    return method === 'CASH'
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
  };

  const getMethodLabel = (method?: string) => {
    return method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản';
  };

  // Filter payments locally
  const paymentsList = paymentsData || [];
  const filteredPayments = paymentsList.filter(pay => {
    // 1. Filter by Selected Student
    if (filterStudentId && pay.studentId !== filterStudentId) {
      return false;
    }
    // 2. Filter by search query (checks payment code, student name, student code, invoice code)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      const codeMatch = pay.paymentCode?.toLowerCase().includes(query);
      const studentMatch = pay.studentName?.toLowerCase().includes(query);
      const studentCodeMatch = pay.studentCode?.toLowerCase().includes(query);
      const invoiceMatch = pay.invoiceCode?.toLowerCase().includes(query);
      return codeMatch || studentMatch || studentCodeMatch || invoiceMatch;
    }
    return true;
  });

  // Calculate stats
  const cashPayments = paymentsList.filter(p => p.paymentMethod === 'CASH');
  const transferPayments = paymentsList.filter(p => p.paymentMethod === 'BANK_TRANSFER');
  const cashTotal = cashPayments.reduce((acc, p) => acc + p.paidAmount, 0);
  const transferTotal = transferPayments.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalCollected = paymentsList.reduce((acc, p) => acc + p.paidAmount, 0);

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
            <Coins size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Ghi nhận Thanh toán</h2>
            <p className="text-slate-400 text-sm mt-1">
              Thu tiền học phí học viên, cấp biên lai phiếu thu và tra cứu lịch sử đóng học phí của trung tâm.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRecordOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer w-full md:w-auto"
        >
          <Plus size={18} />
          <span>Lập phiếu thu</span>
        </button>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng đã thu học phí</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatVND(totalCollected)}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
            <Coins size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Thu tiền mặt (CASH)</span>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{formatVND(cashTotal)}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-amber-400">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chuyển khoản (BANK)</span>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{formatVND(transferTotal)}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-indigo-400">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between border border-white/5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã phiếu, tên học viên hoặc mã hóa đơn..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        {/* Filter by Student */}
        <div className="relative w-full md:w-72">
          <select
            value={filterStudentId || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setFilterStudentId(val);
            }}
            className="w-full bg-slate-900/40 border border-slate-850 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer appearance-none"
          >
            <option value="">Lọc theo học viên (Tất cả)</option>
            {studentsData?.map((stu) => (
              <option key={stu.id} value={stu.id}>
                {stu.fullName} ({stu.studentCode})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <History size={18} className="text-brand-400" />
            Lịch sử giao dịch thu học phí
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Mã Giao dịch</th>
                <th className="py-4 px-6">Học viên</th>
                <th className="py-4 px-6">Mã Hóa đơn</th>
                <th className="py-4 px-6">Số tiền đóng</th>
                <th className="py-4 px-6">Phương thức</th>
                <th className="py-4 px-6">Thời gian giao dịch</th>
                <th className="py-4 px-6">Ghi chú phiếu thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              {isPaymentsLoading && (
                [...Array(4)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-20"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                  </tr>
                ))
              )}

              {!isPaymentsLoading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    Không tìm thấy phiếu thu thanh toán nào.
                  </td>
                </tr>
              )}

              {!isPaymentsLoading && filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-emerald-400 text-xs">
                    {pay.paymentCode || `PAY-${pay.id}`}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {pay.studentName || <span className="text-slate-500 font-normal">N/A</span>}
                  </td>
                  <td className="py-4 px-6 font-mono font-semibold text-slate-300 text-xs">
                    {pay.invoiceCode}
                  </td>
                  <td className="py-4 px-6 font-mono font-extrabold text-emerald-400">
                    {formatVND(pay.paidAmount)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getMethodBadgeColor(pay.paymentMethod)}`}>
                      {getMethodLabel(pay.paymentMethod)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-xs">
                    {formatDate(pay.paidAt)}
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-xs truncate max-w-[200px]" title={pay.note}>
                    {pay.note || <span className="text-slate-650">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODAL: RECORD PAYMENT
          ========================================== */}
      {isRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">Lập phiếu thu ghi nhận học phí</h3>
              <button
                onClick={() => setIsRecordOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Chi tiết thu tiền học viên
                </h4>

                {/* Select Student */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học viên nộp tiền *</label>
                  <select
                    {...register('studentId')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">-- Chọn Học viên đóng học phí --</option>
                    {studentsData?.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.fullName} ({stu.studentCode})
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-red-400 text-xs mt-1">{errors.studentId.message}</p>}
                </div>

                {/* Dynamic unpaid Invoices of selected student */}
                {formSelectedStudentId && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Hóa đơn cần thanh toán *</label>
                    <select
                      {...register('invoiceId')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="">-- Chọn Hóa đơn cần đóng --</option>
                      {unpaidInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceCode} ({inv.className}) - Còn nợ: {formatVND(inv.balanceAmount)}
                        </option>
                      ))}
                    </select>
                    {unpaidInvoices.length === 0 && (
                      <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={13} />
                        Học viên đã đóng đủ học phí, không có hóa đơn dư nợ!
                      </p>
                    )}
                    {errors.invoiceId && <p className="text-red-400 text-xs mt-1">{errors.invoiceId.message}</p>}
                  </div>
                )}

                {/* Paid amount */}
                {watchInvoiceId && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Số tiền nộp thu (VND) *</label>
                    <input
                      type="number"
                      {...register('paidAmount')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono font-bold text-emerald-400"
                    />
                    {errors.paidAmount && <p className="text-red-400 text-xs mt-1">{errors.paidAmount.message}</p>}
                  </div>
                )}

                {/* Method & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Phương thức *</label>
                    <select
                      {...register('paymentMethod')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-250 focus:outline-none focus:border-brand-500 cursor-pointer font-bold"
                    >
                      <option value="BANK_TRANSFER">Chuyển khoản</option>
                      <option value="CASH">Tiền mặt (CASH)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Thời gian nộp *</label>
                    <input
                      type="datetime-local"
                      {...register('datetimeInput')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-xs"
                    />
                    {errors.datetimeInput && <p className="text-red-400 text-xs mt-1">{errors.datetimeInput.message}</p>}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ghi chú phiếu thu</label>
                  <textarea
                    rows={2}
                    {...register('note')}
                    placeholder="Ghi chú đính kèm phiếu thu..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {recordPaymentMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Ghi nhận phiếu'
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

export default PaymentsView;
