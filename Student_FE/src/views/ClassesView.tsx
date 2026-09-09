import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Edit, Trash2, Eye, School, Calendar, Clock, DoorOpen, UserCheck
} from 'lucide-react';
import { classesApi } from '../features/classes/classes.api';
import { referenceApi } from '../features/reference/reference.api';
import { coursesApi } from '../features/courses/courses.api';
import type { CourseClassResponse, ClassStatus } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const classFormSchema = z.object({
  classCode: z.string().min(2, 'Mã lớp tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên lớp tối thiểu 2 ký tự'),
  courseId: z.any(),
  roomId: z.any(),
  scheduleSlotId: z.any(),
  mainTeacherId: z.any(),
  assistantTeacherId: z.any(),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  maxStudents: z.any(),
  tuitionFee: z.any(),
  status: z.enum(['OPEN', 'ONGOING', 'CLOSED', 'FULL']),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

export const ClassesView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['courseClasses', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? (statusFilter as ClassStatus) : undefined;
      return classesApi.search({ search: debouncedSearch, status: activeStatus, page, size: pageSize });
    },
  });

  const { data: coursesList } = useQuery({ queryKey: ['reference-courses'], queryFn: () => coursesApi.getAll(), enabled: isUpsertOpen });
  const { data: teachersList } = useQuery({ queryKey: ['reference-teachers'], queryFn: () => referenceApi.getTeachers(), enabled: isUpsertOpen });
  const { data: roomsList } = useQuery({ queryKey: ['reference-rooms'], queryFn: () => referenceApi.getRooms(), enabled: isUpsertOpen });
  const { data: scheduleSlotsList } = useQuery({ queryKey: ['reference-scheduleSlots'], queryFn: () => referenceApi.getScheduleSlots(), enabled: isUpsertOpen });

  const upsertMutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const payload = {
        classCode: values.classCode,
        name: values.name,
        courseId: Number(values.courseId) || 0,
        roomId: Number(values.roomId) || 0,
        scheduleSlotId: Number(values.scheduleSlotId) || 0,
        mainTeacherId: Number(values.mainTeacherId) || 0,
        assistantTeacherId: values.assistantTeacherId && values.assistantTeacherId !== 'null' ? Number(values.assistantTeacherId) : null,
        startDate: values.startDate,
        endDate: values.endDate,
        maxStudents: Number(values.maxStudents) || 20,
        tuitionFee: Number(values.tuitionFee) || 0,
        status: values.status,
      };

      if (editingClassId) {
        return classesApi.update(editingClassId, payload);
      } else {
        return classesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      setIsConfirmDeleteOpen(false);
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      classCode: '', name: '', courseId: '', roomId: '', scheduleSlotId: '',
      mainTeacherId: '', assistantTeacherId: 'null',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxStudents: 20, tuitionFee: 1500000, status: 'OPEN',
    }
  });

  const onSubmitForm = (values: ClassFormValues) => {
    if (!values.courseId || !values.roomId || !values.scheduleSlotId || !values.mainTeacherId) return;
    const maxStd = Number(values.maxStudents);
    const fee = Number(values.tuitionFee);
    if (isNaN(maxStd) || maxStd <= 0 || isNaN(fee) || fee < 0) return;
    upsertMutation.mutate(values);
  };

  const handleEditClick = (c: CourseClassResponse) => {
    setEditingClassId(c.id);
    reset({
      classCode: c.classCode, name: c.name, courseId: c.course.id, roomId: c.room.id,
      scheduleSlotId: c.scheduleSlot.id, mainTeacherId: c.mainTeacher.id,
      assistantTeacherId: c.assistantTeacher?.id || 'null',
      startDate: c.startDate, endDate: c.endDate, maxStudents: c.maxStudents,
      tuitionFee: c.tuitionFee, status: c.status,
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingClassId(null);
    reset({
      classCode: `LH${Math.floor(100 + Math.random() * 900)}`, name: '', courseId: '', roomId: '',
      scheduleSlotId: '', mainTeacherId: '', assistantTeacherId: 'null',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxStudents: 20, tuitionFee: 1500000, status: 'OPEN',
    });
    setIsUpsertOpen(true);
  };

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const classesList = classesData?.content || [];
  const totalPages = classesData?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Quản lý Lớp học</h2>
          <p className="text-sm text-slate-400 mt-1">Lên lịch, sắp xếp phòng học và phân công giáo viên.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus size={16} /> Thêm Lớp học
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hoặc tên lớp..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'OPEN', 'ONGOING', 'CLOSED', 'FULL'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setStatusFilter(filter); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' && 'Tất cả'}
              {filter === 'OPEN' && 'Mở đăng ký'}
              {filter === 'ONGOING' && 'Đang học'}
              {filter === 'CLOSED' && 'Đã đóng'}
              {filter === 'FULL' && 'Đã đầy'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Lớp</TableHead>
              <TableHead>Lớp Học</TableHead>
              <TableHead>Lịch & Phòng</TableHead>
              <TableHead>Giáo Viên</TableHead>
              <TableHead>Sĩ Số / Học Phí</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
            ) : classesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8">
                  <EmptyState title="Không có lớp học" description="Không tìm thấy lớp học nào khớp với tìm kiếm." isSearch />
                </TableCell>
              </TableRow>
            ) : (
              classesList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-brand-400 font-medium">{c.classCode}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-200">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.course.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300 flex items-center gap-1.5"><Clock size={12}/>{c.scheduleSlot.dayOfWeek} ({c.scheduleSlot.startTime.slice(0,5)} - {c.scheduleSlot.endTime.slice(0,5)})</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><DoorOpen size={12}/>Phòng: {c.room.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300 flex items-center gap-1.5"><UserCheck size={12}/>GV: {c.mainTeacher.fullName}</div>
                    {c.assistantTeacher && <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><UserCheck size={12}/>TG: {c.assistantTeacher.fullName}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300">{c.currentStudents} / {c.maxStudents}</div>
                    <div className="text-xs text-emerald-400 mt-0.5">{formatVND(c.tuitionFee)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'OPEN' ? 'success' : c.status === 'ONGOING' ? 'info' : c.status === 'FULL' ? 'warning' : 'danger'}>
                      {c.status === 'OPEN' ? 'Mở đăng ký' : c.status === 'ONGOING' ? 'Đang học' : c.status === 'FULL' ? 'Đã đầy' : 'Đã đóng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedClass(c); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(c)}><Edit size={16}/></Button>
                      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300" onClick={() => { setSelectedClass(c); setIsConfirmDeleteOpen(true); }}><Trash2 size={16}/></Button>
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

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Lớp học" maxWidth="2xl">
        {selectedClass && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="h-12 w-12 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xl">
                <School size={24} />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100">{selectedClass.name}</h4>
                <div className="text-sm text-slate-400 mt-1 flex gap-3">
                  <span>Mã: {selectedClass.classCode}</span>
                  <span>Khóa học: {selectedClass.course.name}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Thời gian & Địa điểm</h5>
                <div className="flex justify-between"><span className="text-slate-500">Lịch học:</span><span className="text-slate-200">{selectedClass.scheduleSlot.dayOfWeek} ({selectedClass.scheduleSlot.startTime.slice(0,5)} - {selectedClass.scheduleSlot.endTime.slice(0,5)})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phòng:</span><span className="text-slate-200">{selectedClass.room.name} (Tầng {selectedClass.room.floor})</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Khởi giảng:</span><span className="text-slate-200">{selectedClass.startDate}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kết thúc:</span><span className="text-slate-200">{selectedClass.endDate}</span></div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Học vụ & Phân công</h5>
                <div className="flex justify-between"><span className="text-slate-500">GV Chính:</span><span className="text-slate-200">{selectedClass.mainTeacher.fullName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trợ giảng:</span><span className="text-slate-200">{selectedClass.assistantTeacher?.fullName || 'Không có'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sĩ số:</span><span className="text-slate-200">{selectedClass.currentStudents} / {selectedClass.maxStudents}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Học phí:</span><span className="text-emerald-400 font-medium">{formatVND(selectedClass.tuitionFee)}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingClassId ? 'Cập nhật Lớp học' : 'Thêm Lớp học mới'} maxWidth="3xl">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mã Lớp *" {...register('classCode')} error={errors.classCode?.message} />
            <Input label="Tên Lớp *" {...register('name')} error={errors.name?.message} />
            
            <Select label="Khóa Học *" {...register('courseId')} error={errors.courseId?.message as string}>
              <option value="">-- Chọn Khóa Học --</option>
              {coursesList?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Phòng Học *" {...register('roomId')} error={errors.roomId?.message as string}>
              <option value="">-- Chọn Phòng Học --</option>
              {roomsList?.map((r: any) => <option key={r.id} value={r.id}>{r.name} - Sức chứa: {r.capacity}</option>)}
            </Select>

            <Select label="Ca Học *" {...register('scheduleSlotId')} error={errors.scheduleSlotId?.message as string}>
              <option value="">-- Chọn Ca Học --</option>
              {scheduleSlotsList?.map((s: any) => <option key={s.id} value={s.id}>{s.slotName} - {s.dayOfWeek} ({s.startTime.slice(0,5)} - {s.endTime.slice(0,5)})</option>)}
            </Select>
            <Select label="Trạng thái *" {...register('status')} error={errors.status?.message}>
              <option value="OPEN">Mở đăng ký</option><option value="ONGOING">Đang học</option><option value="FULL">Đã đầy</option><option value="CLOSED">Đã đóng</option>
            </Select>

            <Select label="GV Chủ nhiệm *" {...register('mainTeacherId')} error={errors.mainTeacherId?.message as string}>
              <option value="">-- Chọn GV Chủ nhiệm --</option>
              {teachersList?.map((t: any) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
            <Select label="Trợ giảng" {...register('assistantTeacherId')}>
              <option value="null">-- Không có Trợ giảng --</option>
              {teachersList?.map((t: any) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>

            <Input label="Ngày Bắt Đầu *" type="date" {...register('startDate')} error={errors.startDate?.message} />
            <Input label="Ngày Kết Thúc *" type="date" {...register('endDate')} error={errors.endDate?.message} />
            <Input label="Sĩ Số Tối Đa" type="number" {...register('maxStudents')} error={errors.maxStudents?.message as string} />
            <Input label="Học phí lớp (VND)" type="number" {...register('tuitionFee')} error={errors.tuitionFee?.message as string} />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsUpsertOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={upsertMutation.isPending}>Lưu</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => selectedClass && deleteMutation.mutate(selectedClass.id)}
        title="Xóa lớp học"
        description="Bạn có chắc chắn muốn xóa lớp học này? Hành động này sẽ ảnh hưởng đến các học viên đã đăng ký vào lớp."
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
