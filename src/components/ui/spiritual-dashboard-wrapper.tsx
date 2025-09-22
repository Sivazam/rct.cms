'use client';

import { ReactNode } from 'react';
import SpiritualCard from '@/components/ui/spiritual-card';

interface SpiritualDashboardWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
  variant?: 'sacred' | 'ritual' | 'memorial';
}

export default function SpiritualDashboardWrapper({
  children,
  title,
  description,
  variant = 'sacred'
}: SpiritualDashboardWrapperProps) {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-xl font-bold text-amber-900">{title}</h1>
                  {description && (
                    <p className="text-sm text-amber-700">{description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Main content area */}
          <div className="space-y-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-amber-100/50 border-t border-amber-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-amber-700">
                  Cremation Management System
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-xs text-amber-600">
                  Professional Management System
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}