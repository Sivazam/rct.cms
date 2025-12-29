'use client';


import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryLink: string;
  altText: string;
}


interface BannerCarouselProps {
  banners?: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}


export function BannerCarousel({
  banners = [],
  autoPlay = true,
  autoPlayInterval = 5000
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});


  // Default banners if none provided
  const defaultBanners: Banner[] = [
    {
      id: '1',
      title: 'SANATHAN RUDRAKSHA',
      description: 'Authentic Rudrakshas & Spiritual Essentials to uplift your journey.',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rudra-bb6b7.firebasestorage.app/o/Dupload%2Fimage%20(13)%20(1).webp?alt=media&token=60e59bd1-c1d9-40e5-be2c-40eefdfb60de',
      categoryLink: '/',
      altText: 'Sanathan Rudraksha Spiritual Products'
    },
    {
      id: '2',
      title: 'SHOP NOW',
      description: 'Discover our collection of authentic spiritual products',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rudra-bb6b7.firebasestorage.app/o/Dupload%2FShop%20Now%20(1).jpg?alt=media&token=ba05c76f-b1d5-4fe3-8c47-622da00e29fd',
      categoryLink: '/',
      altText: 'Shop Now for Spiritual Products'
    }
  ];


  const carouselBanners = banners.length > 0 ? banners : defaultBanners;


  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselBanners.length - 1 ? 0 : prevIndex + 1
    );
  }, [carouselBanners.length]);


  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);


  const handleImageError = (bannerId: string) => {
    console.error(`Failed to load image for banner ${bannerId}`);
    setImageErrors(prev => ({ ...prev, [bannerId]: true }));
  };


  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay) return;


    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, nextSlide]);


  if (carouselBanners.length === 0) {
    return (
      <div className="h-[70vh] bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }


  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      {/* Banner Images */}
      <div className="relative h-full">
        {carouselBanners.map((banner, index) => (
          <Link
            key={banner.id}
            href={banner.categoryLink}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-in-out",
              index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="relative h-full w-full">
              {imageErrors[banner.id] ? (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-start pl-4 sm:pl-6 md:pl-8 lg:pl-12">
                  <div className="text-left text-orange-800 max-w-md">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                      {banner.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg">
                      {banner.description}
                    </p>
                  </div>
                </div>
              ) : (
                <Image
                  src={banner.imageUrl}
                  alt={banner.altText}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  unoptimized="true"
                  // onError={() => handleImageError(banner.id)}
                />
              )}
             
              {/* Optional overlay with text - positioned on left center */}
              {/* Only show overlay if image loaded successfully */}
              {!imageErrors[banner.id] && (
                <div className="absolute inset-0 flex items-center justify-start pl-4 sm:pl-6 md:pl-8 lg:pl-12">
                  <div className="text-left text-white max-w-md">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
                      {banner.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg opacity-90 drop-shadow-md">
                      {banner.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>


      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {carouselBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "transition-all duration-300 ease-in-out rounded-full",
              index === currentIndex
                ? "w-3 h-3 bg-white"  // Larger dot for active slide
                : "w-2 h-2 bg-white/60 hover:bg-white/80"  // Regular dot for inactive slides
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
