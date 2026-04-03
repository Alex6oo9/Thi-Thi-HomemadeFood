/**
 * Type-safe API client for the Thi Thi backend.
 * All requests include credentials for session-based authentication.
 */

import { config } from './config';
import type {
  User,
  Product,
  Order,
  OrderStatus,
  ContactInfo,
  ApiError,
} from '../types';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, headers, ...fetchOptions } = options;

    const requestConfig: RequestInit = {
      ...fetchOptions,
      credentials: 'include', // Required for session cookies
      headers: {
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    };

    if (body && !(body instanceof FormData)) {
      requestConfig.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      requestConfig.body = body;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig);

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'An unexpected error occurred',
      }));
      throw {
        status: response.status,
        ...errorData,
      };
    }

    return response.json();
  }

  // ==================== Auth ====================

  register(data: {
    email: string;
    password: string;
    profile?: { firstName?: string; lastName?: string };
  }) {
    return this.request<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  login(data: { email: string; password: string }) {
    return this.request<{ message: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: data,
    });
  }

  logout() {
    return this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  getMe() {
    return this.request<{ user: User }>('/api/auth/me');
  }

  verifyEmail(token: string) {
    return this.request<{ message: string; autoLogin: boolean; user: User }>(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`
    );
  }

  resendVerification(email: string) {
    return this.request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  }

  forgotPassword(email: string) {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
  }

  // ==================== Products ====================

  async getProducts(params?: {
    available?: boolean;
    isBestSeller?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    search?: string;
  }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.available !== undefined) {
      searchParams.set('available', String(params.available));
    }
    if (params?.isBestSeller !== undefined) {
      searchParams.set('isBestSeller', String(params.isBestSeller));
    }
    if (params?.page !== undefined) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }
    if (params?.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params?.order) {
      searchParams.set('order', params.order);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    const query = searchParams.toString();
    const data = await this.request<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/api/products${query ? `?${query}` : ''}`
    );

    // Development warning for unexpected response format
    if (import.meta.env.DEV && !data.products) {
      console.warn('[API] getProducts: Expected products array in response:', data);
    }

    return data;
  }

  async getProduct(id: string): Promise<Product> {
    const data = await this.request<Product>(`/api/products/${id}`);

    // Development warning for unexpected response format
    if (import.meta.env.DEV && (!data || typeof data !== 'object' || !data._id)) {
      console.warn('[API] getProduct: Unexpected response format:', data);
    }

    return data;
  }

  createProduct(data: {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    images?: string[];
    isBestSeller?: boolean;
    ingredients?: string[];
  }) {
    return this.request<{ message: string; product: Product }>('/api/products', {
      method: 'POST',
      body: data,
    });
  }

  updateProduct(id: string, data: Partial<Omit<Product, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'>>) {
    return this.request<{ message: string; product: Product }>(
      `/api/products/${id}`,
      { method: 'PUT', body: data }
    );
  }

  deleteProduct(id: string) {
    return this.request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  toggleBestSeller(id: string, isBestSeller: boolean) {
    return this.request<{ message: string; product: Product }>(
      `/api/products/${id}/best-seller`,
      { method: 'PATCH', body: { isBestSeller } }
    );
  }

  bulkDeleteProducts(productIds: string[]) {
    return this.request<{ message: string; deleted: number }>('/api/products/bulk/delete', {
      method: 'POST',
      body: { productIds },
    });
  }

  bulkUpdateProducts(productIds: string[], updates: { available?: boolean }) {
    return this.request<{ message: string; updated: number }>('/api/products/bulk/update', {
      method: 'POST',
      body: { productIds, updates },
    });
  }

  // ==================== Orders ====================

  createOrder(data: {
    items: { productId: string; qty: number }[];
    notes?: string;
    contactInfo: ContactInfo;
  }) {
    return this.request<{ message: string; order: Order }>('/api/orders', {
      method: 'POST',
      body: data,
    });
  }

  async getMyOrders(): Promise<Order[]> {
    const data = await this.request<{ orders: Order[] }>('/api/orders/my');

    // Development warning for unexpected response format
    if (import.meta.env.DEV && !data.orders) {
      console.warn('[API] getMyOrders: Expected orders array in response:', data);
    }

    return data.orders || [];
  }

  async getAllOrders(params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ orders: Order[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.page !== undefined) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit !== undefined) {
      searchParams.set('limit', String(params.limit));
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    const query = searchParams.toString();
    const data = await this.request<{ orders: Order[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/api/orders${query ? `?${query}` : ''}`
    );

    // Development warning for unexpected response format
    if (import.meta.env.DEV && !data.orders) {
      console.warn('[API] getAllOrders: Expected orders array in response:', data);
    }

    return data;
  }

  async getOrder(id: string): Promise<Order> {
    const data = await this.request<Order>(`/api/orders/${id}`);

    // Development warning for unexpected response format
    if (import.meta.env.DEV && (!data || typeof data !== 'object' || !data._id)) {
      console.warn('[API] getOrder: Unexpected response format:', data);
    }

    return data;
  }

  updateOrderStatus(id: string, status: OrderStatus) {
    return this.request<{ message: string; order: Order }>(
      `/api/orders/${id}/status`,
      { method: 'PATCH', body: { status } }
    );
  }

  uploadPaymentProof(orderId: string, file: File, txLast6: string) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('txLast6', txLast6);
    return this.request<{ message: string; order: Order }>(
      `/api/orders/${orderId}/payment`,
      { method: 'POST', body: formData }
    );
  }

  verifyPayment(orderId: string, verified: boolean) {
    return this.request<{ message: string; order: Order }>(
      `/api/orders/${orderId}/verify`,
      { method: 'PATCH', body: { verified } }
    );
  }

  // ==================== Uploads ====================

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request<{ message: string; url: string; publicId: string }>(
      '/api/uploads/image',
      { method: 'POST', body: formData }
    );
  }

  // ==================== Settings & Profile (Phase 8) ====================

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    return this.request<User>('/api/users/me', {
      method: 'PUT',
      body: data,
    });
  }

  async getBusinessSettings() {
    return this.request<{
      phoneNumber: string;
      viberNumber: string;
      contactEmail: string;
      fbPageUrl: string;
      fbPageName: string;
      kbzPayNumber: string;
      kbzPayName: string;
      bankName: string;
    }>('/api/settings/business');
  }

  async updateBusinessSettings(data: {
    phoneNumber?: string;
    viberNumber?: string;
    contactEmail?: string;
    fbPageUrl?: string;
    fbPageName?: string;
    kbzPayNumber?: string;
    kbzPayName?: string;
    bankName?: string;
  }) {
    return this.request<{
      phoneNumber: string;
      viberNumber: string;
      contactEmail: string;
      fbPageUrl: string;
      fbPageName: string;
      kbzPayNumber: string;
      kbzPayName: string;
      bankName: string;
    }>('/api/settings/business', {
      method: 'PUT',
      body: data,
    });
  }

  async getNotificationPreferences() {
    return this.request<{
      emailNotifications: boolean;
      orderAlerts: boolean;
      lowStockAlerts: boolean;
    }>('/api/settings/notifications');
  }

  async updateNotificationPreferences(data: {
    emailNotifications?: boolean;
    orderAlerts?: boolean;
    lowStockAlerts?: boolean;
  }) {
    return this.request<{
      emailNotifications: boolean;
      orderAlerts: boolean;
      lowStockAlerts: boolean;
    }>('/api/settings/notifications', {
      method: 'PUT',
      body: data,
    });
  }
}

export const api = new ApiClient(config.apiBaseUrl);
