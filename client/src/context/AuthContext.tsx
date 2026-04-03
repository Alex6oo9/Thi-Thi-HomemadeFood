/**
 * Authentication context using session-based auth.
 * Integrates with React Query for server state management.
 */

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    profile?: { firstName?: string; lastName?: string }
  ) => Promise<void>;
  refreshUser: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch current user on mount
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login({ email, password }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.me(), { user: response.user });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      profile?: { firstName?: string; lastName?: string };
    }) => api.register(data),
  });

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const response = await loginMutation.mutateAsync({ email, password });
      return response.user;
    },
    [loginMutation]
  );

  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const register = useCallback(
    async (
      email: string,
      password: string,
      profile?: { firstName?: string; lastName?: string }
    ): Promise<void> => {
      await registerMutation.mutateAsync({ email, password, profile });
    },
    [registerMutation]
  );

  const refreshUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
  }, [queryClient]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!data?.user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(data.user.role);
    },
    [data?.user]
  );

  // Determine if user is authenticated (ignore 401 errors)
  const isAuthenticated = !!data?.user;
  const user = data?.user ?? null;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
