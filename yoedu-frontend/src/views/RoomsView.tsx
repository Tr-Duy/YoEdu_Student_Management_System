import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  DoorOpen,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { roomsApi } from '../features/rooms/rooms.api';
import type { RoomResponse } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const roomFormSchema = z.object({
  roomCode: z.string().min(2, 'Mã phòng tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên phòng tối thiểu 2 ký tự'),
  capacity: z.any(), // Number
  description: z.string().min(1, 'Mô tả phòng học là bắt buộc'),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const RoomsView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Dialog & Modal States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  // Custom Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on search
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

  // ==========================================
  // TANSTACK QUERY - DATA FETCHING
  // ==========================================
  
  // Fetch Rooms (getAll returns RoomResponse[] directly)
  const { data: roomsData, isLoading } = useQuery<RoomResponse[]>({
    queryKey: ['rooms', debouncedSearch],
    queryFn: async () => {
      return roomsApi.getAll({ search: debouncedSearch });
    },
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Room Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: RoomFormValues) => {
      const capVal = Number(values.capacity) || 0;

      const payload = {
        roomCode: values.roomCode,
        name: values.name,
        capacity: capVal,
        description: values.description,
      };

      if (editingRoomId) {
        return roomsApi.update(editingRoomId, payload);
      } else {
        return roomsApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      addToast(editingRoomId ? 'Cập nhật phòng học thành công!' : 'Tạo mới phòng học thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Room Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return roomsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      addToast('Đã xóa phòng học thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa phòng học.', 'error');
    }
  });

  // ==========================================
  // REACT HOOK FORM SETUP
  // ==========================================
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      roomCode: '',
      name: '',
      capacity: 25,
      description: '',
    }
  });

  const onSubmitForm = (values: RoomFormValues) => {
    const cap = Number(values.capacity);
    if (isNaN(cap) || cap <= 0) {
      addToast('Sức chứa phòng học phải lớn hơn 0!', 'error');
      return;
    }
    upsertMutation.mutate(values);
  };

  const handleEditClick = (room: RoomResponse) => {
    setEditingRoomId(room.id);
    reset({
      roomCode: room.roomCode,
      name: room.name,
      capacity: room.capacity,
      description: room.description || '',
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingRoomId(null);
    reset({
      roomCode: `PH${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      capacity: 25,
      description: '',
    });
    setIsUpsertOpen(true);
  };

  const roomsList = roomsData || [];
  
  // Client-side pagination since getAll returns a flat list
  const totalItems = roomsList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedRooms = roomsList.slice(page * pageSize, (page + 1) * pageSize);

  // Compute Stats
  const avgCapacity = roomsList.length > 0 
    ? Math.round(roomsList.reduce((acc, curr) => acc + curr.capacity, 0) / roomsList.length) 
    : 0;
  const maxCapacity = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.capacity)) : 0;

  return (
    <div className="space-y-6 relative">
      {/* Toasts */}
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
            <DoorOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Phòng học</h2>
            <p className="text-slate-400 text-sm mt-1">
              Cấu hình thông tin cơ sở vật chất phòng học, quản lý sức chứa tối đa phục vụ bố trí lịch học.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Phòng học</span>
        </button>
      </div>

      {/* Stats Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số phòng học</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{totalItems} phòng</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
            <DoorOpen size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sức chứa trung bình</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{avgCapacity} học viên</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
            <Users size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sức chứa lớn nhất</span>
            <h3 className="text-2xl font-black text-brand-300 mt-1">{maxCapacity} học viên</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-300">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4 justify-between border border-white/5">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã phòng học..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Mã Phòng</th>
                <th className="py-4 px-6">Tên Phòng</th>
                <th className="py-4 px-6">Sức chứa tối đa</th>
                <th className="py-4 px-6">Đặc điểm / Thiết bị</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              {isLoading && (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-64"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && paginatedRooms.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    Không tìm thấy phòng học nào.
                  </td>
                </tr>
              )}

              {!isLoading && paginatedRooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {room.roomCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {room.name}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-300">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      room.capacity >= 30
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : room.capacity >= 20
                        ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <Users size={12} />
                      {room.capacity} học viên
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {room.description || 'Chưa cấu hình đặc điểm'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(room)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsConfirmDeleteOpen(true);
                        }}
                        title="Xóa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/15">
            <span className="text-xs text-slate-500">
              Trang <span className="font-bold text-slate-400">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: VIEW DETAILS
          ========================================== */}
      {isDetailsOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedRoom.roomCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Phòng học</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                <div>
                  <span className="text-slate-500 text-xs">Tên phòng học</span>
                  <h4 className="text-lg font-extrabold text-slate-100 mt-0.5">{selectedRoom.name}</h4>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Sức chứa tối đa</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-1">
                    <Users size={16} className="text-slate-400" />
                    {selectedRoom.capacity} học viên (ghế ngồi tiêu chuẩn)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs block mb-1">Cơ sở vật chất & Mô tả đặc điểm</span>
                <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed font-medium">
                  {selectedRoom.description || 'Chưa khai báo danh mục trang thiết bị (Bảng viết, Máy chiếu, Máy lạnh...).'}
                </p>
              </div>
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
          MODAL: CREATE / UPDATE FORM
          ========================================== */}
      {isUpsertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">
                {editingRoomId ? 'Cập nhật Phòng học' : 'Thêm mới Phòng học'}
              </h3>
              <button
                onClick={() => setIsUpsertOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Thông tin phòng học
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã phòng học *</label>
                  <input
                    type="text"
                    {...register('roomCode')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  {errors.roomCode && <p className="text-red-400 text-xs mt-1">{errors.roomCode.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tên phòng học *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Ví dụ: Phòng 101, Lab B, v.v."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Sức chứa tối đa (Học viên) *</label>
                  <input
                    type="number"
                    {...register('capacity')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity.message?.toString()}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mô tả thiết bị & Đặc điểm *</label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Ví dụ: Bảng từ, máy chiếu EPSON, 2 máy lạnh Daikin, hệ thống âm thanh, bàn ghế di động..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsUpsertOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {upsertMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Lưu phòng học'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DELETE CONFIRMATION
          ========================================== */}
      {isConfirmDeleteOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa phòng học</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa phòng học <span className="font-bold text-red-400">"{selectedRoom.name}"</span>? Các ca học được sắp xếp trong phòng có thể bị ảnh hưởng.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedRoom.id)}
                className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Xác nhận Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsView;
