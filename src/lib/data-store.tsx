'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CategoryService } from '@/lib/services/categoryService';
import { ProductService } from '@/lib/services/productService';

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  order?: number;
}

interface Variant {
  id: string;
  name?: string;
  label?: string;
  price: number;
  originalPrice?: number;
  discount: number;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount: number;
  category: string;
  categoryName: string;
  images: string[];
  variants: Variant[];
  status: 'active' | 'inactive';
  stock: number;
  createdAt: string;
}

interface DataStoreContextType {
  categories: Category[];
  products: Product[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'productCount' | 'order'>, imageFile?: File) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>, imageFile?: File) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categoryOrders: { id: string; order: number }[]) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'slug'>, imageFiles?: File[]) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>, newImageFiles?: File[], imagesToDelete?: string[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

interface DataStoreProviderProps {
  children: ReactNode;
}

export function DataStoreProvider({ children }: DataStoreProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Firebase on mount
  const loadData = async () => {
    try {
      console.log('DataStore: Loading data from Firebase...');
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        CategoryService.getAll(),
        ProductService.getAll()
      ]);
      console.log('DataStore: Data loaded successfully', { 
        categories: categoriesData.length, 
        products: productsData.length 
      });
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error('DataStore: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'productCount' | 'order'>, imageFile?: File) => {
    try {
      await CategoryService.create(categoryData, imageFile);
      await loadData(); // Refresh data after creation
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>, imageFile?: File) => {
    try {
      await CategoryService.update(id, categoryData, imageFile);
      await loadData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await CategoryService.delete(id);
      await loadData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const reorderCategories = async (categoryOrders: { id: string; order: number }[]) => {
    try {
      await CategoryService.reorderCategories(categoryOrders);
      await loadData(); // Refresh data after reordering
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'slug'>, imageFiles?: File[]) => {
    try {
      await ProductService.create(productData, imageFiles);
      // Add a small delay to ensure Firestore consistency before refreshing data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData(); // Refresh data after creation
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>, newImageFiles?: File[], imagesToDelete?: string[]) => {
    try {
      await ProductService.update(id, productData, newImageFiles, imagesToDelete);
      // Add a small delay to ensure Firestore consistency before refreshing data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await ProductService.delete(id);
      // Add a small delay to ensure Firestore consistency before refreshing data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const value: DataStoreContextType = {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
    refreshData: loadData
  };

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (context === undefined) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
}

// Helper functions for backward compatibility (deprecated)
export function getStoredCategories(): Category[] {
  console.warn('getStoredCategories is deprecated. Use Firebase service instead.');
  return [];
}

export function getStoredProducts(): Product[] {
  console.warn('getStoredProducts is deprecated. Use Firebase service instead.');
  return [];
}