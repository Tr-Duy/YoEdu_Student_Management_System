import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Search, Edit, Lock, Unlock, Trash2, Eye, Download, Printer, Plus, RotateCcw } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { GradeFormModal } from '../components/GradeFormModal';
import { gradesApi } from '../features/learning-results/grades.api';
import type { Grade } from '../features/learning-results/grades.api';

const GradesView: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | undefined>(undefined);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: async () => {
      const res = await api.get('/api/course-classes');
      return res.data;
    }
  });

  const { data: grades, isLoading, error } = useQuery<Grade[]>({
    queryKey: ['grades', debouncedSearch, classFilter, monthFilter, classificationFilter, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch) params.studentName = debouncedSearch;
      if (classFilter !== 'all') params.courseClassId = parseInt(classFilter);
      if (monthFilter !== 'all') params.month = monthFilter;
      if (classificationFilter !== 'all') params.classification = classificationFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await gradesApi.search(params);
      return response as any;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gradesApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa điểm thành công');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  });

  const lockMutation = useMutation({
    mutationFn: (id: number) => gradesApi.lock(id),
    onSuccess: () => {
      toast.success('Đã khóa điểm');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi khóa');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => gradesApi.unlock(id),
    onSuccess: () => {
      toast.success('Đã mở khóa điểm');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bạn không có quyền mở khóa hoặc có lỗi xảy ra');
    }
  });

  const handleDelete = (id: number, status: string) => {
    if (status === 'LOCKED') {
      toast.error('Không thể xóa điểm đã khóa');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa kết quả điểm này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleLock = (id: number, status: string) => {
    if (status === 'LOCKED') {
      if (window.confirm('Bạn muốn mở khóa điểm này? Thao tác này cần quyền quản trị.')) {
        unlockMutation.mutate(id);
      }
      return;
    }
    if (window.confirm('Bạn có chắc muốn khóa điểm này? Sau khi khóa, điểm sẽ không thể chỉnh sửa.')) {
      lockMutation.mutate(id);
    }
  };

  const handleEdit = (grade: Grade) => {
    if (grade.status === 'LOCKED') {
      toast.error('Điểm đã khóa và không thể chỉnh sửa.');
      return;
    }
    setEditingGrade(grade);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingGrade(undefined);
    setIsFormOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setClassFilter('all');
    setMonthFilter('all');
    setClassificationFilter('all');
    setStatusFilter('all');
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let m = 1; m <= 12; m++) {
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      options.push(`${currentYear}-${monthStr}`);
    }
    options.reverse();
    return options;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý điểm</h2>
          <p className="text-sm text-foreground-muted mt-1">Quản lý và tra cứu kết quả học tập của học viên</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Tính năng xuất Excel đang được chuẩn bị.')}>
            <Download size={16} className="mr-2" /> Tải Excel
          </Button>
          <Button variant="outline" onClick={() => toast.success('Tính năng in đang được chuẩn bị.')}>
            <Printer size={16} className="mr-2" /> In
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} className="mr-2" /> Thêm điểm
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-xl shadow-sm transition-colors flex flex-wrap gap-4 items-center">
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên / mã học viên..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>
        
        <Select value={classFilter} onChange={(e: any) => setClassFilter(e.target.value)} className="w-full md:w-[150px]">
          <option value="all">Tất cả lớp</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id.toString()}>{c.name}</option>
          ))}
        </Select>

        <Select value={monthFilter} onChange={(e: any) => setMonthFilter(e.target.value)} className="w-full md:w-[130px]">
          <option value="all">Tất cả tháng</option>
          {generateMonthOptions().map(m => (
            <option key={m} value={m}>{m.split('-').reverse().join('/')}</option>
          ))}
        </Select>

        <Select value={classificationFilter} onChange={(e: any) => setClassificationFilter(e.target.value)} className="w-full md:w-[150px]">
          <option value="all">Tất cả xếp loại</option>
          <option value="XUAT_SAC">Xuất sắc</option>
          <option value="GIOI">Giỏi</option>
          <option value="KHA">Khá</option>
          <option value="TRUNG_BINH">Trung bình</option>
          <option value="YEU">Yếu</option>
        </Select>

        <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="w-full md:w-[150px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="DRAFT">📝 Chưa khóa</option>
          <option value="LOCKED">🔒 Đã khóa</option>
        </Select>

        <Button variant="ghost" onClick={resetFilters} className="text-foreground-muted" title="Đặt lại bộ lọc">
          <RotateCcw size={16} className="mr-2" /> Đặt lại
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm transition-colors overflow-hidden">
        <div className="overflow-x-auto">
          {error ? (
            <div className="p-12 text-center">
              <p className="text-rose-500 mb-4">Không thể tải dữ liệu điểm.</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({queryKey: ['grades']})}>Thử lại</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Lớp học</TableHead>
                  <TableHead>Tháng</TableHead>
                  <TableHead className="text-center">Chuyên cần</TableHead>
                  <TableHead className="text-center">Điểm số</TableHead>
                  <TableHead>Xếp loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-slate-500">Đang tải...</TableCell></TableRow>
                ) : !grades || grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12">
                      <EmptyState 
                        title="Chưa có dữ liệu điểm" 
                        description="Không tìm thấy điểm nào khớp với điều kiện." 
                        isSearch={!!debouncedSearch || classFilter !== 'all' || monthFilter !== 'all'} 
                        action={<Button onClick={handleAdd}><Plus size={16} className="mr-2" /> Thêm điểm</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((g, index) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-foreground-muted">{index + 1}</TableCell>
                      <TableCell className="font-medium">{g.studentName}</TableCell>
                      <TableCell>{g.className}</TableCell>
                      <TableCell>{g.resultMonth}</TableCell>
                      <TableCell className="text-center">{g.attendanceRate != null ? `${g.attendanceRate.toFixed(0)}%` : '-'}</TableCell>
                      <TableCell className="text-center font-bold text-lg">{g.score}</TableCell>
                      <TableCell>
                        <Badge variant={g.classification === 'XUAT_SAC' ? 'success' : g.classification === 'GIOI' ? 'primary' : g.classification === 'KHA' ? 'info' : g.classification === 'TRUNG_BINH' ? 'warning' : 'danger'}>
                          {g.classification === 'XUAT_SAC' ? 'Xuất sắc' :
                           g.classification === 'GIOI' ? 'Giỏi' :
                           g.classification === 'KHA' ? 'Khá' :
                           g.classification === 'TRUNG_BINH' ? 'Trung bình' : 'Yếu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={g.status === 'LOCKED' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                          {g.status === 'LOCKED' ? <><Lock size={12}/> Đã khóa</> : <><Edit size={12}/> Chưa khóa</>}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Xem" onClick={() => toast('Tính năng Xem đang được chuẩn bị', {icon: 'ℹ️'})}>
                            <Eye size={16} className="text-brand-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Sửa" onClick={() => handleEdit(g)} disabled={g.status === 'LOCKED'}>
                            <Edit size={16} className={g.status === 'LOCKED' ? 'text-slate-300' : 'text-blue-500'} />
                          </Button>
                          <Button variant="ghost" size="icon" title={g.status === 'LOCKED' ? "Đã khóa (Click để mở khóa)" : "Khóa"} onClick={() => handleLock(g.id, g.status)}>
                            {g.status === 'LOCKED' ? <Lock size={16} className="text-slate-500" /> : <Unlock size={16} className="text-amber-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" title="Xóa" onClick={() => handleDelete(g.id, g.status)} disabled={g.status === 'LOCKED'}>
                            <Trash2 size={16} className={g.status === 'LOCKED' ? 'text-slate-300' : 'text-rose-500'} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      
      <GradeFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        editData={editingGrade} 
      />
    </div>
  );
};

export default GradesView;
