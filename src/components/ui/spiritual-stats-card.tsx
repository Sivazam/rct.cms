'use client';

import { ReactNode } from 'react';
import SpiritualCard from '@/components/ui/spiritual-card';
import { Package, RefreshCw, Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface SpiritualStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: string;
  trendValue?: string;
  icon: 'package' | 'refresh' | 'calendar' | 'dollar' | 'trending' | 'alert';
  variant?: 'sacred' | 'ritual' | 'memorial';
  mantra?: string;
}

export default function SpiritualStatsCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  variant = 'sacred',
  mantra
}: SpiritualStatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'package': return <Package className="h-5 w-5" />;
      case 'refresh': return <RefreshCw className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      case 'dollar': return <DollarSign className="h-5 w-5" />;
      case 'trending': return <TrendingUp className="h-5 w-5" />;
      case 'alert': return <AlertTriangle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'sacred': return 'text-orange-600';
      case 'ritual': return 'text-red-600';
      case 'memorial': return 'text-amber-600';
      default: return 'text-orange-600';
    }
  };

  return (
    <SpiritualCard
      variant={variant}
      mantra={mantra}
      showOm={false}
      className="hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          {description && (
            <div className="text-xs text-gray-500">
              {description}
            </div>
          )}
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              <TrendingUp className={`h-3 w-3 ${getIconColor()}`} />
              <span className="text-xs text-green-600 font-medium">
                {trendValue} {trend}
              </span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full bg-orange-100 ${getIconColor()}`}>
          {getIcon()}
        </div>
      </div>
    </SpiritualCard>
  );
}