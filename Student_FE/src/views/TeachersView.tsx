import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Edit, Trash2, Eye, Mail, Phone, MapPin, Calendar, Briefcase, Award, X
} from 'lucide-react';
import { teachersApi } from '../features/teachers/teachers.api';
import type { TeacherResponse } from '../types/yoedu';

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
const teacherFormSchema = z.object({
  teacherCode: z.string().min(2, 'Mã giáo viên tối thiểu 2 ký tự'),
  fullName: z.string().min(2, 'Họ tên giáo viên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại tối thiểu 9 số'),
  email: z.string().email('Email không đúng định dạng'),
  teacherRole: z.enum(['TEACHER', 'ASSISTANT', 'BOTH', 'MAIN']),
  status: z.string().min(1, 'Trạng thái là bắt buộc'),
  isActive: z.boolean(),
  dateOfBirth: z.string().min(1, 'Ngày sinh là bắt buộc'),
  salary: z.any(),
  weeklySlots: z.any(),
  address: z.string(),
  description: z.string(),
  workUnit: z.string(),
  experience: z.string(),
  achievement: z.string(),
  cccdImageUrl: z.string(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export const TeachersView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherResponse | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? statusFilter : undefined;
      return teachersApi.search({ search: debouncedSearch, status: activeStatus, page, size: pageSize });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const salVal = Number(values.salary) || 0;
      const slotsVal = Number(values.weeklySlots) || 0;
      const payload = { ...values, salary: salVal, weeklySlots: slotsVal };

      if (editingTeacherId) {
        return teachersApi.update(editingTeacherId, payload);
      } else {
        return teachersApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsConfirmDeleteOpen(false);
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { teacherRole: 'TEACHER', status: 'ACTIVE', isActive: true, salary: 0, weeklySlots: 0 }
  });

  const onSubmitForm = (values: TeacherFormValues) => {
    const sal = Number(values.salary);
    const slots = Number(values.weeklySlots);
    if (isNaN(sal) || sal < 0 || isNaN(slots) || slots < 0) return;
    upsertMutation.mutate(values);
  };

  const handleEditClick = (teacher: TeacherResponse) => {
    setEditingTeacherId(teacher.id);
    reset({
      teacherCode: teacher.teacherCode, fullName: teacher.fullName, phone: teacher.phone,
      email: teacher.email, teacherRole: teacher.teacherRole, status: teacher.status || 'ACTIVE',
      isActive: teacher.isActive !== false, dateOfBirth: teacher.dateOfBirth, salary: teacher.salary,
      weeklySlots: teacher.weeklySlots, address: teacher.address || '', description: teacher.description || '',
      workUnit: teacher.workUnit || '', experience: teacher.experience || '', achievement: teacher.achievement || '',
      cccdImageUrl: teacher.cccdImageUrl || ''
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingTeacherId(null);
    reset({
      teacherCode: `GV${Math.floor(100 + Math.random() * 900)}`, fullName: '', phone: '', email: '',
      teacherRole: 'TEACHER', status: 'ACTIVE', isActive: true, dateOfBirth: '', salary: 0,
      weeklySlots: 0, address: '', description: '', workUnit: '', experience: '', achievement: '', cccdImageUrl: ''
    });
    setIsUpsertOpen(true);
  };

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const teachersList = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Quản lý Giáo viên</h2>
          <p className="text-sm text-slate-400 mt-1">Danh sách đội ngũ giảng viên và trợ giảng.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus size={16} /> Thêm Giáo viên
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã, tên, email hoặc SĐT..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'ACTIVE', 'INACTIVE'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setStatusFilter(filter); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' && 'Tất cả'}
              {filter === 'ACTIVE' && 'Đang làm'}
              {filter === 'INACTIVE' && 'Đã nghỉ'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã GV</TableHead>
              <TableHead>Họ Tên</TableHead>
              <TableHead>Liên Hệ</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
            ) : teachersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <EmptyState title="Không có giáo viên" description="Không tìm thấy giáo viên nào khớp với tìm kiếm." isSearch />
                </TableCell>
              </TableRow>
            ) : (
              teachersList.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-mono text-brand-400 font-medium">{teacher.teacherCode}</TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-200">{teacher.fullName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{teacher.dateOfBirth}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300 flex items-center gap-1.5"><Phone size={12}/>{teacher.phone}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Mail size={12}/>{teacher.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {teacher.teacherRole === 'TEACHER' ? 'Giáo viên' : teacher.teacherRole === 'ASSISTANT' ? 'Trợ giảng' : teacher.teacherRole === 'MAIN' ? 'GV Chính' : 'Cả hai'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {teacher.status === 'ACTIVE' ? 'Đang làm' : 'Đã nghỉ'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTeacher(teacher); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(teacher)}><Edit size={16}/></Button>
                      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300" onClick={() => { setSelectedTeacher(teacher); setIsConfirmDeleteOpen(true); }}><Trash2 size={16}/></Button>
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

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Giáo viên" maxWidth="2xl">
        {selectedTeacher && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-800">
              <div className="h-12 w-12 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white text-xl">
                {selectedTeacher.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100">{selectedTeacher.fullName}</h4>
                <div className="text-sm text-slate-400 mt-1 flex gap-3">
                  <span>{selectedTeacher.teacherCode}</span>
                  <span>{selectedTeacher.teacherRole}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Thông tin liên hệ</h5>
                <div className="flex justify-between"><span className="text-slate-500">Ngày sinh:</span><span className="text-slate-200">{selectedTeacher.dateOfBirth}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">SĐT:</span><span className="text-slate-200">{selectedTeacher.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="text-slate-200">{selectedTeacher.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Địa chỉ:</span><span className="text-slate-200">{selectedTeacher.address || 'N/A'}</span></div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-300 border-b border-slate-800 pb-2">Hồ sơ công việc</h5>
                <div className="flex justify-between"><span className="text-slate-500">Đơn vị:</span><span className="text-slate-200">{selectedTeacher.workUnit || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Lương:</span><span className="text-slate-200 font-medium text-emerald-400">{formatVND(selectedTeacher.salary || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Số ca/tuần:</span><span className="text-slate-200">{selectedTeacher.weeklySlots || 0}</span></div>
              </div>
            </div>
            {selectedTeacher.experience && (
               <div>
                  <h5 className="font-semibold text-slate-300 border-b border-slate-800 pb-2 mb-2 text-sm">Kinh nghiệm & Thành tựu</h5>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap">{selectedTeacher.experience}</p>
                  <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap">{selectedTeacher.achievement}</p>
               </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingTeacherId ? 'Cập nhật Giáo viên' : 'Thêm Giáo viên mới'} maxWidth="3xl">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mã GV *" {...register('teacherCode')} error={errors.teacherCode?.message} />
            <Input label="Họ Tên *" {...register('fullName')} error={errors.fullName?.message} />
            <Input label="SĐT *" {...register('phone')} error={errors.phone?.message} />
            <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Ngày Sinh *" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
            <Select label="Vai trò *" {...register('teacherRole')} error={errors.teacherRole?.message}>
              <option value="TEACHER">Giáo viên</option><option value="ASSISTANT">Trợ giảng</option><option value="MAIN">Giáo viên chính</option><option value="BOTH">Cả hai</option>
            </Select>
            <Input label="Lương/Giờ" type="number" {...register('salary')} error={errors.salary?.message as string} />
            <Input label="Số ca/tuần" type="number" {...register('weeklySlots')} error={errors.weeklySlots?.message as string} />
            <Select label="Trạng thái *" {...register('status')} error={errors.status?.message}>
              <option value="ACTIVE">Đang làm</option><option value="INACTIVE">Đã nghỉ</option>
            </Select>
            <Input label="Đơn vị công tác" {...register('workUnit')} error={errors.workUnit?.message} />
            <div className="col-span-2">
               <Input label="Địa chỉ" {...register('address')} error={errors.address?.message} />
            </div>
            <div className="col-span-2 space-y-4">
               <Input label="Kinh nghiệm" {...register('experience')} error={errors.experience?.message} />
               <Input label="Thành tựu" {...register('achievement')} error={errors.achievement?.message} />
               <Input label="Mô tả thêm" {...register('description')} error={errors.description?.message} />
            </div>
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
        onConfirm={() => selectedTeacher && deleteMutation.mutate(selectedTeacher.id)}
        title="Xóa giáo viên"
        description="Bạn có chắc chắn muốn xóa giáo viên này? Hành động này không thể hoàn tác."
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
