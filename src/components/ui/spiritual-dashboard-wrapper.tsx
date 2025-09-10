'use client';

import { ReactNode } from 'react';
import SpiritualCard from '@/components/ui/spiritual-card';
import { getRandomQuote, getMantra } from '@/lib/spiritual-texts';

interface SpiritualDashboardWrapperProps {
  children: ReactNode;
  title: string;
  description?: string;
  variant?: 'sacred' | 'ritual' | 'memorial';
  showOm?: boolean;
}

export default function SpiritualDashboardWrapper({
  children,
  title,
  description,
  variant = 'sacred',
  showOm = true
}: SpiritualDashboardWrapperProps) {
  const dailyQuote = getRandomQuote();
  const dailyMantra = getMantra('prayer');

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Subtle background element */}
      <div className="absolute inset-0 opacity-3 pointer-events-none">
        <div className="absolute top-20 right-20 text-8xl text-amber-200">ॐ</div>
      </div>

      <div className="relative z-10">
        {/* Header with spiritual elements */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                {showOm && <div className="text-2xl text-amber-600">ॐ</div>}
                <div>
                  <h1 className="text-xl font-bold text-amber-900">{title}</h1>
                  {description && (
                    <p className="text-sm text-amber-700">{description}</p>
                  )}
                </div>
              </div>
              
              {/* Daily mantra */}
              <div className="hidden md:block text-right">
                <div className="text-xs text-amber-600 italic">
                  {dailyMantra.sanskrit}
                </div>
                <div className="text-xs text-amber-500">
                  {dailyMantra.meaning}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Daily spiritual quote */}
          <SpiritualCard
            variant={variant}
            title="Sacred Wisdom"
            description="Daily guidance from the Bhagavad Gita"
            mantra={dailyQuote.sanskrit}
            showOm={true}
            className="mb-6"
          >
            <div className="space-y-3">
              <div className="text-amber-800 italic text-lg">
                "{dailyQuote.sanskrit}"
              </div>
              <div className="text-amber-700 text-sm">
                {dailyQuote.translation}
              </div>
              <div className="text-amber-600 text-xs">
                - Bhagavad Gita {dailyQuote.chapter}
              </div>
            </div>
          </SpiritualCard>

          {/* Main content area */}
          <div className="space-y-6">
            {children}
          </div>
        </main>

        {/* Footer with spiritual elements */}
        <footer className="bg-amber-100/50 border-t border-amber-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="text-amber-600">ॐ</div>
                <div className="text-sm text-amber-700">
                  Rotary Charitable Trust - Sacred Service to Humanity
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-xs text-amber-600 italic">
                  "The soul is eternal, unborn, and ever-existing"
                </div>
                <div className="text-xs text-amber-500">
                  - Bhagavad Gita 2.20
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}