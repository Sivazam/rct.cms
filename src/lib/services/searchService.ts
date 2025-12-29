import { ProductService } from './productService';

export interface SearchResult {
  id: string;
  name: string;
  deity: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  discount: number;
  image: string;
  slug: string;
}

export class SearchService {
  private static instance: SearchService;
  private allProducts: SearchResult[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  private async fetchAllProducts(): Promise<SearchResult[]> {
    try {
      // Check if cache is still valid
      const now = Date.now();
      if (this.allProducts.length > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        return this.allProducts;
      }

      const products = await ProductService.getAll();
      
      const searchResults: SearchResult[] = products.map(product => ({
        id: product.id,
        name: product.name,
        deity: product.deity,
        categoryName: product.categoryName,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        image: product.images[0] || '/products/default.jpg',
        slug: product.slug
      }));

      this.allProducts = searchResults;
      this.lastFetchTime = now;
      
      return searchResults;
    } catch (error) {
      console.error('Error fetching products for search:', error);
      return [];
    }
  }

  async searchProducts(query: string, limit?: number): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const allProducts = await this.fetchAllProducts();
      const searchQuery = query.toLowerCase().trim();

      const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.deity.toLowerCase().includes(searchQuery) ||
        product.categoryName.toLowerCase().includes(searchQuery)
      );

      return limit ? filteredProducts.slice(0, limit) : filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  async getPopularProducts(limit: number = 4): Promise<SearchResult[]> {
    try {
      const allProducts = await this.fetchAllProducts();
      // For now, return the first few products. In a real app, you might sort by popularity, rating, etc.
      return allProducts.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  clearCache(): void {
    this.allProducts = [];
    this.lastFetchTime = 0;
  }
}

export const searchService = SearchService.getInstance();