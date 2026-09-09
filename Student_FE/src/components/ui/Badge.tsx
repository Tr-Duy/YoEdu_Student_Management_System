import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  className = '', 
  children, 
  ...props 
}) => {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
    neutral: 'bg-surface-hover text-foreground-secondary border-border',
    brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/25',
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
