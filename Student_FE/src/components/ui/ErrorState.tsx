import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Không thể tải dữ liệu', 
  description = 'Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.', 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="gap-2">
          <RefreshCcw size={16} />
          Thử lại
        </Button>
      )}
    </div>
  );
};
