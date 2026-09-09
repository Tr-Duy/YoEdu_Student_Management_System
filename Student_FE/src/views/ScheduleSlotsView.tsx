import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Edit, Trash2, Eye, Clock, Calendar, Layers } from 'lucide-react';
import { scheduleSlotsApi } from '../features/schedule-slots/schedule-slots.api';
import type { ScheduleSlotResponse } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

const slotFormSchema = z.object({
  slotCode: z.string().min(2, 'Mã ca học tối thiểu 2 ký tự'),
  weekday: z.any(),
  startTime: z.string().min(4, 'Giờ bắt đầu là bắt buộc'),
  endTime: z.string().min(4, 'Giờ kết thúc là bắt buộc'),
  note: z.string(),
});

type SlotFormValues = z.infer<typeof slotFormSchema>;

export const ScheduleSlotsView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlotResponse | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(0); }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: slotsData, isLoading } = useQuery<ScheduleSlotResponse[]>({
    queryKey: ['scheduleSlots', debouncedSearch],
    queryFn: async () => scheduleSlotsApi.getAll({ search: debouncedSearch }),
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: SlotFormValues) => {
      let start = values.startTime;
      if (start.length === 5) start = `${start}:00`;
      let end = values.endTime;
      if (end.length === 5) end = `${end}:00`;

      const payload = {
        slotCode: values.slotCode,
        weekday: Number(values.weekday) || 2,
        startTime: start,
        endTime: end,
        note: values.note,
      };

      if (editingSlotId) return scheduleSlotsApi.update(editingSlotId, payload);
      return scheduleSlotsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleSlots'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => scheduleSlotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleSlots'] });
      setConfirmDeleteId(null);
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: { slotCode: '', weekday: 2, startTime: '18:00', endTime: '19:30', note: '' }
  });

  const onSubmitForm = (values: SlotFormValues) => upsertMutation.mutate(values);

  const handleEditClick = (slot: ScheduleSlotResponse) => {
    setEditingSlotId(slot.id);
    reset({
      slotCode: slot.slotCode,
      weekday: slot.weekday,
      startTime: slot.startTime.substring(0, 5),
      endTime: slot.endTime.substring(0, 5),
      note: slot.note || '',
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingSlotId(null);
    reset({ slotCode: `CA${Math.floor(10 + Math.random() * 90)}`, weekday: 2, startTime: '18:00', endTime: '19:30', note: '' });
    setIsUpsertOpen(true);
  };

  const formatWeekday = (day: number) => day === 8 ? 'Chủ Nhật' : `Thứ ${day}`;

  const rawSlotsList = slotsData || [];
  const filteredSlotsList = rawSlotsList.filter(slot => weekdayFilter === 'ALL' || slot.weekday === Number(weekdayFilter));
  
  const totalPages = Math.ceil(filteredSlotsList.length / pageSize);
  const paginatedSlots = filteredSlotsList.slice(page * pageSize, (page + 1) * pageSize);

  const activeWeekdaysCount = new Set(rawSlotsList.map(s => s.weekday)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Cấu hình Ca học (Schedule Slots)</h2>
          <p className="text-sm text-slate-400 mt-1">Thiết lập các ca học cố định phục vụ xếp lịch dạy và học.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2"><Plus size={16} /> Thêm Ca học</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-brand-500/10 text-brand-400 p-3 rounded-lg"><Clock size={20}/></div>
            <div><div className="text-sm text-slate-400">Tổng số ca</div><div className="text-xl font-bold text-slate-200">{rawSlotsList.length}</div></div>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg"><Calendar size={20}/></div>
            <div><div className="text-sm text-slate-400">Số ngày có lịch</div><div className="text-xl font-bold text-emerald-400">{activeWeekdaysCount}</div></div>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-brand-500/10 text-brand-400 p-3 rounded-lg"><Layers size={20}/></div>
            <div><div className="text-sm text-slate-400">Thời lượng chuẩn</div><div className="text-xl font-bold text-brand-400">90 - 120p</div></div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm mã ca hoặc ghi chú..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
           {['ALL', '2', '3', '4', '5', '6', '7', '8'].map(day => (
              <button key={day} onClick={() => { setWeekdayFilter(day); setPage(0); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${weekdayFilter === day ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                 {day === 'ALL' ? 'Tất cả' : day === '8' ? 'CN' : `T${day}`}
              </button>
           ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Ca học</TableHead>
              <TableHead>Ngày học</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
            ) : paginatedSlots.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="py-8"><EmptyState title="Không có ca học" description="Không tìm thấy dữ liệu ca học." isSearch={!!debouncedSearch} /></TableCell></TableRow>
            ) : (
               paginatedSlots.map(slot => (
                  <TableRow key={slot.id}>
                     <TableCell className="font-mono text-brand-400 font-medium">{slot.slotCode}</TableCell>
                     <TableCell>
                        <Badge variant={slot.weekday === 8 ? 'danger' : 'success'}>{formatWeekday(slot.weekday)}</Badge>
                     </TableCell>
                     <TableCell className="font-mono text-slate-200">
                        {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                     </TableCell>
                     <TableCell className="text-slate-400 max-w-xs truncate">{slot.note || '-'}</TableCell>
                     <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button size="sm" variant="ghost" onClick={() => { setSelectedSlot(slot); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                           <Button size="sm" variant="ghost" onClick={() => handleEditClick(slot)}><Edit size={16}/></Button>
                           <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setConfirmDeleteId(slot.id)}><Trash2 size={16}/></Button>
                        </div>
                     </TableCell>
                  </TableRow>
               ))
            )}
          </TableBody>
        </Table>
        {!isLoading && totalPages > 1 && (
           <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
              <span className="text-sm text-slate-500">Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-2">
                 <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
                 <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
              </div>
           </div>
        )}
      </div>

      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingSlotId ? 'Cập nhật Ca học' : 'Thêm mới Ca học'} maxWidth="md">
         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="space-y-4">
               <Input label="Mã ca học *" {...register('slotCode')} error={errors.slotCode?.message as string} />
               <Select label="Ngày học trong tuần *" {...register('weekday')}>
                  <option value={2}>Thứ Hai</option>
                  <option value={3}>Thứ Ba</option>
                  <option value={4}>Thứ Tư</option>
                  <option value={5}>Thứ Năm</option>
                  <option value={6}>Thứ Sáu</option>
                  <option value={7}>Thứ Bảy</option>
                  <option value={8}>Chủ Nhật</option>
               </Select>
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Giờ bắt đầu *" type="time" {...register('startTime')} error={errors.startTime?.message as string} />
                  <Input label="Giờ kết thúc *" type="time" {...register('endTime')} error={errors.endTime?.message as string} />
               </div>
               <Input label="Ghi chú" {...register('note')} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
               <Button variant="secondary" type="button" onClick={() => setIsUpsertOpen(false)}>Hủy bỏ</Button>
               <Button variant="primary" type="submit" isLoading={upsertMutation.isPending}>Lưu ca học</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Ca học" maxWidth="md">
         {selectedSlot && (
            <div className="space-y-5">
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Mã ca học:</span> <Badge variant="neutral">{selectedSlot.slotCode}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Ngày học:</span> <Badge variant={selectedSlot.weekday === 8 ? 'danger' : 'success'}>{formatWeekday(selectedSlot.weekday)}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Khung giờ:</span> <span className="font-mono text-slate-100 font-bold">{selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}</span></div>
               </div>
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-500 text-sm block mb-2">Ghi chú:</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedSlot.note || 'Không có mô tả hoặc ghi chú phụ nào.'}</p>
               </div>
               <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
               </div>
            </div>
         )}
      </Modal>

      <ConfirmDialog
         isOpen={confirmDeleteId !== null}
         onClose={() => setConfirmDeleteId(null)}
         onConfirm={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
         title="Xóa ca học"
         description="Bạn có chắc chắn muốn xóa ca học này không? Hành động này không thể hoàn tác."
         confirmText="Xóa"
         cancelText="Hủy"
         variant="danger"
         isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ScheduleSlotsView;
