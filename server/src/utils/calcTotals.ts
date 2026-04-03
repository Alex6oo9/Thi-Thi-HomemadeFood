import { OrderItem, OrderTotals } from '../types';

export const calculateOrderTotals = (items: OrderItem[]): OrderTotals => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return {
    subtotal,
    total: subtotal
  };
};