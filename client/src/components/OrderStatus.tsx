/**
 * Order status progress indicator.
 */

import { Check, Clock, Package, Truck } from 'lucide-react';
import type { OrderStatus as OrderStatusType } from '../types';

interface OrderStatusProps {
  status: OrderStatusType;
}

const steps = [
  { key: 'RECEIVED', label: 'Order Received', icon: Clock },
  { key: 'PREPARING', label: 'Preparing', icon: Package },
  { key: 'DELIVERED', label: 'Delivered', icon: Truck },
];

function getStepIndex(status: OrderStatusType): number {
  const index = steps.findIndex((s) => s.key === status);
  return index >= 0 ? index : 0;
}

export function OrderStatus({ status }: OrderStatusProps) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6">
      <h3 className="font-semibold text-lg mb-6">Order Status</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-burmese-ruby text-white ring-4 ring-burmese-ruby/20'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <p
                className={`mt-2 text-sm font-medium text-center ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block absolute w-full h-0.5 top-6 left-1/2 ${
                    index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
