/**
 * Dashboard orders management page.
 * View orders, update status, verify payments.
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Clock,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/dashboard/Pagination';
import { OrderDetailModal } from '../../components/dashboard/OrderDetailModal';
import { useDebounce } from '../../hooks/useDebounce';
import type { Order, OrderStatus } from '../../types';

type TabFilter = 'all' | 'RECEIVED' | 'PREPARING' | 'DELIVERED';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; color: string }> = {
  RECEIVED: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  },
  PREPARING: {
    label: 'Preparing',
    icon: Loader2,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  },
};

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-based state
  const currentPage = parseInt(searchParams.get('page') || '1');
  const urlSearch = searchParams.get('search') || '';

  // Local state for search input (for immediate UI feedback)
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Debounced search value (triggers API call after 400ms)
  const debouncedSearch = useDebounce(searchInput, 400);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      const newParams: Record<string, string> = { page: '1' };
      if (debouncedSearch) {
        newParams.search = debouncedSearch;
      }
      setSearchParams(newParams);
    }
  }, [debouncedSearch, urlSearch, setSearchParams]);

  // Sync search input with URL (for browser back/forward)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Fetch orders with pagination and search
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [...queryKeys.orders.lists(), currentPage, urlSearch],
    queryFn: () => api.getAllOrders({
      page: currentPage,
      limit: 10,
      search: urlSearch || undefined
    }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      api.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: ({ orderId, verified }: { orderId: string; verified: boolean }) =>
      api.verifyPayment(orderId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // Filter orders by tab (frontend filtering for status tabs)
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Apply tab filter (frontend only - for quick tab switching without API call)
    if (activeTab !== 'all') {
      result = result.filter((o: Order) => o.status === activeTab);
    }

    // Backend handles search, so no search filtering here
    // Sort by date (newest first)
    result.sort((a: Order, b: Order) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [orders, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: pagination.total,
    RECEIVED: orders.filter((o: Order) => o.status === 'RECEIVED').length,
    PREPARING: orders.filter((o: Order) => o.status === 'PREPARING').length,
    DELIVERED: orders.filter((o: Order) => o.status === 'DELIVERED').length,
  }), [orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleVerifyPayment = (orderId: string, verified: boolean) => {
    verifyPaymentMutation.mutate({ orderId, verified });
  };

  const handlePageChange = (page: number) => {
    const newParams: Record<string, string> = { page: String(page) };
    if (urlSearch) newParams.search = urlSearch;
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Unable to load orders
        </h2>
        <p className="text-body-sm text-gray-500 dark:text-gray-400">
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-gray-900 dark:text-gray-100">
            Orders
          </h1>
          <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track customer orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(['all', 'RECEIVED', 'PREPARING', 'DELIVERED'] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-3 text-body-sm font-medium border-b-2 -mb-px transition-colors
              bg-transparent focus:outline-none select-none [-webkit-tap-highlight-color:transparent]
              ${activeTab === tab
                ? 'text-burmese-ruby border-burmese-ruby'
                : 'text-gray-500 border-transparent active:text-gray-700 dark:active:text-gray-300'
              }
            `}
          >
            {tab === 'all' ? 'All' : statusConfig[tab].label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-caption bg-gray-100 dark:bg-gray-800">
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by order ID or phone..."
          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-body-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby/50"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-body font-medium text-gray-900 dark:text-gray-100 mb-2">
              {urlSearch || activeTab !== 'all' ? 'No orders found' : 'No orders yet'}
            </p>
            <p className="text-body-sm text-gray-500 dark:text-gray-400">
              {urlSearch || activeTab !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Orders will appear here when customers place them'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order: Order) => {
            const StatusIcon = statusConfig[order.status].icon;

            return (
              <div
                key={order._id}
                data-testid="order-card"
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                {/* Order header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-md ${statusConfig[order.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-gray-900 dark:text-gray-100">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-caption text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Payment status */}
                    {(order.payment.proofUrl && !order.payment.proofUrl.includes('/undefined')) ? (
                      order.payment.verified ? (
                        <Badge variant="success">Payment Verified</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">Payment Pending</Badge>
                          <button
                            onClick={() => handleVerifyPayment(order._id, true)}
                            disabled={verifyPaymentMutation.isPending}
                            className="px-3 py-1 text-caption font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                          >
                            Verify
                          </button>
                        </div>
                      )
                    ) : (
                      <Badge variant="error">No Payment</Badge>
                    )}

                    {/* Status dropdown */}
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value as OrderStatus)}
                        disabled={updateStatusMutation.isPending}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-body-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-burmese-ruby/50 cursor-pointer"
                      >
                        <option value="PREPARING">Preparing</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="px-6 py-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-body-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.qty}x {item.name}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {(item.price * item.qty).toLocaleString()} Ks
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                    <div className="text-body-sm text-gray-500 dark:text-gray-400">
                      <p>{order.contactInfo.phone}</p>
                      <p className="line-clamp-1">{order.contactInfo.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-body font-semibold text-gray-900 dark:text-gray-100">
                        {order.totals.total.toLocaleString()} Ks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}
