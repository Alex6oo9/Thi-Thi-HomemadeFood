/**
 * Bulk Action Bar component
 * Shows selected count and bulk action buttons
 */

import { X, Eye, EyeOff, Trash2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMarkAvailable?: () => void;
  onMarkUnavailable?: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onMarkAvailable,
  onMarkUnavailable,
  onDelete,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
        {/* Selected count */}
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onMarkAvailable && (
            <button
              onClick={onMarkAvailable}
              className="flex items-center gap-2 px-3 py-2 text-body-sm font-medium hover:bg-gray-700 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              Mark Available
            </button>
          )}

          {onMarkUnavailable && (
            <button
              onClick={onMarkUnavailable}
              className="flex items-center gap-2 px-3 py-2 text-body-sm font-medium hover:bg-gray-700 rounded-md transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Mark Unavailable
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-body-sm font-medium text-red-400 hover:bg-red-900/30 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}
