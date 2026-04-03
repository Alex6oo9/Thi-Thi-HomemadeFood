import { Request } from 'express';
import { IUser } from '../models/User';

// Tell Passport (and therefore Express) that req.user is always our IUser type
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

// Extend Express Request to include Passport user
export interface RequestWithUser extends Request {
  user?: IUser;
}

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

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'DELIVERED';
export type UserRole = 'customer' | 'admin';