/**
 * Page displaying user's order history.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import type { Order, OrderStatus } from '../types';

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'RECEIVED':
      return {
        label: 'Received',
        variant: 'info' as const,
        icon: Clock,
      };
    case 'PREPARING':
      return {
        label: 'Preparing',
        variant: 'warning' as const,
        icon: Package,
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        variant: 'success' as const,
        icon: CheckCircle,
      };
    default:
      return {
        label: status,
        variant: 'neutral' as const,
        icon: Package,
      };
  }
}

function OrderCard({ order }: { order: Order }) {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const createdDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Order Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </span>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>

          <p className="text-sm text-gray-500 mb-2">{createdDate}</p>

          <div className="flex flex-wrap gap-2">
            {order.items.slice(0, 3).map((item, index) => (
              <span
                key={index}
                className="text-sm bg-gray-100 px-2 py-1 rounded"
              >
                {item.name} x{item.qty}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                +{order.items.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Total and Action */}
        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-burmese-ruby">
              {order.totals.total.toLocaleString()} Ks
            </p>
          </div>

          <Link to={`/orders/${order._id}`}>
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} iconPosition="right">
              Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Payment Status */}
      {!order.payment.verified && order.status !== 'DELIVERED' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${order.payment.rejected ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
              {order.payment.rejected
                ? 'Payment rejected — please re-upload'
                : order.payment.proofUrl
                ? 'Payment verification pending'
                : 'Payment proof not uploaded'}
            </p>
            {(!order.payment.proofUrl || order.payment.rejected) && (
              <Link to={`/orders/${order._id}`}>
                <Button variant="secondary" size="sm">
                  {order.payment.rejected ? 'Re-upload' : 'Upload Payment'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export function MyOrdersPage() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.orders.myOrders(),
    queryFn: () => api.getMyOrders(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load orders
            </h2>
            <p className="text-gray-600">
              Please try again later or contact support.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const orders = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">
              View and track your order history
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start exploring our delicious menu and place your first order!
            </p>
            <Link to="/">
              <Button variant="primary">Browse Menu</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
