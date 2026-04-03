/**
 * Hook for handling API errors in a user-friendly way.
 * Provides consistent error message formatting across the app.
 */

import { useCallback } from 'react';
import type { ApiError } from '../types';

interface UseApiErrorReturn {
  getErrorMessage: (error: unknown) => string;
  getFieldErrors: (error: unknown) => Record<string, string>;
}

export function useApiError(): UseApiErrorReturn {
  const getErrorMessage = useCallback((error: unknown): string => {
    if (!error) return 'An unexpected error occurred';

    const apiError = error as ApiError;

    // Handle validation errors (array of field errors)
    if (apiError.errors && Array.isArray(apiError.errors)) {
      return apiError.errors.map((e) => e.msg).join('. ');
    }

    // Handle general error message
    if (apiError.error) {
      return apiError.error;
    }

    // Handle HTTP status codes
    const status = apiError.status;
    if (status) {
      switch (status) {
        case 401:
          return 'Please login to continue';
        case 403:
          return 'You do not have permission to perform this action';
        case 404:
          return 'The requested resource was not found';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Request failed with status ${status}`;
      }
    }

    // Fallback for unknown error types
    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }, []);

  const getFieldErrors = useCallback(
    (error: unknown): Record<string, string> => {
      if (!error) return {};

      const apiError = error as ApiError;
      const fieldErrors: Record<string, string> = {};

      if (apiError.errors && Array.isArray(apiError.errors)) {
        for (const err of apiError.errors) {
          fieldErrors[err.param] = err.msg;
        }
      }

      return fieldErrors;
    },
    []
  );

  return { getErrorMessage, getFieldErrors };
}
