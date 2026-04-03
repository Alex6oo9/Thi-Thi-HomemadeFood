/**
 * Cart context with localStorage persistence.
 * Manages shopping cart state on the client side.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Cart, CartItem, Product } from '../types';

const CART_STORAGE_KEY = 'thithi_cart';

interface CartContextType {
  cart: Cart;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateCart(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return { items, subtotal, itemCount };
}

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Invalid stored data, return empty cart
  }
  return [];
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(() =>
    calculateCart(loadCartFromStorage())
  );

  // Persist cart to localStorage on changes
  useEffect(() => {
    saveCartToStorage(cart.items);
  }, [cart.items]);

  const addItem = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.items.find(
        (item) => item.productId === product._id
      );

      let newItems: CartItem[];
      if (existing) {
        newItems = prevCart.items.map((item) =>
          item.productId === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        const newItem: CartItem = {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          qty: 1,
        };
        newItems = [...prevCart.items, newItem];
      }

      return calculateCart(newItems);
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => item.productId !== productId
      );
      return calculateCart(newItems);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty < 1) {
      setCart((prevCart) => {
        const newItems = prevCart.items.filter(
          (item) => item.productId !== productId
        );
        return calculateCart(newItems);
      });
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.productId === productId ? { ...item, qty } : item
      );
      return calculateCart(newItems);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart(calculateCart([]));
  }, []);

  const isInCart = useCallback(
    (productId: string): boolean => {
      return cart.items.some((item) => item.productId === productId);
    },
    [cart.items]
  );

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const item = cart.items.find((item) => item.productId === productId);
      return item?.qty ?? 0;
    },
    [cart.items]
  );

  const value: CartContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
