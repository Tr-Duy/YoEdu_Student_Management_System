import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Eye, Receipt, AlertTriangle, History, Search, RefreshCcw, Gift, Download, CheckCircle } from 'lucide-react';
import { billingApi } from '../features/billing/billing.api';
import { studentsApi } from '../features/students/students.api';
import { classesApi } from '../features/classes/classes.api';
import { promotionsApi } from '../features/promotions/promotions.api';
import type { InvoiceResponse } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

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

export const BillingView: React.FC = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ page: 0, size: 10, search: '', studentId: '', classId: '', status: '', month: '' });
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);

  const { data: studentsData } = useQuery({ queryKey: ['students-list'], queryFn: async () => (await studentsApi.search({ size: 1000 })).content });
  const { data: classesData } = useQuery({ queryKey: ['classes-list'], queryFn: async () => (await classesApi.search({ size: 1000 })).content });
  const { data: promotionsData } = useQuery({ queryKey: ['promotions-list'], queryFn: async () => promotionsApi.getAll() });

  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices-search', filters],
    queryFn: async () => billingApi.searchInvoices({
      page: filters.page, size: filters.size, search: filters.search || undefined,
      studentId: filters.studentId ? Number(filters.studentId) : undefined,
      classId: filters.classId ? Number(filters.classId) : undefined,
      status: filters.status || undefined, month: filters.month || undefined
    })
  });

  const { data: statsData } = useQuery({
    queryKey: ['invoices-stats', filters],
    queryFn: async () => billingApi.getInvoiceStats({
      search: filters.search || undefined, studentId: filters.studentId ? Number(filters.studentId) : undefined,
      classId: filters.classId ? Number(filters.classId) : undefined,
      status: filters.status || undefined, month: filters.month || undefined
    })
  });

  const { data: warningsData, isLoading: isWarningsLoading } = useQuery({
    queryKey: ['overdue-warnings'],
    queryFn: async () => billingApi.getOverdueWarnings(),
    enabled: showWarningsOnly
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      return billingApi.createInvoice({
        studentId: Number(values.studentId),
        courseClassId: Number(values.courseClassId),
        billingMonth: `${values.monthInput}-01`,
        originalAmount: Number(values.originalAmount),
        promotionId: values.promotionId ? Number(values.promotionId) : null,
        dueDate: values.dueDate || undefined, note: values.note || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-search'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-stats'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-warnings'] });
      setIsCreateOpen(false);
      reset();
    }
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: { studentId: '', courseClassId: '', monthInput: new Date().toISOString().slice(0, 7), promotionId: '', originalAmount: '0', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], note: '' }
  });

  const watchClassId = watch('courseClassId');
  useEffect(() => {
    if (watchClassId && classesData) {
      const selectedClass = classesData.find(c => c.id === Number(watchClassId));
      if (selectedClass) setValue('originalAmount', selectedClass.tuitionFee.toString());
    }
  }, [watchClassId, classesData, setValue]);

  const onSubmitForm = (values: InvoiceFormValues) => createInvoiceMutation.mutate(values);

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  const formatDate = (dateStr?: string) => dateStr ? dateStr.split('-').reverse().join('/') : '';
  const formatMonth = (dateStr?: string) => dateStr ? `Tháng ${dateStr.split('-')[1]}/${dateStr.split('-')[0]}` : '';

  const getStatusBadge = (status?: string) => {
    let cleanStatus = status || 'UNPAID';
    if (cleanStatus === 'PARTIALLY_PAID') cleanStatus = 'PARTIAL';
    switch (cleanStatus) {
      case 'PAID': return <Badge variant="success">Đã thanh toán</Badge>;
      case 'PARTIAL': return <Badge variant="warning">Trả một phần</Badge>;
      case 'UNPAID': return <Badge variant="danger">Chưa thanh toán</Badge>;
      case 'OVERPAID': return <Badge variant="brand">Đóng dư</Badge>;
      default: return <Badge variant="neutral">{cleanStatus}</Badge>;
    }
  };

  const activeInvoicesList = invoicesData?.content || [];
  const totalPages = invoicesData?.totalPages || 0;
  const totalUnpaid = statsData?.totalUnpaidAmount || 0;
  const totalPaid = statsData?.totalPaidAmount || 0;
  const totalInvoicesCount = statsData?.totalInvoicesCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Quản lý Hóa đơn & Học phí</h2>
          <p className="text-sm text-slate-400 mt-1">Tra cứu hóa đơn, lập hóa đơn đơn lẻ và rà soát công nợ.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant={showWarningsOnly ? 'primary' : 'secondary'} className={showWarningsOnly ? 'bg-amber-600 hover:bg-amber-500' : ''} onClick={() => setShowWarningsOnly(!showWarningsOnly)}>
            <AlertTriangle size={16} className="mr-2" /> Nợ Quá Hạn ({warningsData?.length || 0})
          </Button>
          <Button onClick={() => { setIsCreateOpen(true); setValue('studentId', filters.studentId); if (filters.classId) setValue('courseClassId', filters.classId); }}>
            <Plus size={16} className="mr-2" /> Tạo Hóa đơn
          </Button>
        </div>
      </div>

      {!showWarningsOnly && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center">
             <div className="relative w-full lg:w-64 shrink-0">
               <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
               <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 0 }))} placeholder="Mã HĐ, tên HV..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
             </div>
             <div className="flex items-center gap-2 overflow-x-auto w-full">
                <select value={filters.studentId} onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value, page: 0 }))} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500 min-w-[150px]">
                   <option value="">-- Tất cả Học viên --</option>
                   {studentsData?.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
                <select value={filters.classId} onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value, page: 0 }))} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500 min-w-[150px]">
                   <option value="">-- Tất cả Lớp học --</option>
                   {classesData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 0 }))} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500 min-w-[150px]">
                   <option value="">-- Trạng thái --</option>
                   <option value="UNPAID">Chưa thanh toán</option>
                   <option value="PAID">Đã thanh toán</option>
                   <option value="PARTIAL">Trả một phần</option>
                   <option value="OVERPAID">Đóng dư</option>
                </select>
                <input type="month" value={filters.month} onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value, page: 0 }))} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
                <Button variant="ghost" onClick={() => setFilters({ page: 0, size: 10, search: '', studentId: '', classId: '', status: '', month: '' })}><RefreshCcw size={16}/></Button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-slate-800 text-slate-300 p-3 rounded-lg"><History size={20}/></div>
                <div><div className="text-sm text-slate-400">Tổng hóa đơn</div><div className="text-xl font-bold text-slate-200">{totalInvoicesCount}</div></div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg"><CheckCircle size={20}/></div>
                <div><div className="text-sm text-slate-400">Đã hoàn thành</div><div className="text-xl font-bold text-emerald-400">{formatVND(totalPaid)}</div></div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg"><AlertTriangle size={20}/></div>
                <div><div className="text-sm text-slate-400">Học phí còn nợ</div><div className="text-xl font-bold text-red-400">{formatVND(totalUnpaid)}</div></div>
             </div>
          </div>
        </>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {showWarningsOnly ? (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Mã Hóa Đơn</TableHead>
                 <TableHead>Học Viên</TableHead>
                 <TableHead>Lớp Học</TableHead>
                 <TableHead>Hạn Nộp</TableHead>
                 <TableHead>Còn Nợ</TableHead>
                 <TableHead>Quá Hạn</TableHead>
                 <TableHead className="text-right">Thao Tác</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isWarningsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
               ) : !warningsData || warningsData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8"><EmptyState title="Không có nợ quá hạn" description="Tuyệt vời! Không có hóa đơn nào quá hạn thanh toán." /></TableCell></TableRow>
               ) : (
                  warningsData.map(w => (
                     <TableRow key={w.invoiceId}>
                        <TableCell className="font-mono text-brand-400 font-medium">{w.invoiceCode}</TableCell>
                        <TableCell className="font-medium text-slate-200">{w.studentName}</TableCell>
                        <TableCell className="text-slate-300">{w.className}</TableCell>
                        <TableCell className="text-slate-400">{formatDate(w.dueDate)}</TableCell>
                        <TableCell className="font-bold text-red-400">{formatVND(w.balanceAmount)}</TableCell>
                        <TableCell><Badge variant="danger">{w.daysOverdue} ngày</Badge></TableCell>
                        <TableCell className="text-right">
                           <Button size="sm" variant="ghost" onClick={() => { /* load detail using invoiceId... for now just open detail */ setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                        </TableCell>
                     </TableRow>
                  ))
               )}
             </TableBody>
           </Table>
        ) : (
           <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã HĐ</TableHead>
                    <TableHead>Lớp Học</TableHead>
                    <TableHead>Tháng</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Khuyến mãi</TableHead>
                    <TableHead>Đã đóng</TableHead>
                    <TableHead>Còn nợ</TableHead>
                    <TableHead>Hạn nộp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInvoicesLoading ? (
                     <TableRow><TableCell colSpan={10} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
                  ) : activeInvoicesList.length === 0 ? (
                     <TableRow><TableCell colSpan={10} className="py-8"><EmptyState title="Không có hóa đơn" description="Không tìm thấy hóa đơn phù hợp." isSearch={!!filters.search} /></TableCell></TableRow>
                  ) : (
                     activeInvoicesList.map(inv => (
                        <TableRow key={inv.id}>
                           <TableCell className="font-mono text-brand-400 font-medium">{inv.invoiceCode}</TableCell>
                           <TableCell className="font-medium text-slate-200">{inv.className}</TableCell>
                           <TableCell className="text-slate-300">{formatMonth(inv.billingMonth)}</TableCell>
                           <TableCell className="font-semibold text-slate-100">{formatVND(inv.finalAmount)}</TableCell>
                           <TableCell>
                              {inv.promotionName ? <span className="text-xs bg-slate-800 text-brand-400 px-2 py-1 rounded-md border border-slate-700 flex items-center w-max gap-1"><Gift size={12}/>{inv.promotionName}</span> : '-'}
                           </TableCell>
                           <TableCell className="font-semibold text-emerald-400">{formatVND(inv.amountPaid)}</TableCell>
                           <TableCell className="font-semibold text-red-400">{formatVND(inv.balanceAmount)}</TableCell>
                           <TableCell className="text-slate-400 text-xs">{formatDate(inv.dueDate)}</TableCell>
                           <TableCell>{getStatusBadge(inv.status)}</TableCell>
                           <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedInvoice(inv); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
                </TableBody>
              </Table>
              {!isInvoicesLoading && totalPages > 1 && (
                 <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <span className="text-sm text-slate-500">Trang {filters.page + 1} / {totalPages}</span>
                    <div className="flex gap-2">
                       <Button variant="secondary" size="sm" disabled={filters.page === 0} onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}>Trước</Button>
                       <Button variant="secondary" size="sm" disabled={filters.page >= totalPages - 1} onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}>Sau</Button>
                    </div>
                 </div>
              )}
           </>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tạo Hóa đơn Mới" maxWidth="2xl">
         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Select label="Học viên *" {...register('studentId')} error={errors.studentId?.message as string}>
                  <option value="">-- Chọn Học viên --</option>
                  {studentsData?.map(s => <option key={s.id} value={s.id}>{s.studentCode} - {s.fullName}</option>)}
               </Select>
               <Select label="Lớp học *" {...register('courseClassId')} error={errors.courseClassId?.message as string}>
                  <option value="">-- Chọn Lớp học --</option>
                  {classesData?.map(c => <option key={c.id} value={c.id}>{c.classCode} - {c.name}</option>)}
               </Select>
               <Input label="Tháng thu phí *" type="month" {...register('monthInput')} error={errors.monthInput?.message as string} />
               <Input label="Học phí gốc (VND) *" type="number" {...register('originalAmount')} error={errors.originalAmount?.message as string} />
               <Select label="Khuyến mãi" {...register('promotionId')}>
                  <option value="">-- Không áp dụng KM --</option>
                  {promotionsData?.map(p => <option key={p.id} value={p.id}>{p.code} - Giảm {p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : formatVND(p.discountValue)}</option>)}
               </Select>
               <Input label="Hạn nộp" type="date" {...register('dueDate')} />
               <div className="col-span-2">
                  <Input label="Ghi chú" {...register('note')} />
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
               <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
               <Button variant="primary" type="submit" isLoading={createInvoiceMutation.isPending}>Tạo hóa đơn</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Hóa đơn" maxWidth="2xl">
         {selectedInvoice && (
            <div className="space-y-6">
               <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-slate-100">Hóa đơn {selectedInvoice.invoiceCode}</h3>
                        {getStatusBadge(selectedInvoice.status)}
                     </div>
                     <p className="text-slate-400 text-sm">Học viên: <span className="font-medium text-slate-200">{selectedInvoice.studentName} ({selectedInvoice.studentCode})</span></p>
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2"><Download size={14}/> In hóa đơn</Button>
               </div>
               
               <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                     <h4 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Thông tin thu phí</h4>
                     <div className="flex justify-between"><span className="text-slate-500">Lớp học:</span> <span className="text-slate-200">{selectedInvoice.className}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Tháng đóng:</span> <span className="text-slate-200">{formatMonth(selectedInvoice.billingMonth)}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Ngày tạo:</span> <span className="text-slate-200">{formatDate(selectedInvoice.createdAt)}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Hạn nộp:</span> <span className="text-slate-200">{formatDate(selectedInvoice.dueDate)}</span></div>
                  </div>
                  <div className="space-y-3">
                     <h4 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Chi tiết số tiền</h4>
                     <div className="flex justify-between"><span className="text-slate-500">Học phí gốc:</span> <span className="text-slate-200">{formatVND(selectedInvoice.originalAmount)}</span></div>
                     {selectedInvoice.discountAmount > 0 && (
                        <div className="flex justify-between text-brand-400"><span className="text-brand-400/70">Khuyến mãi ({selectedInvoice.promotionName}):</span> <span>-{formatVND(selectedInvoice.discountAmount)}</span></div>
                     )}
                     <div className="flex justify-between font-bold text-base border-t border-slate-800 pt-2"><span className="text-slate-300">Tổng phải thu:</span> <span className="text-slate-100">{formatVND(selectedInvoice.finalAmount)}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Đã thanh toán:</span> <span className="text-emerald-400 font-semibold">{formatVND(selectedInvoice.amountPaid)}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Còn nợ:</span> <span className="text-red-400 font-semibold">{formatVND(selectedInvoice.balanceAmount)}</span></div>
                  </div>
               </div>
               
               {selectedInvoice.note && (
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm text-slate-300">
                     <span className="text-slate-500 font-medium">Ghi chú:</span> {selectedInvoice.note}
                  </div>
               )}

               <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
               </div>
            </div>
         )}
      </Modal>
    </div>
  );
};
