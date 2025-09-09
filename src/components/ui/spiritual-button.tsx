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
          button: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-orange-700',
          hover: 'shadow-lg shadow-orange-200/50 transform hover:scale-105'
        };
      case 'ritual':
        return {
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-700',
          hover: 'shadow-lg shadow-red-200/50 transform hover:scale-105'
        };
      case 'memorial':
        return {
          button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-700',
          hover: 'shadow-lg shadow-amber-200/50 transform hover:scale-105'
        };
      default:
        return {
          button: 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white border-orange-600',
          hover: 'shadow-lg shadow-orange-200/50 transform hover:scale-105'
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
    <div className="relative inline-block">
      {/* Spiritual aura effect */}
      <div className={cn(
        "absolute inset-0 rounded-lg transition-all duration-300",
        disabled ? 'opacity-0' : 'bg-gradient-to-r from-orange-200 to-red-200 blur-md opacity-50 group-hover:opacity-75'
      )} />
      
      <Button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative border-2 transition-all duration-300 group",
          styles.button,
          styles.hover,
          sizeStyles,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          {showOm && <span className="text-lg">ॐ</span>}
          <span>{children}</span>
        </div>
        
        {/* Subtle spiritual pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full rounded-lg bg-repeat" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='2' y='15' font-family='serif' font-size='12' fill='%23ea580c'%3Eॐ%3C/text%3E%3C/svg%3E")`,
                 backgroundSize: '20px 20px'
               }}>
          </div>
        </div>
      </Button>

      {/* Mantra tooltip */}
      {mantra && !disabled && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sanskrit">
          {mantra}
        </div>
      )}

      <style jsx>{`
        .text-sanskrit {
          font-family: 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </div>
  );
}