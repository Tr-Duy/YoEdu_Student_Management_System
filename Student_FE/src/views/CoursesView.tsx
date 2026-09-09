import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Edit, Trash2, Eye, BookOpen, Clock, DollarSign
} from 'lucide-react';
import { coursesApi } from '../features/courses/courses.api';
import type { CourseResponse } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const courseFormSchema = z.object({
  courseCode: z.string().min(2, 'Mã môn học tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên môn học tối thiểu 2 ký tự'),
  description: z.string().min(1, 'Mô tả môn học là bắt buộc'),
  durationMonths: z.any(),
  basePrice: z.any(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export const CoursesView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: coursesData, isLoading } = useQuery<CourseResponse[]>({
    queryKey: ['courses', debouncedSearch],
    queryFn: async () => coursesApi.getAll({ search: debouncedSearch }),
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const payload = {
        courseCode: values.courseCode,
        name: values.name,
        description: values.description,
        durationMonths: Number(values.durationMonths) || 0,
        basePrice: Number(values.basePrice) || 0,
      };

      if (editingCourseId) {
        return coursesApi.update(editingCourseId, payload);
      } else {
        return coursesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsConfirmDeleteOpen(false);
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { courseCode: '', name: '', description: '', durationMonths: 3, basePrice: 1500000 }
  });

  const onSubmitForm = (values: CourseFormValues) => {
    const dur = Number(values.durationMonths);
    const price = Number(values.basePrice);
    if (isNaN(dur) || dur <= 0 || isNaN(price) || price < 0) return;
    upsertMutation.mutate(values);
  };

  const handleEditClick = (course: CourseResponse) => {
    setEditingCourseId(course.id);
    reset({
      courseCode: course.courseCode, name: course.name, description: course.description || '',
      durationMonths: course.durationMonths, basePrice: course.basePrice,
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingCourseId(null);
    reset({
      courseCode: `KH${Math.floor(100 + Math.random() * 900)}`, name: '', description: '',
      durationMonths: 3, basePrice: 1500000,
    });
    setIsUpsertOpen(true);
  };

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const coursesList = coursesData || [];
  const totalItems = coursesList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedCourses = coursesList.slice(page * pageSize, (page + 1) * pageSize);

  const lowestPrice = coursesList.length > 0 ? Math.min(...coursesList.map(c => c.basePrice)) : 0;
  const highestPrice = coursesList.length > 0 ? Math.max(...coursesList.map(c => c.basePrice)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý Khóa học</h2>
          <p className="text-sm text-foreground-muted mt-1">Thiết lập danh mục khóa học, học phí tiêu chuẩn.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus size={16} /> Thêm Khóa học
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm transition-colors">
            <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 p-3 rounded-lg"><BookOpen size={20}/></div>
            <div>
               <div className="text-sm text-foreground-muted">Tổng khóa học</div>
               <div className="text-xl font-bold text-foreground">{totalItems}</div>
            </div>
         </div>
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm transition-colors">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg"><DollarSign size={20}/></div>
            <div>
               <div className="text-sm text-foreground-muted">Học phí thấp nhất</div>
               <div className="text-xl font-bold text-foreground">{formatVND(lowestPrice)}</div>
            </div>
         </div>
         <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm transition-colors">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg"><DollarSign size={20}/></div>
            <div>
               <div className="text-sm text-foreground-muted">Học phí cao nhất</div>
               <div className="text-xl font-bold text-foreground">{formatVND(highestPrice)}</div>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm transition-colors">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hoặc tên khóa học..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-colors">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã KH</TableHead>
              <TableHead>Tên Khóa Học</TableHead>
              <TableHead>Thời Lượng</TableHead>
              <TableHead>Học Phí Cơ Bản</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
            ) : paginatedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <EmptyState title="Không có khóa học" description="Không tìm thấy khóa học nào khớp với tìm kiếm." isSearch />
                </TableCell>
              </TableRow>
            ) : (
              paginatedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono text-brand-600 dark:text-brand-400 font-medium">{course.courseCode}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{course.name}</div>
                    <div className="text-xs text-foreground-muted mt-0.5 truncate max-w-[300px]">{course.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-foreground-secondary">
                       <Clock size={14} className="text-foreground-muted" /> {course.durationMonths} tháng
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                     {formatVND(course.basePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedCourse(course); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(course)}><Edit size={16}/></Button>
                      <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 hover:text-rose-500" onClick={() => { setSelectedCourse(course); setIsConfirmDeleteOpen(true); }}><Trash2 size={16}/></Button>
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

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Khóa học" maxWidth="xl">
        {selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50 border border-border">
              <div className="h-12 w-12 rounded-lg bg-brand-600/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-xl">
                <BookOpen size={24} />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">{selectedCourse.name}</h4>
                <div className="text-sm text-foreground-muted mt-1">{selectedCourse.courseCode}</div>
              </div>
            </div>
            
            <div className="space-y-4 text-sm">
               <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground-muted">Thời lượng đào tạo:</span>
                  <span className="text-foreground font-medium">{selectedCourse.durationMonths} tháng</span>
               </div>
               <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground-muted">Học phí cơ bản (chưa giảm trừ):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatVND(selectedCourse.basePrice)}</span>
               </div>
               <div>
                  <span className="text-foreground-muted block mb-2">Mô tả chi tiết:</span>
                  <div className="text-foreground-secondary bg-surface-hover/40 p-3 rounded-lg border border-border whitespace-pre-wrap leading-relaxed">
                     {selectedCourse.description}
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingCourseId ? 'Cập nhật Khóa học' : 'Thêm Khóa học mới'} maxWidth="xl">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="space-y-4">
            <Input label="Mã Khóa Học *" {...register('courseCode')} error={errors.courseCode?.message} />
            <Input label="Tên Khóa Học *" {...register('name')} error={errors.name?.message} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Thời lượng (Tháng) *" type="number" {...register('durationMonths')} error={errors.durationMonths?.message as string} />
               <Input label="Học phí cơ bản (VND) *" type="number" {...register('basePrice')} error={errors.basePrice?.message as string} />
            </div>
            <div className="space-y-1.5">
               <label className="block text-sm font-medium text-foreground-secondary">Mô tả chi tiết *</label>
               <textarea rows={4} {...register('description')} className="w-full bg-surface border border-border rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none transition-colors" />
               {errors.description && <p className="text-rose-500 text-xs">{errors.description.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsUpsertOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={upsertMutation.isPending}>Lưu</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => selectedCourse && deleteMutation.mutate(selectedCourse.id)}
        title="Xóa khóa học"
        description="Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các lớp học đang mở."
        isDanger
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default CoursesView;
