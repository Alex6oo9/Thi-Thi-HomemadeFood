/**
 * Cart sidebar component using CartContext.
 */

import { X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CartItem } from './CartItem';
import { Button } from './Button';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/order-review');
  };

  const total = cart.subtotal;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-burmese-ruby" />
              <h2 className="text-xl font-semibold">Your Cart</h2>
              {cart.itemCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-burmese-ruby text-white text-xs font-bold rounded-full">
                  {cart.itemCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Your cart is empty
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Add some delicious homemade Burmese food to get started!
                </p>
                <Button variant="primary" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div>
                {cart.items.map((item) => (
                  <CartItem
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with Total and Checkout */}
          {cart.items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {cart.subtotal.toLocaleString()} Ks
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-burmese-ruby">
                      {total.toLocaleString()} Ks
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button variant="primary" fullWidth size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>

              <p className="text-xs text-center text-gray-500">
                View payment instructions and bank details
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
