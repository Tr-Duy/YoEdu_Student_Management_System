import React, { HTMLAttributes } from 'react';

export const Table = React.forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={`w-full text-sm text-left text-slate-300 ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <thead ref={ref} className={`text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-800 ${className}`} {...props}>
      {children}
    </thead>
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tbody ref={ref} className={`divide-y divide-slate-800/50 ${className}`} {...props}>
      {children}
    </tbody>
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', children, ...props }, ref) => (
    <tr ref={ref} className={`hover:bg-slate-800/30 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <th ref={ref} className={`px-4 py-3 font-medium ${className}`} {...props}>
      {children}
    </th>
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', children, ...props }, ref) => (
    <td ref={ref} className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  )
);
TableCell.displayName = 'TableCell';
