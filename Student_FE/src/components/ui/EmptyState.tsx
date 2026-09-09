import React from 'react';
import { SearchX, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  isSearch?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  action, 
  icon,
  isSearch = false 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-4">
        {icon || (isSearch ? <SearchX size={24} /> : <FolderOpen size={24} />)}
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
