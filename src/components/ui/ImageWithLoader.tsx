'use client';

import { useState, useEffect } from 'react';

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export function ImageWithLoader({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  onLoad,
  onError,
  loading = 'lazy',
  priority = false
}: ImageWithLoaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if image is from Firebase Storage
  const isFirebaseStorage = src.includes('firebasestorage.googleapis.com');

  useEffect(() => {
    if (src && !imageLoaded && !hasError) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      
      img.src = src;
    }
  }, [src, imageLoaded, onLoad, onError, hasError]);

  // If there's an error, show a placeholder
  if (hasError) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-200`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : loading}
      fetchPriority={priority ? 'high' : 'auto'}
      unoptimized={isFirebaseStorage ? "true" : undefined}
      style={{ 
        opacity: imageLoaded ? 1 : 0.8,
        transition: 'opacity 0.1s ease-in-out'
      }}
    />
  );
}