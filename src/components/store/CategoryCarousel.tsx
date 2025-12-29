'use client';

import { Button } from '@/components/ui/button';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  image: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryCarousel({ categories, selectedCategory, onCategorySelect }: CategoryCarouselProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-6 px-4">
        <h2 className="text-xl font-bold text-black font-sans">Select Category</h2>
        <div className="flex-1 ml-4">
          <div className="h-px bg-[#846549]" style={{ width: '80%' }}></div>
        </div>
      </div>
      
      <div 
        className="category-scroll"
        style={{ 
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '1rem'
        }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.name)}
            className="category-button"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: '0',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: selectedCategory === category.name ? '#ffeee0' : 'transparent',
              border: selectedCategory === category.name ? `2px solid #9c542a` : 'none',
              minWidth: '70px',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
            }}
          >
            <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center ${category.name === 'All' ? 'bg-gray-100' : ''}`}>
              {category.name === 'All' ? (
                // Special icon for "All" category
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">All</span>
                </div>
              ) : (
                <ImageWithLoader
                  src={category.image}
                  alt={category.name}
                  className="w-12 h-12 object-cover"
                  onError={(e) => {
                    // Fallback to first letter if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <span class="font-bold text-lg" style="color: ${selectedCategory === category.name ? '#9c542a' : '#666666'}">
                        ${(category.name || '').charAt(0) || ''}
                      </span>
                    `;
                  }}
                />
              )}
            </div>
            {category.name !== 'All' && (
              <span className="text-xs font-medium" style={{ 
                color: selectedCategory === category.name ? '#9c542a' : '#000000' 
              }}>
                {category.name}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}