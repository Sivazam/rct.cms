'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReactNode } from 'react';

interface SpiritualCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'sacred' | 'ritual' | 'memorial';
  mantra?: string;
  showOm?: boolean;
  footer?: ReactNode;
}

export default function SpiritualCard({
  title,
  description,
  children,
  className = '',
  variant = 'default',
  mantra,
  showOm = false,
  footer
}: SpiritualCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'sacred':
        return {
          card: 'bg-white border-amber-100 shadow-sm',
          header: 'border-amber-50 bg-amber-50/20',
          title: 'text-amber-900',
          description: 'text-amber-700'
        };
      case 'ritual':
        return {
          card: 'bg-white border-stone-200 shadow-sm',
          header: 'border-stone-100 bg-stone-50/20',
          title: 'text-stone-800',
          description: 'text-stone-600'
        };
      case 'memorial':
        return {
          card: 'bg-white border-amber-50 shadow-sm',
          header: 'border-amber-50 bg-amber-50/20',
          title: 'text-amber-800',
          description: 'text-amber-600'
        };
      default:
        return {
          card: 'bg-white border-amber-100 shadow-sm',
          header: 'border-amber-50',
          title: 'text-amber-900',
          description: 'text-amber-700'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`relative overflow-hidden ${styles.card} ${className}`}>
      {/* Subtle background element */}
      {showOm && (
        <div className="absolute top-3 right-3 text-amber-200 text-lg opacity-20 pointer-events-none">
          ॐ
        </div>
      )}

      {(title || description) && (
        <CardHeader className={`${styles.header} relative z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <CardTitle className={`${styles.title} flex items-center space-x-2`}>
                  <span>{title}</span>
                </CardTitle>
              )}
              {description && (
                <CardDescription className={styles.description}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {mantra && (
            <div className="mt-3 p-2 bg-amber-50 rounded-md">
              <div className="text-sm text-amber-700 italic">
                {mantra}
              </div>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="relative z-10">
        {children}
      </CardContent>

      {footer && (
        <div className="relative z-10 px-6 pb-6">
          {footer}
        </div>
      )}
    </Card>
  );
}