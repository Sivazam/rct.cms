'use client';

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpiritualButtonProps {
  children: ReactNode;
  variant?: 'sacred' | 'ritual' | 'memorial' | 'default';
  size?: 'sm' | 'md' | 'lg';
  mantra?: string;
  showOm?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function SpiritualButton({
  children,
  variant = 'default',
  size = 'md',
  mantra,
  showOm = false,
  className = '',
  onClick,
  type = 'button',
  disabled = false
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
          button: 'bg-stone-700 hover:bg-stone-800 text-white border-stone-700',
          hover: 'shadow-sm hover:shadow-md'
        };
      case 'memorial':
        return {
          button: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
          hover: 'shadow-sm hover:shadow-md'
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
        disabled={disabled}
        className={cn(
          "relative border transition-all duration-200",
          styles.button,
          styles.hover,
          sizeStyles,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {showOm && <span className="text-sm text-amber-200">ॐ</span>}
          <span>{children}</span>
        </div>
      </Button>

      {/* Subtle mantra tooltip */}
      {mantra && !disabled && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {mantra}
        </div>
      )}
    </div>
  );
}