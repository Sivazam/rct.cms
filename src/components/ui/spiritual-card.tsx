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
          card: 'bg-white border-2 border-primary/60 hover:border-primary hover:shadow-lg transition-all duration-200',
          header: 'border-b border-primary/30 bg-primary/10',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
      case 'ritual':
        return {
          card: 'bg-white border-2 border-orange-400/60 hover:border-orange-400 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-orange-400/30 bg-orange-400/10',
          title: 'text-orange-900',
          description: 'text-orange-700'
        };
      case 'memorial':
        return {
          card: 'bg-white border-2 border-primary/60 hover:border-primary hover:shadow-lg transition-all duration-200',
          header: 'border-b border-primary/30 bg-primary/10',
          title: 'text-foreground',
          description: 'text-muted-foreground'
        };
      case 'professional':
        return {
          card: 'bg-white border-2 border-slate-400/60 hover:border-slate-400 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-slate-400/30 bg-slate-400/10',
          title: 'text-slate-900',
          description: 'text-slate-600'
        };
      case 'warning':
        return {
          card: 'bg-white border-2 border-yellow-500/60 hover:border-yellow-500 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-yellow-500/30 bg-yellow-500/10',
          title: 'text-yellow-900',
          description: 'text-yellow-700'
        };
      case 'success':
        return {
          card: 'bg-white border-2 border-green-500/60 hover:border-green-500 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-green-500/30 bg-green-500/10',
          title: 'text-green-900',
          description: 'text-green-700'
        };
      case 'divine':
        return {
          card: 'bg-white border-2 border-orange-400/60 hover:border-orange-400 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-orange-400/30 bg-orange-400/20',
          title: 'text-orange-900',
          description: 'text-orange-700'
        };
      default:
        return {
          card: 'bg-white border-2 border-border/80 hover:border-primary/60 hover:shadow-lg transition-all duration-200',
          header: 'border-b border-border/30',
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