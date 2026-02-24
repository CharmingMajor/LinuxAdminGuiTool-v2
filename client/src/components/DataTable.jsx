import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data' }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  };

  const sorted = sortCol
    ? [...(data || [])].sort((a, b) => {
        const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data || [];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800/80">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider bg-surface-100 ${col.sortable !== false ? 'cursor-pointer hover:text-zinc-200 select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {sortCol === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">{emptyMessage}</td></tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-zinc-800/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-surface-100/50 ${i % 2 === 1 ? 'bg-surface-100/20' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-zinc-300">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
