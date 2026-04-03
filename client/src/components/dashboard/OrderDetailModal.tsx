/**
 * Order Detail Modal Component
 * Displays complete order information with actions for status updates and payment verification
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle, Loader2, AlertCircle, ZoomIn } from 'lucide-react';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Badge } from '../Badge';
import { ConfirmDialog } from './ConfirmDialog';
import type { Order, OrderStatus } from '../../types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  RECEIVED: { label: 'Pending', color: 'warning' },
  PREPARING: { label: 'Preparing', color: 'info' },
  DELIVERED: { label: 'Delivered', color: 'success' },
};

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const queryClient = useQueryClient();
  const [rejectConfirm, setRejectConfirm] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => api.updateOrderStatus(order!._id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: () => api.verifyPayment(order!._id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: () => api.verifyPayment(order!._id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      setRejectConfirm(false);
    },
  });

  if (!isOpen || !order) return null;

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleVerifyPayment = () => {
    verifyPaymentMutation.mutate();
    // Auto-change status to PREPARING when payment is verified
    if (order.status === 'RECEIVED') {
      updateStatusMutation.mutate('PREPARING');
    }
  };

  const handleRejectPayment = () => {
    setRejectConfirm(true);
  };

  const confirmRejectPayment = () => {
    rejectPaymentMutation.mutate();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Guard against broken legacy URLs stored as "…/uploads/undefined"
  const proofUrl = order.payment.proofUrl?.includes('/undefined') ? undefined : order.payment.proofUrl;

  const getPaymentStatusBadge = () => {
    if (!proofUrl) {
      return <Badge variant="error">No Payment</Badge>;
    }
    if (order.payment.verified) {
      return <Badge variant="success">Payment Verified</Badge>;
    }
    if (order.payment.rejected) {
      return <Badge variant="error">Payment Rejected</Badge>;
    }
    return <Badge variant="warning">Payment Pending</Badge>;
  };

  return (
    <>
      {/* Modal backdrop */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal content */}
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-h2 font-semibold text-gray-900 dark:text-gray-100">
                Order #{order._id.slice(-6).toUpperCase()}
              </h2>
              <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="order-date">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div data-testid="order-status-badge">
                <Badge variant={statusConfig[order.status].color as any}>
                  {statusConfig[order.status].label}
                </Badge>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Customer Information
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-gray-500 dark:text-gray-400 w-24">Name:</span>
                  <span className="text-body-sm text-gray-900 dark:text-gray-100 font-medium">
                    {order.contactInfo.name || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-body-sm text-gray-500 dark:text-gray-400 w-24">Phone:</span>
                  <span className="text-body-sm text-gray-900 dark:text-gray-100 font-medium" data-testid="customer-phone">
                    {order.contactInfo.phone}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-body-sm text-gray-500 dark:text-gray-400 w-24">Address:</span>
                  <span className="text-body-sm text-gray-900 dark:text-gray-100" data-testid="customer-address">
                    {order.contactInfo.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Order Items
              </h3>
              <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-caption font-semibold text-gray-600 dark:text-gray-400">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center text-caption font-semibold text-gray-600 dark:text-gray-400">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-caption font-semibold text-gray-600 dark:text-gray-400">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-caption font-semibold text-gray-600 dark:text-gray-400">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-body-sm text-gray-900 dark:text-gray-100">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-body-sm text-gray-900 dark:text-gray-100 text-center">
                          {item.qty}
                        </td>
                        <td className="px-4 py-3 text-body-sm text-gray-900 dark:text-gray-100 text-right">
                          {item.price.toLocaleString()} Ks
                        </td>
                        <td className="px-4 py-3 text-body-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                          {(item.price * item.qty).toLocaleString()} Ks
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
                <div className="flex justify-between text-body font-semibold text-gray-900 dark:text-gray-100">
                  <span>Total:</span>
                  <span data-testid="order-total">
                    {order.totals.total.toLocaleString()} Ks
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Payment Information
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-gray-600 dark:text-gray-400">Status:</span>
                  {getPaymentStatusBadge()}
                </div>

                {order.payment.txLast6 && (
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-gray-600 dark:text-gray-400">Transaction (Last 6 digits):</span>
                    <span className="text-body-sm text-gray-900 dark:text-gray-100 font-mono font-medium" data-testid="transaction-digits">
                      {order.payment.txLast6}
                    </span>
                  </div>
                )}

                {proofUrl && (
                  <div>
                    <span className="text-body-sm text-gray-600 dark:text-gray-400 block mb-2">
                      Payment Proof:
                    </span>
                    <div className="relative">
                      <img
                        src={proofUrl}
                        alt="Payment proof"
                        data-testid="payment-proof-image"
                        className="w-full max-w-sm rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer"
                        onClick={() => setImageZoom(true)}
                      />
                      <button
                        onClick={() => setImageZoom(true)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-md transition-colors"
                      >
                        <ZoomIn className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment Actions */}
                {proofUrl && !order.payment.verified && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleVerifyPayment}
                      disabled={verifyPaymentMutation.isPending}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-md text-body-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {verifyPaymentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Verify Payment
                    </button>
                    <button
                      onClick={handleRejectPayment}
                      disabled={rejectPaymentMutation.isPending}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md text-body-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {rejectPaymentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      Reject Payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div data-testid="order-notes">
                <h3 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Order Notes
                </h3>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                  <p className="text-body-sm text-gray-900 dark:text-gray-100">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Update Status */}
            <div>
              <h3 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Update Order Status
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                  disabled={updateStatusMutation.isPending}
                  data-testid="status-select"
                  className="flex-1 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-body-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby/50 cursor-pointer disabled:opacity-50"
                >
                  <option value="PREPARING">Preparing</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
                {updateStatusMutation.isPending && (
                  <Loader2 className="w-5 h-5 animate-spin text-burmese-ruby" />
                )}
              </div>
              {updateStatusMutation.isSuccess && (
                <p className="text-body-sm text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status updated successfully
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Payment Confirmation */}
      <ConfirmDialog
        isOpen={rejectConfirm}
        onClose={() => setRejectConfirm(false)}
        onConfirm={confirmRejectPayment}
        title="Reject Payment"
        message="Are you sure you want to reject this payment? This action will mark the payment as unverified."
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Image Zoom Modal */}
      {imageZoom && proofUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setImageZoom(false)}
        >
          <img
            src={proofUrl}
            alt="Payment proof (zoomed)"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImageZoom(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </>
  );
}
