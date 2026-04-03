/**
 * Unit tests for useApiError hook.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApiError } from './useApiError';

describe('useApiError', () => {
  describe('getErrorMessage', () => {
    it('returns message from validation errors array', () => {
      const { result } = renderHook(() => useApiError());

      const error = {
        errors: [
          { msg: 'Email is required', param: 'email', location: 'body' },
          { msg: 'Password is required', param: 'password', location: 'body' },
        ],
      };

      const message = result.current.getErrorMessage(error);
      expect(message).toBe('Email is required. Password is required');
    });

    it('returns general error message', () => {
      const { result } = renderHook(() => useApiError());

      const error = { error: 'Something went wrong' };
      const message = result.current.getErrorMessage(error);
      expect(message).toBe('Something went wrong');
    });

    it('returns message for 401 status', () => {
      const { result } = renderHook(() => useApiError());

      const error = { status: 401 };
      const message = result.current.getErrorMessage(error);
      expect(message).toBe('Please login to continue');
    });

    it('returns message for 403 status', () => {
      const { result } = renderHook(() => useApiError());

      const error = { status: 403 };
      const message = result.current.getErrorMessage(error);
      expect(message).toBe('You do not have permission to perform this action');
    });

    it('returns message for 404 status', () => {
      const { result } = renderHook(() => useApiError());

      const error = { status: 404 };
      const message = result.current.getErrorMessage(error);
      expect(message).toBe('The requested resource was not found');
    });

    it('returns message for 429 status', () => {
      const { result } = renderHook(() => useApiError());

      const error = { status: 429 };
      const message = result.current.getErrorMessage(error);
      expect(message).toBe('Too many requests. Please try again later.');
    });

    it('returns default message for unknown error', () => {
      const { result } = renderHook(() => useApiError());

      const message = result.current.getErrorMessage({});
      expect(message).toBe('An unexpected error occurred');
    });

    it('returns default message for null', () => {
      const { result } = renderHook(() => useApiError());

      const message = result.current.getErrorMessage(null);
      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('getFieldErrors', () => {
    it('extracts field errors from validation errors', () => {
      const { result } = renderHook(() => useApiError());

      const error = {
        errors: [
          { msg: 'Email is required', param: 'email', location: 'body' },
          { msg: 'Password too short', param: 'password', location: 'body' },
        ],
      };

      const fieldErrors = result.current.getFieldErrors(error);
      expect(fieldErrors).toEqual({
        email: 'Email is required',
        password: 'Password too short',
      });
    });

    it('returns empty object for non-validation errors', () => {
      const { result } = renderHook(() => useApiError());

      const error = { error: 'Something went wrong' };
      const fieldErrors = result.current.getFieldErrors(error);
      expect(fieldErrors).toEqual({});
    });

    it('returns empty object for null', () => {
      const { result } = renderHook(() => useApiError());

      const fieldErrors = result.current.getFieldErrors(null);
      expect(fieldErrors).toEqual({});
    });
  });
});
