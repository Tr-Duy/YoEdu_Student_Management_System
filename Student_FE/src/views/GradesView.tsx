import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Search, Edit, Lock, Unlock, Trash2, Download, Printer, Plus, RotateCcw } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
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
  const [classificationFilter, setClassificationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | undefined>(undefined);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch classes for dropdown filter
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: async () => {
      const res = await api.get('/api/course-classes');
      return res.data;
    }
  });

  // Query grades with backend filtering & searching
  const { data: grades, isLoading, isError, error } = useQuery<Grade[]>({
    queryKey: ['grades', debouncedSearch, classFilter, classificationFilter, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch.trim()) params.studentName = debouncedSearch.trim();
      if (classFilter !== 'all') params.courseClassId = parseInt(classFilter);
      if (classificationFilter !== 'all') params.classification = classificationFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await gradesApi.search(params);
      return response as any;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gradesApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa bảng điểm thành công');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  });

  const lockMutation = useMutation({
    mutationFn: (id: number) => gradesApi.lock(id),
    onSuccess: () => {
      toast.success('Đã khóa bảng điểm');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi khóa');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => gradesApi.unlock(id),
    onSuccess: () => {
      toast.success('Đã mở khóa bảng điểm');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bạn không có quyền mở khóa hoặc có lỗi xảy ra');
    }
  });

  const handleDelete = (id: number, status: string) => {
    if (status === 'LOCKED') {
      toast.error('Điểm đã khóa và không thể xóa.');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa kết quả điểm này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleLock = (id: number, status: string) => {
    if (status === 'LOCKED') {
      if (window.confirm('Bảng điểm đang bị khóa. Bạn có chắc muốn mở khóa (yêu cầu quyền Quản trị viên)?')) {
        unlockMutation.mutate(id);
      }
      return;
    }
    if (window.confirm('Bạn có chắc muốn khóa bảng điểm này? Sau khi khóa, điểm sẽ không thể chỉnh sửa.')) {
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
    setClassificationFilter('all');
    setStatusFilter('all');
  };

  const formatScore = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return <span className="text-foreground-muted italic text-xs">Chưa nhập</span>;
    }
    return <span className="font-semibold">{Number(val).toFixed(1)}</span>;
  };

  const formatTotalScore = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return <span className="text-foreground-muted italic text-xs">Chưa nhập</span>;
    }
    return <span className="font-bold text-base text-brand-600 dark:text-brand-400">{val}</span>;
  };

  const renderClassification = (classification: string | null | undefined) => {
    if (!classification) return <span className="text-foreground-muted text-xs">-</span>;
    switch (classification) {
      case 'GIOI':
        return <Badge variant="primary">Giỏi</Badge>;
      case 'KHA':
        return <Badge variant="info">Khá</Badge>;
      case 'TRUNG_BINH':
        return <Badge variant="warning">Trung bình</Badge>;
      case 'YEU':
        return <Badge variant="danger">Yếu</Badge>;
      default:
        return <Badge variant="secondary">{classification}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý điểm</h2>
          <p className="text-sm text-foreground-muted mt-1">Quản lý và tra cứu kết quả học tập của học viên</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast('Tính năng xuất Excel đang được chuẩn bị.', { icon: 'ℹ️' })}>
            <Download size={16} className="mr-2" /> Tải Excel
          </Button>
          <Button variant="outline" onClick={() => toast('Tính năng in đang được chuẩn bị.', { icon: '🖨️' })}>
            <Printer size={16} className="mr-2" /> In
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} className="mr-2" /> Thêm điểm
          </Button>
        </div>
      </div>

      {/* Horizontal Toolbar Filter */}
      <div className="bg-surface border border-border p-3.5 rounded-xl shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm tên / mã học viên..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Lớp học */}
          <div className="min-w-[160px]">
            <Select value={classFilter} onChange={(e: any) => setClassFilter(e.target.value)}>
              <option value="all">Tất cả lớp</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </Select>
          </div>

          {/* Xếp loại */}
          <div className="min-w-[150px]">
            <Select value={classificationFilter} onChange={(e: any) => setClassificationFilter(e.target.value)}>
              <option value="all">Tất cả xếp loại</option>
              <option value="GIOI">Giỏi</option>
              <option value="KHA">Khá</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="YEU">Yếu</option>
            </Select>
          </div>

          {/* Trạng thái */}
          <div className="min-w-[150px]">
            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Chưa khóa</option>
              <option value="LOCKED">Đã khóa</option>
            </Select>
          </div>

          {/* Nút đặt lại */}
          <Button variant="ghost" onClick={resetFilters} className="text-foreground-muted hover:text-foreground" title="Đặt lại bộ lọc">
            <RotateCcw size={15} className="mr-1.5" /> Đặt lại
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm transition-colors overflow-hidden">
        <div className="overflow-x-auto">
          {isError ? (
            <div className="p-12 text-center">
              <p className="text-rose-500 font-medium mb-2">Đã có lỗi xảy ra khi tải dữ liệu điểm từ máy chủ.</p>
              <p className="text-xs text-foreground-muted mb-4">{String((error as any)?.message || 'Internal Server Error')}</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['grades'] })}>Thử lại</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>HỌC VIÊN</TableHead>
                  <TableHead>MÃ HV</TableHead>
                  <TableHead>LỚP HỌC</TableHead>
                  <TableHead className="text-center">ĐIỂM QUÁ TRÌNH</TableHead>
                  <TableHead className="text-center">ĐIỂM GIỮA KỲ</TableHead>
                  <TableHead className="text-center">ĐIỂM CUỐI KỲ</TableHead>
                  <TableHead className="text-center">TỔNG ĐIỂM</TableHead>
                  <TableHead className="text-center">XẾP LOẠI</TableHead>
                  <TableHead className="text-center">TRẠNG THÁI</TableHead>
                  <TableHead className="text-right pr-6">THAO TÁC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-foreground-muted">Đang tải dữ liệu điểm...</TableCell>
                  </TableRow>
                ) : !grades || grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12">
                      <EmptyState 
                        title="Chưa có dữ liệu điểm" 
                        description="Không tìm thấy kết quả học tập nào khớp với điều kiện tìm kiếm." 
                        isSearch={!!debouncedSearch || classFilter !== 'all' || classificationFilter !== 'all' || statusFilter !== 'all'} 
                        action={<Button onClick={handleAdd}><Plus size={16} className="mr-2" /> Thêm điểm</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((g, index) => (
                    <TableRow key={g.id} className="hover:bg-surface-hover/50 transition-colors">
                      <TableCell className="text-center text-foreground-muted">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">{g.studentName}</TableCell>
                      <TableCell className="font-mono text-xs text-foreground-muted">{g.studentCode || '-'}</TableCell>
                      <TableCell className="text-foreground">{g.className || g.courseClassName}</TableCell>
                      <TableCell className="text-center">{formatScore(g.processScore)}</TableCell>
                      <TableCell className="text-center">{formatScore(g.midtermScore)}</TableCell>
                      <TableCell className="text-center">{formatScore(g.finalScore)}</TableCell>
                      <TableCell className="text-center">{formatTotalScore(g.totalScore)}</TableCell>
                      <TableCell className="text-center">{renderClassification(g.classification)}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={g.status === 'LOCKED' ? 'default' : 'secondary'} 
                          className="inline-flex items-center gap-1.5"
                        >
                          {g.status === 'LOCKED' ? (
                            <><Lock size={12} /> Đã khóa</>
                          ) : (
                            <><Edit size={12} /> Chưa khóa</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Sửa */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={g.status === 'LOCKED' ? 'Điểm đã khóa, không thể sửa' : 'Chỉnh sửa'}
                            onClick={() => handleEdit(g)} 
                            disabled={g.status === 'LOCKED'}
                          >
                            <Edit size={15} className={g.status === 'LOCKED' ? 'text-slate-400 opacity-40' : 'text-blue-500'} />
                          </Button>

                          {/* Khóa / Mở khóa */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={g.status === 'LOCKED' ? 'Đã khóa (Nhấn để mở khóa)' : 'Khóa bảng điểm'} 
                            onClick={() => handleLock(g.id, g.status)}
                          >
                            {g.status === 'LOCKED' ? (
                              <Lock size={15} className="text-foreground-muted" />
                            ) : (
                              <Unlock size={15} className="text-amber-500" />
                            )}
                          </Button>

                          {/* Xóa */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title={g.status === 'LOCKED' ? 'Điểm đã khóa, không thể xóa' : 'Xóa'} 
                            onClick={() => handleDelete(g.id, g.status)} 
                            disabled={g.status === 'LOCKED'}
                          >
                            <Trash2 size={15} className={g.status === 'LOCKED' ? 'text-slate-400 opacity-40' : 'text-rose-500'} />
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
