import Head from 'next/head';
import { ReactNode } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  children?: ReactNode;
}

export function SEO({
  title,
  description = 'Authentic spiritual products including Rudraksha beads, malas, and more. Shop premium quality spiritual items at Sanathan Rudraksha.',
  keywords = 'Rudraksha, spiritual products, malas, beads, meditation, yoga, spiritual jewelry, Sanathan Rudraksha',
  ogImage = '/og-default.jpg',
  ogUrl,
  canonicalUrl,
  noIndex = false,
  children
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanathanrudraksha.com';
  const fullOgUrl = ogUrl ? `${siteUrl}${ogUrl}` : siteUrl;
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title} | Sanathan Rudraksha</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Sanathan Rudraksha" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${title} | Sanathan Rudraksha`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:site_name" content="Sanathan Rudraksha" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | Sanathan Rudraksha`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Additional SEO Tags */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {noIndex && (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      )}
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Additional children */}
      {children}
    </Head>
  );
}

interface ProductSEOProps extends SEOProps {
  product: {
    name: string;
    description: string;
    images: string[];
    price: number;
    deity: string;
    origin: string;
  };
}

export function ProductSEO({ product, title, ...seoProps }: ProductSEOProps) {
  const productTitle = title || `${product.name} - ${product.deity}`;
  
  return (
    <SEO
      title={productTitle}
      description={`${product.description} Origin: ${product.origin}. Price: ₹${product.price.toLocaleString()}. Authentic spiritual product from Sanathan Rudraksha.`}
      keywords={`${product.name}, ${product.deity}, Rudraksha, spiritual product, ${product.origin}, meditation`}
      ogImage={product.images[0]}
      ogUrl={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}
      {...seoProps}
    >
      <meta property="product:price:amount" content={product.price.toString()} />
      <meta property="product:price:currency" content="INR" />
      <meta property="product:availability" content="in stock" />
    </SEO>
  );
}

interface CategorySEOProps extends SEOProps {
  category: {
    name: string;
    description?: string;
  };
}

export function CategorySEO({ category, title, ...seoProps }: CategorySEOProps) {
  const categoryTitle = title || `${category.name} - Spiritual Products`;
  
  return (
    <SEO
      title={categoryTitle}
      description={category.description || `Shop authentic ${category.name.toLowerCase()} and spiritual products at Sanathan Rudraksha. Premium quality items for your spiritual journey.`}
      keywords={`${category.name}, spiritual products, Rudraksha, meditation, yoga, spiritual items`}
      ogUrl={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
      {...seoProps}
    />
  );
}