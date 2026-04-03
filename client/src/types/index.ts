/**
 * TypeScript types matching the Thi Thi Server API.
 * These types align with the backend schemas documented in Server_Docs.md.
 */

// ==================== User Types ====================

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}

// ==================== Product Types ====================

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[]; // All product images (first is thumbnail by default)
  ingredients?: string[]; // Optional array of ingredient names
  available: boolean;
  isBestSeller: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Order Types ====================

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'DELIVERED';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface PaymentInfo {
  method: 'KBZPAY';
  proofUrl?: string;
  txLast6?: string;
  verified: boolean;
  rejected: boolean;
}

export interface OrderTotals {
  subtotal: number;
  total: number;
}

export interface ContactInfo {
  name: string;
  phone: string;
  address: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  notes?: string;
  status: OrderStatus;
  payment: PaymentInfo;
  totals: OrderTotals;
  contactInfo: ContactInfo;
  createdAt: string;
  updatedAt: string;
}

// ==================== Cart Types (Client-Side) ====================

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// ==================== API Error Types ====================

export interface ValidationError {
  msg: string;
  param: string;
  location: string;
}

export interface ApiError {
  error?: string;
  errors?: ValidationError[];
  status?: number;
}
