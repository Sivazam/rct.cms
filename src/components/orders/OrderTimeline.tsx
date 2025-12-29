'use client';

import { CheckCircle, Package, Truck, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderTimelineProps {
  status: OrderStatus;
  className?: string;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'skipped';
}

export function OrderTimeline({ status, className }: OrderTimelineProps) {
  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        key: 'pending',
        label: 'Order Placed',
        icon: <Clock className="h-4 w-4" />,
        status: 'completed'
      },
      {
        key: 'processing',
        label: 'Processing',
        icon: <Package className="h-4 w-4" />,
        status: 'pending'
      },
      {
        key: 'packed',
        label: 'Packed',
        icon: <Package className="h-4 w-4" />,
        status: 'pending'
      },
      {
        key: 'shipped',
        label: 'Shipped',
        icon: <Truck className="h-4 w-4" />,
        status: 'pending'
      },
      {
        key: 'delivered',
        label: 'Delivered',
        icon: <CheckCircle className="h-4 w-4" />,
        status: 'pending'
      }
    ];

    // Map status to timeline
    if (status === 'cancelled') {
      steps[0].status = 'completed';
      steps[1].status = 'skipped';
      steps[2].status = 'skipped';
      steps[3].status = 'skipped';
      steps[4].status = 'skipped';
    } else if (status === 'delivered') {
      steps.forEach(step => step.status = 'completed');
    } else if (status === 'shipped') {
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'completed';
      steps[3].status = 'completed';
      steps[4].status = 'current';
    } else if (status === 'packed') {
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'current';
      steps[3].status = 'pending';
      steps[4].status = 'pending';
    } else if (status === 'processing') {
      steps[0].status = 'completed';
      steps[1].status = 'current';
      steps[2].status = 'pending';
      steps[3].status = 'pending';
      steps[4].status = 'pending';
    } else if (status === 'pending') {
      steps[0].status = 'current';
      steps[1].status = 'pending';
      steps[2].status = 'pending';
      steps[3].status = 'pending';
      steps[4].status = 'pending';
    }

    return steps;
  };

  const steps = getTimelineSteps();

  const getStepStyles = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'current':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'skipped':
        return 'bg-gray-100 text-gray-400 border-gray-300';
      default:
        return 'bg-gray-50 text-gray-400 border-gray-200';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Progress</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-200 -z-10" />

        {steps.map((step, index) => (
          <div key={step.key} className="relative flex items-start gap-4">
            {/* Step icon circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center z-10',
                getStepStyles(step.status)
              )}
            >
              {step.icon}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-medium',
                    step.status === 'completed' || step.status === 'current'
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {step.status === 'current' && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>

              {step.status === 'completed' && index < steps.length - 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  ✓ Step completed
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status-specific messages */}
      {status === 'cancelled' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Order Cancelled</p>
              <p className="text-sm text-red-700 mt-1">
                This order has been cancelled. Please contact support if you have any questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'delivered' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Order Delivered!</p>
              <p className="text-sm text-green-700 mt-1">
                Your order has been successfully delivered. Thank you for shopping with us!
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'shipped' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Order Shipped</p>
              <p className="text-sm text-blue-700 mt-1">
                Your order is on its way! You should receive it soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
