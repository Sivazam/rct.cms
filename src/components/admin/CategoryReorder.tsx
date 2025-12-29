'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Package, Image } from 'lucide-react';
import { useDataStore } from '@/lib/data-store';

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

export function CategoryReorder() {
  const { categories, reorderCategories } = useDataStore();
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);

  // Initialize ordered categories
  useEffect(() => {
    if (categories.length > 0 && orderedCategories.length === 0) {
      setOrderedCategories([...categories].sort((a, b) => a.order - b.order));
    }
  }, [categories, orderedCategories.length]);

  const handleDragStart = (category: Category) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCategory: Category) => {
    if (!draggedCategory || draggedCategory.id === targetCategory.id) return;

    const newOrderedCategories = [...orderedCategories];
    const draggedIndex = newOrderedCategories.findIndex(c => c.id === draggedCategory.id);
    const targetIndex = newOrderedCategories.findIndex(c => c.id === targetCategory.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged category from its current position
      newOrderedCategories.splice(draggedIndex, 1);
      // Insert it at the target position
      newOrderedCategories.splice(targetIndex, 0, draggedCategory);
      
      setOrderedCategories(newOrderedCategories);
      setHasChanges(true);
    }

    setDraggedCategory(null);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const categoryOrders = orderedCategories.map((category, index) => ({
        id: category.id,
        order: index + 1
      }));
      
      await reorderCategories(categoryOrders);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving category order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setOrderedCategories([...categories].sort((a, b) => a.order - b.order));
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Reorder Categories</CardTitle>
          <div className="flex space-x-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                Reset
              </Button>
            )}
            <Button 
              onClick={handleSaveOrder} 
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Drag and drop categories to reorder them. This will affect the order they appear in the store.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orderedCategories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={() => handleDragStart(category)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(category)}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-move transition-colors ${
                draggedCategory?.id === category.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-gray-400">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Image className="h-5 w-5 text-gray-400" alt="Category icon" />
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.description}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                  {category.status}
                </Badge>
                <Badge variant="outline">
                  <Package className="h-3 w-3 mr-1" />
                  {category.productCount} products
                </Badge>
                <div className="text-sm text-gray-500 font-mono">
                  #{index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {orderedCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No categories found. Create some categories first to reorder them.
          </div>
        )}
      </CardContent>
    </Card>
  );
}