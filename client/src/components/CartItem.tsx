/**
 * Cart item component for the cart sidebar.
 */

import { Plus, Minus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const subtotal = item.price * item.qty;

  return (
    <div className="flex gap-4 p-4 border-b border-gray-200 last:border-0">
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
        <p className="text-sm text-gray-500 mb-2">
          {item.price.toLocaleString()} Ks each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-sm">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.qty - 1)}
              disabled={item.qty <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium">{item.qty}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.qty + 1)}
              disabled={item.qty >= 100}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.productId)}
            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Remove from cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold text-gray-900">
          {subtotal.toLocaleString()} Ks
        </p>
      </div>
    </div>
  );
}
