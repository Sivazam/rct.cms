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
          card: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg',
          header: 'border-orange-200 bg-orange-50/50',
          title: 'text-orange-800',
          description: 'text-orange-600'
        };
      case 'ritual':
        return {
          card: 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-lg',
          header: 'border-red-200 bg-red-50/50',
          title: 'text-red-800',
          description: 'text-red-600'
        };
      case 'memorial':
        return {
          card: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-lg',
          header: 'border-amber-200 bg-amber-50/50',
          title: 'text-amber-800',
          description: 'text-amber-600'
        };
      default:
        return {
          card: 'bg-white border-orange-100 shadow-md',
          header: 'border-orange-100',
          title: 'text-gray-800',
          description: 'text-gray-600'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`relative overflow-hidden ${styles.card} ${className}`}>
      {/* Background spiritual patterns */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-2 right-2 text-2xl text-orange-600">ॐ</div>
        <div className="absolute bottom-2 left-2 text-lg text-red-600">卍</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl text-orange-200 opacity-30">
          🔥
        </div>
      </div>

      {/* Decorative border pattern */}
      <div className="absolute inset-0 border-2 border-dashed border-orange-200 opacity-30 pointer-events-none m-1"></div>

      {(title || description || showOm) && (
        <CardHeader className={`${styles.header} relative z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {showOm && (
                <div className="text-2xl text-orange-600 mb-2">ॐ</div>
              )}
              {title && (
                <CardTitle className={`${styles.title} flex items-center space-x-2`}>
                  <span>{title}</span>
                  {variant === 'sacred' && <Badge className="bg-orange-100 text-orange-800">Sacred</Badge>}
                  {variant === 'ritual' && <Badge className="bg-red-100 text-red-800">Ritual</Badge>}
                  {variant === 'memorial' && <Badge className="bg-amber-100 text-amber-800">Memorial</Badge>}
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
            <div className="mt-3 p-2 bg-orange-100 rounded-md">
              <div className="text-sm text-sanskrit text-orange-700 italic">
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

      <style jsx>{`
        .text-sanskrit {
          font-family: 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </Card>
  );
}