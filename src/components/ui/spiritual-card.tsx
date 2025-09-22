'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReactNode } from 'react';

interface SpiritualCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'sacred' | 'ritual' | 'memorial' | 'professional' | 'warning' | 'success' | 'divine';
  footer?: ReactNode;
  onClick?: () => void;
}

export default function SpiritualCard({
  title,
  description,
  children,
  className = '',
  variant = 'default',
  footer,
  onClick
}: SpiritualCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'sacred':
        return {
          card: 'bg-white border-accent shadow-sm hover:shadow-md transition-shadow',
          header: 'border-accent bg-accent/20',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
      case 'ritual':
        return {
          card: 'bg-white border-orange-100 shadow-sm hover:shadow-md transition-shadow',
          header: 'border-background bg-background/20',
          title: 'text-orange-900',
          description: 'text-orange-700'
        };
      case 'memorial':
        return {
          card: 'bg-white border-accent shadow-sm hover:shadow-md transition-shadow',
          header: 'border-accent bg-accent/20',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
      case 'professional':
        return {
          card: 'bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow',
          header: 'border-slate-100 bg-slate-50/50',
          title: 'text-slate-900',
          description: 'text-slate-600'
        };
      case 'warning':
        return {
          card: 'bg-white border-accent shadow-sm hover:shadow-md transition-shadow',
          header: 'border-accent bg-accent/20',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
      case 'success':
        return {
          card: 'bg-white border-green-100 shadow-sm hover:shadow-md transition-shadow',
          header: 'border-green-50 bg-green-50/20',
          title: 'text-green-900',
          description: 'text-green-700'
        };
      case 'divine':
        return {
          card: 'bg-white border-orange-100 shadow-sm hover:shadow-md transition-shadow',
          header: 'border-background bg-background/30',
          title: 'text-orange-900',
          description: 'text-orange-700'
        };
      default:
        return {
          card: 'bg-white border-accent shadow-sm hover:shadow-md transition-shadow',
          header: 'border-accent',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card 
      className={`relative overflow-hidden ${styles.card} ${className}`}
      onClick={onClick}
    >
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