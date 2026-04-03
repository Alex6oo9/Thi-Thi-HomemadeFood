/**
 * Toast notification component for temporary success/error messages.
 */

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <CheckCircle
          className={`w-5 h-5 flex-shrink-0 ${
            type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        />
        <p
          className={`text-sm font-medium ${
            type === 'success' ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className={`ml-2 ${
            type === 'success'
              ? 'text-green-600 hover:text-green-800'
              : 'text-red-600 hover:text-red-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
