import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Edit, Trash2, Eye, DoorOpen, Users } from 'lucide-react';
import { roomsApi } from '../features/rooms/rooms.api';
import type { RoomResponse } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

const roomFormSchema = z.object({
  roomCode: z.string().min(2, 'Mã phòng tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên phòng tối thiểu 2 ký tự'),
  capacity: z.any(),
  description: z.string().min(1, 'Mô tả phòng học là bắt buộc'),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export const RoomsView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(0); }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: roomsData, isLoading } = useQuery<RoomResponse[]>({
    queryKey: ['rooms', debouncedSearch],
    queryFn: async () => roomsApi.getAll({ search: debouncedSearch })
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: RoomFormValues) => {
      const payload = { roomCode: values.roomCode, name: values.name, capacity: Number(values.capacity) || 0, description: values.description };
      if (editingRoomId) return roomsApi.update(editingRoomId, payload);
      return roomsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => roomsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setConfirmDeleteId(null);
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: { roomCode: '', name: '', capacity: 25, description: '' }
  });

  const onSubmitForm = (values: RoomFormValues) => upsertMutation.mutate(values);

  const handleEditClick = (room: RoomResponse) => {
    setEditingRoomId(room.id);
    reset({ roomCode: room.roomCode, name: room.name, capacity: room.capacity, description: room.description || '' });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingRoomId(null);
    reset({ roomCode: `PH${Math.floor(100 + Math.random() * 900)}`, name: '', capacity: 25, description: '' });
    setIsUpsertOpen(true);
  };

  const roomsList = roomsData || [];
  const totalPages = Math.ceil(roomsList.length / pageSize);
  const paginatedRooms = roomsList.slice(page * pageSize, (page + 1) * pageSize);

  const avgCapacity = roomsList.length > 0 ? Math.round(roomsList.reduce((acc, curr) => acc + curr.capacity, 0) / roomsList.length) : 0;
  const maxCapacity = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.capacity)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý Phòng học</h2>
          <p className="text-sm text-foreground-muted mt-1">Cấu hình cơ sở vật chất phòng học và sức chứa tối đa.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2"><Plus size={16} /> Thêm Phòng học</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 p-3 rounded-lg"><DoorOpen size={20}/></div>
            <div><div className="text-sm text-foreground-muted">Tổng số phòng</div><div className="text-xl font-bold text-foreground">{roomsList.length}</div></div>
         </div>
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg"><Users size={20}/></div>
            <div><div className="text-sm text-foreground-muted">Sức chứa TB</div><div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{avgCapacity}</div></div>
         </div>
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg"><Users size={20}/></div>
            <div><div className="text-sm text-foreground-muted">Sức chứa max</div><div className="text-xl font-bold text-amber-600 dark:text-amber-400">{maxCapacity}</div></div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm mã hoặc tên phòng..." className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-brand-500" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Phòng</TableHead>
              <TableHead>Tên Phòng</TableHead>
              <TableHead>Sức chứa</TableHead>
              <TableHead>Đặc điểm</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
            ) : paginatedRooms.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="py-8"><EmptyState title="Không có phòng học" description="Không tìm thấy dữ liệu phòng học." isSearch={!!debouncedSearch} /></TableCell></TableRow>
            ) : (
               paginatedRooms.map(room => (
                  <TableRow key={room.id}>
                     <TableCell className="font-mono text-brand-600 dark:text-brand-400 font-medium">{room.roomCode}</TableCell>
                     <TableCell className="font-semibold text-foreground">{room.name}</TableCell>
                     <TableCell>
                        <Badge variant={room.capacity >= 30 ? 'brand' : room.capacity >= 20 ? 'warning' : 'success'}>{room.capacity} học viên</Badge>
                     </TableCell>
                     <TableCell className="text-foreground-secondary max-w-xs truncate">{room.description || '-'}</TableCell>
                     <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button size="sm" variant="ghost" onClick={() => { setSelectedRoom(room); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                           <Button size="sm" variant="ghost" onClick={() => handleEditClick(room)}><Edit size={16}/></Button>
                           <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setConfirmDeleteId(room.id)}><Trash2 size={16}/></Button>
                        </div>
                     </TableCell>
                  </TableRow>
               ))
            )}
          </TableBody>
        </Table>
        {!isLoading && totalPages > 1 && (
           <div className="p-4 border-t border-border flex justify-between items-center bg-surface-hover/30">
              <span className="text-sm text-foreground-muted">Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-2">
                 <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
                 <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
              </div>
           </div>
        )}
      </div>

      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingRoomId ? 'Cập nhật Phòng học' : 'Thêm mới Phòng học'} maxWidth="md">
         <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="space-y-4">
               <Input label="Mã phòng *" {...register('roomCode')} error={errors.roomCode?.message as string} />
               <Input label="Tên phòng *" {...register('name')} error={errors.name?.message as string} />
               <Input label="Sức chứa (học viên) *" type="number" {...register('capacity')} error={errors.capacity?.message as string} />
               <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Mô tả thiết bị & Đặc điểm *</label>
                  <textarea rows={4} {...register('description')} className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-brand-500" />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
               <Button variant="secondary" type="button" onClick={() => setIsUpsertOpen(false)}>Hủy bỏ</Button>
               <Button variant="primary" type="submit" isLoading={upsertMutation.isPending}>Lưu phòng</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Phòng học" maxWidth="md">
         {selectedRoom && (
            <div className="space-y-5">
               <div className="bg-surface border border-border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center"><span className="text-foreground-muted text-sm">Mã phòng:</span> <Badge variant="neutral">{selectedRoom.roomCode}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-foreground-muted text-sm">Tên phòng:</span> <span className="font-semibold text-foreground">{selectedRoom.name}</span></div>
                  <div className="flex justify-between items-center"><span className="text-foreground-muted text-sm">Sức chứa tối đa:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedRoom.capacity} học viên</span></div>
               </div>
               <div className="bg-surface border border-border p-4 rounded-xl">
                  <span className="text-foreground-muted text-sm block mb-2">Đặc điểm / Trang thiết bị:</span>
                  <p className="text-foreground-secondary text-sm leading-relaxed whitespace-pre-wrap">{selectedRoom.description}</p>
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
         title="Xóa phòng học"
         description="Bạn có chắc chắn muốn xóa phòng học này không? Hành động này không thể hoàn tác."
         confirmText="Xóa"
         cancelText="Hủy"
         variant="danger"
         isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default RoomsView;
