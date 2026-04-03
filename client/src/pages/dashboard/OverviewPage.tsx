/**
 * Dashboard overview page with quick stats and recent activity.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { Order, Product } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  };

  const iconStyles = {
    default: 'text-gray-400 dark:text-gray-500',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
  };

  return (
    <div className={`rounded-md border p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-h1 font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
          {trend && (
            <p className="text-caption text-gray-500 dark:text-gray-400 mt-2">
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-md bg-gray-100 dark:bg-gray-800 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function OverviewPage() {
  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: () => api.getProducts(),
  });

  // Fetch orders (seller/admin)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: queryKeys.orders.lists(),
    queryFn: () => api.getAllOrders(),
  });

  const isLoading = productsLoading || ordersLoading;

  const products = productsData?.products || [];
  const orders = ordersData?.orders || [];

  // Calculate stats
  const totalProducts = productsData?.pagination?.total || 0;
  const availableProducts = products.filter((p: Product) => p.available).length;
  const pendingOrders = orders.filter((o: Order) => o.status === 'RECEIVED').length;
  const preparingOrders = orders.filter((o: Order) => o.status === 'PREPARING').length;

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Low stock alert (unavailable products)
  const unavailableProducts = products.filter((p: Product) => !p.available);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-h1 font-semibold text-gray-900 dark:text-gray-100">
          Overview
        </h1>
        <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={<Package className="w-5 h-5" />}
          trend={`${availableProducts} available`}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders}
          icon={<Clock className="w-5 h-5" />}
          variant={pendingOrders > 0 ? 'warning' : 'default'}
          trend="Awaiting confirmation"
        />
        <StatCard
          title="Preparing"
          value={preparingOrders}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
          trend="In progress"
        />
        <StatCard
          title="Total Orders"
          value={ordersData?.pagination?.total || 0}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
              Recent Orders
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No orders yet
              </div>
            ) : (
              recentOrders.map((order: Order) => (
                <div key={order._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-body-sm font-medium text-gray-900 dark:text-gray-100">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.totals.total.toLocaleString()} Ks
                    </p>
                  </div>
                  <span
                    className={`
                      px-2 py-1 rounded text-caption font-medium
                      ${order.status === 'RECEIVED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                      ${order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                      ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                    `}
                  >
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts / Low stock */}
        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100">
              Attention Needed
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {unavailableProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                All products are available
              </div>
            ) : (
              unavailableProducts.slice(0, 5).map((product: Product) => (
                <div key={product._id} className="px-6 py-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {product.name}
                    </p>
                    <p className="text-caption text-red-500">
                      Marked as unavailable
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
