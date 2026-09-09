import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, CreditCard, DollarSign, Coins, History
} from 'lucide-react';
import { billingApi } from '../features/billing/billing.api';
import { paymentsApi } from '../features/payments/payments.api';
import { studentsApi } from '../features/students/students.api';
import type { PaymentResponse, InvoiceResponse } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

const paymentFormSchema = z.object({
  studentId: z.string().min(1, 'Học viên là bắt buộc'),
  invoiceId: z.string().min(1, 'Hóa đơn học phí là bắt buộc'),
  paidAmount: z.string().min(1, 'Số tiền đóng là bắt buộc'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']),
  datetimeInput: z.string().min(1, 'Thời gian thanh toán là bắt buộc'),
  note: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const PaymentsView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStudentId, setFilterStudentId] = useState<number | null>(null);

  const [isRecordOpen, setIsRecordOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: studentsData } = useQuery({
    queryKey: ['students-list-payments'],
    queryFn: async () => (await studentsApi.search({ size: 1000 })).content
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery<PaymentResponse[]>({
    queryKey: ['payments-all', filterStudentId],
    queryFn: async () => paymentsApi.getAll()
  });

  const [formSelectedStudentId, setFormSelectedStudentId] = useState<number | null>(null);
  const { data: studentInvoicesData } = useQuery<InvoiceResponse[]>({
    queryKey: ['form-student-invoices', formSelectedStudentId],
    queryFn: async () => formSelectedStudentId ? billingApi.getInvoicesByStudent(formSelectedStudentId) : [],
    enabled: !!formSelectedStudentId
  });

  const unpaidInvoices = studentInvoicesData?.filter(inv => inv.status !== 'PAID') || [];

  const recordPaymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const paidAtIso = `${values.datetimeInput}:00`;
      return billingApi.recordPayment({
        invoiceId: Number(values.invoiceId),
        paidAmount: Number(values.paidAmount),
        paymentMethod: values.paymentMethod,
        paidAt: paidAtIso,
        note: values.note || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-all'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-student'] });
      setIsRecordOpen(false);
      reset();
      setFormSelectedStudentId(null);
    }
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { studentId: '', invoiceId: '', paidAmount: '0', paymentMethod: 'BANK_TRANSFER', datetimeInput: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16), note: '' }
  });

  const watchStudentId = watch('studentId');
  const watchInvoiceId = watch('invoiceId');

  useEffect(() => {
    if (watchStudentId) {
      setFormSelectedStudentId(Number(watchStudentId));
      setValue('invoiceId', '');
      setValue('paidAmount', '0');
    }
  }, [watchStudentId, setValue]);

  useEffect(() => {
    if (watchInvoiceId && studentInvoicesData) {
      const selectedInvoice = studentInvoicesData.find(i => i.id === Number(watchInvoiceId));
      if (selectedInvoice) setValue('paidAmount', selectedInvoice.balanceAmount.toString());
    }
  }, [watchInvoiceId, studentInvoicesData, setValue]);

  const onSubmitForm = (values: PaymentFormValues) => {
    const selectedInvoice = studentInvoicesData?.find(i => i.id === Number(values.invoiceId));
    if (selectedInvoice && Number(values.paidAmount) > selectedInvoice.balanceAmount) return; // Prevent overpay logic handled silently or rely on backend error
    if (Number(values.paidAmount) <= 0) return;
    recordPaymentMutation.mutate(values);
  };

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const datePart = dateStr.split('T')[0];
    const timePart = dateStr.includes('T') ? dateStr.split('T')[1].slice(0, 5) : '';
    return timePart ? `${timePart} ${datePart.split('-').reverse().join('/')}` : datePart.split('-').reverse().join('/');
  };

  const paymentsList = paymentsData || [];
  const filteredPayments = paymentsList.filter(pay => {
    if (filterStudentId && pay.studentId !== filterStudentId) return false;
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      return pay.paymentCode?.toLowerCase().includes(query) || pay.studentName?.toLowerCase().includes(query) || pay.studentCode?.toLowerCase().includes(query) || pay.invoiceCode?.toLowerCase().includes(query);
    }
    return true;
  });

  const cashPayments = paymentsList.filter(p => p.paymentMethod === 'CASH');
  const transferPayments = paymentsList.filter(p => p.paymentMethod === 'BANK_TRANSFER');
  const cashTotal = cashPayments.reduce((acc, p) => acc + p.paidAmount, 0);
  const transferTotal = transferPayments.reduce((acc, p) => acc + p.paidAmount, 0);
  const totalCollected = paymentsList.reduce((acc, p) => acc + p.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Ghi nhận Thanh toán</h2>
          <p className="text-sm text-slate-400 mt-1">Thu tiền học phí, cấp biên lai và lịch sử giao dịch.</p>
        </div>
        <Button onClick={() => setIsRecordOpen(true)} className="gap-2">
          <Plus size={16} /> Lập phiếu thu
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg"><Coins size={20}/></div>
            <div><div className="text-sm text-slate-400">Tổng đã thu</div><div className="text-xl font-bold text-emerald-400">{formatVND(totalCollected)}</div></div>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 text-amber-400 p-3 rounded-lg"><DollarSign size={20}/></div>
            <div><div className="text-sm text-slate-400">Tiền mặt</div><div className="text-xl font-bold text-amber-400">{formatVND(cashTotal)}</div></div>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-lg"><CreditCard size={20}/></div>
            <div><div className="text-sm text-slate-400">Chuyển khoản</div><div className="text-xl font-bold text-indigo-400">{formatVND(transferTotal)}</div></div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã phiếu, học viên, hóa đơn..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="w-full md:w-64">
           <select
             value={filterStudentId || ''}
             onChange={(e) => setFilterStudentId(e.target.value ? Number(e.target.value) : null)}
             className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
           >
             <option value="">Lọc theo học viên (Tất cả)</option>
             {studentsData?.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>)}
           </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center gap-2">
            <History size={16} className="text-brand-400" />
            <span className="font-semibold text-slate-200">Lịch sử giao dịch thu học phí</span>
         </div>
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Mã Giao dịch</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Mã Hóa đơn</TableHead>
                  <TableHead>Số tiền đóng</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Ghi chú</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {isPaymentsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
               ) : filteredPayments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8"><EmptyState title="Không có dữ liệu" description="Không tìm thấy phiếu thu nào." /></TableCell></TableRow>
               ) : (
                  filteredPayments.map(pay => (
                     <TableRow key={pay.id}>
                        <TableCell className="font-mono font-medium text-emerald-400">{pay.paymentCode || `PAY-${pay.id}`}</TableCell>
                        <TableCell className="font-medium text-slate-200">{pay.studentName || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-slate-400">{pay.invoiceCode}</TableCell>
                        <TableCell className="font-bold text-emerald-400">{formatVND(pay.paidAmount)}</TableCell>
                        <TableCell>
                           <Badge variant={pay.paymentMethod === 'CASH' ? 'warning' : 'info'}>{pay.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{formatDate(pay.paidAt)}</TableCell>
                        <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">{pay.note || '-'}</TableCell>
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>

      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Lập phiếu thu học phí" maxWidth="md">
         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="space-y-4">
               <Select label="Học viên nộp tiền *" {...register('studentId')} error={errors.studentId?.message as string}>
                  <option value="">-- Chọn Học viên --</option>
                  {studentsData?.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
               </Select>
               
               {formSelectedStudentId && (
                  <Select label="Hóa đơn cần thanh toán *" {...register('invoiceId')} error={errors.invoiceId?.message as string}>
                     <option value="">-- Chọn Hóa đơn --</option>
                     {unpaidInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceCode} ({inv.className}) - Nợ: {formatVND(inv.balanceAmount)}</option>)}
                  </Select>
               )}

               {watchInvoiceId && (
                  <Input label="Số tiền nộp (VND) *" type="number" {...register('paidAmount')} error={errors.paidAmount?.message as string} />
               )}

               <div className="grid grid-cols-2 gap-4">
                  <Select label="Phương thức *" {...register('paymentMethod')}>
                     <option value="BANK_TRANSFER">Chuyển khoản</option>
                     <option value="CASH">Tiền mặt</option>
                  </Select>
                  <Input label="Thời gian nộp *" type="datetime-local" {...register('datetimeInput')} error={errors.datetimeInput?.message as string} />
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Ghi chú</label>
                  <textarea rows={2} {...register('note')} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
               <Button variant="secondary" type="button" onClick={() => setIsRecordOpen(false)}>Hủy bỏ</Button>
               <Button variant="primary" type="submit" isLoading={recordPaymentMutation.isPending}>Ghi nhận</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default PaymentsView;
