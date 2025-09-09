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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Background spiritual elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl text-orange-600">ॐ</div>
        <div className="absolute top-20 right-20 text-4xl text-red-600">卍</div>
        <div className="absolute bottom-20 left-20 text-5xl text-amber-600">🔥</div>
        <div className="absolute bottom-10 right-10 text-3xl text-orange-700">𑀰𑀺𑀪𑁆𑀢</div>
        <div className="absolute top-1/2 left-1/4 text-4xl text-orange-500 opacity-30">🕉️</div>
        <div className="absolute top-1/3 right-1/4 text-3xl text-red-500 opacity-30">🙏</div>
      </div>

      <div className="relative z-10">
        {/* Header with spiritual elements */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                {showOm && <div className="text-2xl text-orange-600">ॐ</div>}
                <div>
                  <h1 className="text-xl font-bold text-orange-800">{title}</h1>
                  {description && (
                    <p className="text-sm text-orange-600">{description}</p>
                  )}
                </div>
              </div>
              
              {/* Daily mantra */}
              <div className="hidden md:block text-right">
                <div className="text-xs text-orange-600 italic text-sanskrit">
                  {dailyMantra.sanskrit}
                </div>
                <div className="text-xs text-orange-500">
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
              <div className="text-orange-800 italic text-sanskrit text-lg">
                "{dailyQuote.sanskrit}"
              </div>
              <div className="text-orange-700 text-sm">
                {dailyQuote.translation}
              </div>
              <div className="text-orange-600 text-xs">
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
        <footer className="bg-orange-100/50 border-t border-orange-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="text-orange-600">ॐ</div>
                <div className="text-sm text-orange-700">
                  Rotary Charitable Trust - Sacred Service to Humanity
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-xs text-orange-600 italic text-sanskrit">
                  "The soul is eternal, unborn, and ever-existing"
                </div>
                <div className="text-xs text-orange-500">
                  - Bhagavad Gita 2.20
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .text-sanskrit {
          font-family: 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </div>
  );
}