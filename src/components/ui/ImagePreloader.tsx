'use client';

import { useEffect, useRef } from 'react';

interface ImagePreloaderProps {
  images: string[];
  priority?: boolean;
  batchSize?: number;
}

export function ImagePreloader({ 
  images, 
  priority = false, 
  batchSize = 3 
}: ImagePreloaderProps) {
  const preloadedRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (images.length === 0) return;

    // Filter out already preloaded images
    const imagesToPreload = images.filter(img => !preloadedRef.current.has(img));
    if (imagesToPreload.length === 0) return;

    const preloadImage = (src: string) => {
      if (preloadedRef.current.has(src)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      
      if (priority) {
        link.fetchPriority = 'high';
      }
      
      document.head.appendChild(link);
      
      // Also create an Image object to cache it
      const img = new Image();
      img.onload = () => {
        preloadedRef.current.add(src);
      };
      img.src = src;
    };

    if (priority) {
      // Preload all images immediately for priority
      imagesToPreload.forEach(preloadImage);
    } else {
      // Use Intersection Observer for lazy preloading
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                preloadImage(src);
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '200px', // Start preloading 200px before viewport
          threshold: 0.01
        }
      );

      // Create temporary image elements for observation
      imagesToPreload.slice(0, batchSize).forEach((src, index) => {
        const tempImg = document.createElement('img');
        tempImg.dataset.src = src;
        tempImg.style.display = 'none';
        document.body.appendChild(tempImg);
        observerRef.current?.observe(tempImg);
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [images, priority, batchSize]);

  return null;
}

// Hook for preloading images
export function useImagePreloader() {
  const preloadImages = (images: string[], priority = false) => {
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      
      if (priority) {
        link.fetchPriority = 'high';
      }
      
      document.head.appendChild(link);
      
      const img = new Image();
      img.src = src;
    });
  };

  return { preloadImages };
}