import { Request } from 'express';
import { IUser } from '../models/User';

// Tell Passport (and therefore Express) that req.user is always our IUser type.
// Also declare req.file / req.files so multer-uploaded handlers compile without
// needing @types/multer to augment the global namespace at build time.
declare global {
  namespace Express {
    interface User extends IUser {}
    interface Request {
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        destination?: string;
        filename?: string;
        path?: string;
      }
    }
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