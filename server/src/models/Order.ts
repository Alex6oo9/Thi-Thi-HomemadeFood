import mongoose, { Document, Schema } from 'mongoose';
import { OrderItem, PaymentInfo, OrderTotals, OrderStatus } from '../types';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: OrderItem[];
  notes?: string;
  status: OrderStatus;
  payment: PaymentInfo;
  totals: OrderTotals;
  contactInfo: {
    name: string;
    phone: string;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['RECEIVED', 'PREPARING', 'DELIVERED'],
    default: 'RECEIVED'
  },
  payment: {
    method: {
      type: String,
      enum: ['KBZPAY'],
      default: 'KBZPAY'
    },
    proofUrl: {
      type: String
    },
    txLast6: {
      type: String,
      length: 6
    },
    verified: {
      type: Boolean,
      default: false
    },
    rejected: {
      type: Boolean,
      default: false
    }
  },
  totals: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  contactInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  }
}, {
  timestamps: true
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);