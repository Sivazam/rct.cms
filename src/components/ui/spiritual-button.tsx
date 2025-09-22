'use client';

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpiritualButtonProps {
  children: ReactNode;
  variant?: 'sacred' | 'ritual' | 'memorial' | 'default' | 'divine';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
}

export default function SpiritualButton({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  loading = false
}: SpiritualButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'sacred':
        return {
          button: 'bg-amber-700 hover:bg-amber-800 text-white border-amber-700',
          hover: 'shadow-sm hover:shadow-md'
        };
      case 'ritual':
        return {
          button: 'bg-orange-700 hover:bg-orange-800 text-white border-orange-700',
          hover: 'shadow-sm hover:shadow-md'
        };
      case 'memorial':
        return {
          button: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
          hover: 'shadow-sm hover:shadow-md'
        };
      case 'divine':
        return {
          button: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600',
          hover: 'shadow-sm hover:shadow-md hover:scale-[1.02]'
        };
      default:
        return {
          button: 'bg-amber-700 hover:bg-amber-800 text-white border-amber-700',
          hover: 'shadow-sm hover:shadow-md'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <div className="relative inline-block group">
      <Button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "relative border transition-all duration-200 font-medium",
          styles.button,
          styles.hover,
          sizeStyles,
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          <span>{children}</span>
        </div>
      </Button>
    </div>
  );
}