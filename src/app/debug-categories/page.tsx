'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryService } from '@/lib/services/categoryService';
import { ProductService } from '@/lib/services/productService';

export default function DebugCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Debug: Loading categories...');
      const categoriesData = await CategoryService.getAll();
      console.log('Debug: Categories loaded:', categoriesData);
      setCategories(categoriesData);
      
      console.log('Debug: Loading products...');
      const productsData = await ProductService.getAll();
      console.log('Debug: Products loaded:', productsData);
      setProducts(productsData);
      
    } catch (err) {
      console.error('Debug: Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTestCategory = async () => {
    try {
      await CategoryService.create({
        name: 'Test Category',
        description: 'A test category created for debugging',
        status: 'active',
        image: '/images/test-category.jpg'
      });
      alert('Test category created successfully!');
      loadData();
    } catch (err) {
      console.error('Error creating test category:', err);
      alert('Failed to create test category: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Debug Categories</h1>
            <p className="text-gray-600">Debug category and product loading</p>
          </div>
          <div className="space-x-2">
            <Button onClick={loadData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
            <Button onClick={createTestCategory} variant="outline">
              Create Test Category
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories ({categories.length})</CardTitle>
              <CardDescription>
                Categories loaded from Firebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading categories...</p>
              ) : categories.length === 0 ? (
                <p className="text-gray-500">No categories found</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                      <div className="text-xs text-gray-500">
                        Status: {category.status} | Order: {category.order || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products ({products.length})</CardTitle>
              <CardDescription>
                Products loaded from Firebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-gray-500">No products found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">Category: {product.categoryName}</div>
                      <div className="text-xs text-gray-500">
                        Price: ${product.price} | Stock: {product.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Browser Console</CardTitle>
            <CardDescription>
              Check the browser console for detailed debugging information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Open the browser developer tools (F12) and check the Console tab for detailed logs about data loading.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}