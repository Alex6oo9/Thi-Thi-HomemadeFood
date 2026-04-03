/**
 * Sortable Column Header component
 * Clickable table header with sort indicators
 */

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableColumnHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: {
    sortBy: string;
    order: 'asc' | 'desc';
  };
  onSort: (sortKey: string) => void;
}

export function SortableColumnHeader({
  label,
  sortKey,
  currentSort,
  onSort,
}: SortableColumnHeaderProps) {
  const isActive = currentSort?.sortBy === sortKey;
  const isAsc = isActive && currentSort?.order === 'asc';
  const isDesc = isActive && currentSort?.order === 'desc';

  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-2 text-left w-full group hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      <span>{label}</span>
      {!isActive && (
        <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
      {isAsc && (
        <ArrowUp className="w-4 h-4 text-burmese-ruby" data-sort="asc" />
      )}
      {isDesc && (
        <ArrowDown className="w-4 h-4 text-burmese-ruby" data-sort="desc" />
      )}
    </button>
  );
}
