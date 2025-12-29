/**
 * Utility functions for image optimization and progressive loading
 */

/**
 * Generates a low-resolution version of an image URL
 * @param src The original image source URL
 * @returns A low-resolution version of the image URL
 */
export function getLowResImageUrl(src: string): string {
  if (!src) return src;
  
  // If it's already a data URL or base64, return as-is
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  // If it's an external URL (http/https), try to add parameters for lower resolution
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const url = new URL(src);
    
    // For common image services that support resizing via URL parameters
    if (url.hostname.includes('cloudinary')) {
      // Cloudinary: add transformation for low quality
      url.searchParams.set('q', '10');
      url.searchParams.set('w', '100');
      return url.toString();
    } else if (url.hostname.includes('imgix')) {
      // Imgix: add parameters for low quality
      url.searchParams.set('q', '10');
      url.searchParams.set('w', '100');
      return url.toString();
    } else if (url.hostname.includes('unsplash')) {
      // Unsplash: add parameters for low quality
      url.searchParams.set('q', '10');
      url.searchParams.set('w', '100');
      return url.toString();
    } else {
      // Generic approach: try to add width parameter
      url.searchParams.set('width', '100');
      url.searchParams.set('quality', '10');
      return url.toString();
    }
  }
  
  // For local images, we could generate a low-res version, but for now return original
  // In a real implementation, you might want to generate actual low-res thumbnails
  return src;
}

/**
 * Checks if an image URL supports progressive loading
 * @param src The image source URL
 * @returns Boolean indicating if progressive loading is supported
 */
export function supportsProgressiveLoading(src: string): boolean {
  if (!src) return false;
  
  // Data URLs and blob URLs don't support progressive loading
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return false;
  }
  
  // External URLs generally support progressive loading
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return true;
  }
  
  // Local images might support progressive loading if we have a way to generate low-res versions
  return false;
}

/**
 * Generates image srcset for responsive images
 * @param src The base image URL
 * @param widths Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(src: string, widths: number[] = [100, 200, 400, 800, 1200]): string {
  if (!src || !supportsProgressiveLoading(src)) {
    return '';
  }
  
  return widths
    .map(width => {
      const url = new URL(src);
      url.searchParams.set('width', width.toString());
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
}

/**
 * Gets optimal image size based on container dimensions
 * @param containerWidth Container width in pixels
 * @param devicePixelRatio Device pixel ratio (default: 1)
 * @returns Optimal image width
 */
export function getOptimalImageSize(containerWidth: number, devicePixelRatio: number = 1): number {
  const sizes = [100, 200, 400, 800, 1200, 1600, 2000];
  const targetSize = containerWidth * devicePixelRatio;
  
  // Find the smallest size that's larger than the target
  for (const size of sizes) {
    if (size >= targetSize) {
      return size;
    }
  }
  
  // If target is larger than all sizes, return the largest
  return sizes[sizes.length - 1];
}