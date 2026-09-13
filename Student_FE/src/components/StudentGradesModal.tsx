import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from './ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { Grade } from '../features/learning-results/grades.api';

export const StudentGradesModal: React.FC<{ isOpen: boolean; onClose: () => void; studentName: string | null }> = ({ isOpen, onClose, studentName }) => {
  const { data: grades, isLoading, isError } = useQuery<Grade[]>({
    queryKey: ['student-grades', studentName],
    queryFn: async () => {
      if (!studentName) return [];
      const response = await api.post('/api/learning-results/search', {
        studentName: studentName
      });
      return response as any;
    },
    enabled: isOpen && !!studentName,
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Kết quả học tập: ${studentName || ''}`} maxWidth="5xl">
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lớp</TableHead>
                <TableHead className="text-center">Quá trình</TableHead>
                <TableHead className="text-center">Giữa kỳ</TableHead>
                <TableHead className="text-center">Cuối kỳ</TableHead>
                <TableHead className="text-center">Tổng điểm</TableHead>
                <TableHead className="text-center">Xếp loại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead>Nhận xét</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-foreground-muted">Đang tải dữ liệu điểm...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-rose-500 font-medium">Lỗi khi tải kết quả học tập.</TableCell></TableRow>
              ) : !grades || grades.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-foreground-muted">Chưa có dữ liệu điểm.</TableCell></TableRow>
              ) : (
                grades.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.className || g.courseClassName}</TableCell>
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
                    <TableCell className="text-foreground-secondary text-sm max-w-xs truncate">
                      {g.teacherComment || '-'}
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
