import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from './ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { Grade } from '../features/learning-results/grades.api';

export const ClassGradesModal: React.FC<{ isOpen: boolean; onClose: () => void; classId: number | null; className: string }> = ({ isOpen, onClose, classId, className }) => {
  const { data: grades, isLoading, isError } = useQuery<Grade[]>({
    queryKey: ['class-grades', classId],
    queryFn: async () => {
      if (!classId) return [];
      const response = await api.post('/api/learning-results/search', {
        courseClassId: classId
      });
      return response as any;
    },
    enabled: isOpen && !!classId,
  });

  const formatScore = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return <span className="text-foreground-muted italic text-xs">Chưa nhập</span>;
    }
    return <span className="font-semibold">{Number(val).toFixed(1)}</span>;
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Bảng điểm lớp: ${className}`} maxWidth="5xl">
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead>Học viên</TableHead>
                <TableHead>Mã HV</TableHead>
                <TableHead className="text-center">Quá trình</TableHead>
                <TableHead className="text-center">Giữa kỳ</TableHead>
                <TableHead className="text-center">Cuối kỳ</TableHead>
                <TableHead className="text-center">Tổng điểm</TableHead>
                <TableHead className="text-center">Xếp loại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-foreground-muted">Đang tải...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-rose-500 font-medium">Lỗi khi tải bảng điểm lớp.</TableCell></TableRow>
              ) : !grades || grades.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-6 text-foreground-muted">Chưa có dữ liệu điểm cho lớp này.</TableCell></TableRow>
              ) : (
                grades.map((g, index) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-center text-foreground-muted">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{g.studentName}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground-muted">{g.studentCode || '-'}</TableCell>
                    <TableCell className="text-center">{formatScore(g.processScore)}</TableCell>
                    <TableCell className="text-center">{formatScore(g.midtermScore)}</TableCell>
                    <TableCell className="text-center">{formatScore(g.finalScore)}</TableCell>
                    <TableCell className="text-center font-bold text-brand-600 dark:text-brand-400">
                      {g.totalScore !== null && g.totalScore !== undefined ? g.totalScore : <span className="text-foreground-muted italic font-normal text-xs">Chưa nhập</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderClassification(g.classification)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={g.status === 'LOCKED' ? 'default' : 'secondary'}>
                        {g.status === 'LOCKED' ? 'Đã khóa' : 'Chưa khóa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
};
