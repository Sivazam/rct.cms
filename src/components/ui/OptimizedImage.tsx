'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  onLoad,
  onError,
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  blurDataURL,
  objectFit = 'cover' // Default to cover so images fill entire container
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const currentImg = imgRef.current;
    if (!currentImg) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.unobserve(currentImg);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.01
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, [priority]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src || imageLoaded || hasError) return;

    const img = new Image();
    
    img.onload = () => {
      setImageLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    // Start loading with a small delay to allow for smooth rendering
    const timer = setTimeout(() => {
      img.src = src;
    }, priority ? 0 : 100);

    return () => clearTimeout(timer);
  }, [src, isInView, imageLoaded, hasError, onLoad, onError, priority]);

  // Generate srcset for responsive images
  const generateSrcSet = useCallback(() => {
    if (!src) return '';
    
    // If it's already a URL with parameters or from Firebase Storage, don't modify it
    if (src.includes('?') || src.includes('firebasestorage.googleapis.com')) return src;
    
    // Basic srcset generation - you can enhance this based on your image service
    const baseUrl = src.split('.')[0];
    const extension = src.split('.').pop() || 'jpg';
    
    return `${src} 1x, ${baseUrl}@2x.${extension} 2x, ${baseUrl}@3x.${extension} 3x`;
  }, [src]);

  // Check if image is from Firebase Storage
  const isFirebaseStorage = src.includes('firebasestorage.googleapis.com');

  // If there's an error, show a placeholder
  if (hasError) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-100 border border-gray-200`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-gray-500 text-sm">Image not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Placeholder/Blur effect */}
      {!imageLoaded && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurDataURL ? 'blur(8px)' : undefined
          }}
        />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        srcSet={isInView ? generateSrcSet() : undefined}
        alt={alt}
        className={`${className} transition-transform duration-500 ease-in-out w-full h-full`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        unoptimized={isFirebaseStorage ? "true" : undefined}
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          transform: imageLoaded ? 'scale(1)' : 'scale(1)',
          objectFit: objectFit,
          objectPosition: 'center center',
          display: 'block'
        }}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
      />
      
      {/* Skeleton loading instead of circular spinner */}
      {!imageLoaded && isInView && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}
    </div>
  );
}