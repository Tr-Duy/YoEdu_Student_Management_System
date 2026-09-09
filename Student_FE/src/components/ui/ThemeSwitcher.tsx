import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Tùy chọn giao diện"
      className={`flex items-center rounded-lg border border-border bg-surface-hover/60 p-1 gap-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Chuyển sang giao diện Sáng"
        aria-pressed={theme === 'light'}
        title="Giao diện Sáng"
        className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          theme === 'light'
            ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
            : 'text-foreground-muted hover:text-foreground hover:bg-surface/50'
        }`}
      >
        <Sun size={15} className={theme === 'light' ? 'text-amber-500' : 'text-foreground-muted'} />
        <span>Sáng</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Chuyển sang giao diện Tối"
        aria-pressed={theme === 'dark'}
        title="Giao diện Tối"
        className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
          theme === 'dark'
            ? 'bg-surface text-brand-400 shadow-sm font-semibold'
            : 'text-foreground-muted hover:text-foreground hover:bg-surface/50'
        }`}
      >
        <Moon size={15} className={theme === 'dark' ? 'text-indigo-400' : 'text-foreground-muted'} />
        <span>Tối</span>
      </button>
    </div>
  );
};

export default ThemeSwitcher;
