'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';

interface Variant {
  id: string;
  productId: string;
  productName: string;
  label: string;
  price: number;
  originalPrice?: number;
  discount: number;
  sku: string;
  stock: number;
  isActive: boolean;
}

const mockVariants: Variant[] = [
  {
    id: '1',
    productId: 'prod1',
    productName: '5 Mukhi Rudraksha',
    label: 'Small',
    price: 299,
    originalPrice: 399,
    discount: 25,
    sku: 'SKU001',
    stock: 50,
    isActive: true
  },
  {
    id: '2',
    productId: 'prod1',
    productName: '5 Mukhi Rudraksha',
    label: 'Medium',
    price: 499,
    originalPrice: 599,
    discount: 17,
    sku: 'SKU002',
    stock: 30,
    isActive: true
  },
  {
    id: '3',
    productId: 'prod1',
    productName: '5 Mukhi Rudraksha',
    label: 'Large',
    price: 799,
    originalPrice: 899,
    discount: 11,
    sku: 'SKU003',
    stock: 15,
    isActive: true
  },
  {
    id: '4',
    productId: 'prod2',
    productName: 'Sacred Tulsi Mala',
    label: 'Standard',
    price: 199,
    originalPrice: undefined,
    discount: 0,
    sku: 'SKU004',
    stock: 100,
    isActive: true
  }
];

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>(mockVariants);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    label: '',
    price: 0,
    originalPrice: undefined as number | undefined,
    discount: 0,
    sku: '',
    stock: 0,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (editingVariant) {
        setVariants(prev => prev.map(variant => 
          variant.id === editingVariant.id 
            ? { ...editingVariant, ...formData }
            : variant
        ));
      } else {
        const newVariant: Variant = {
          ...formData,
          id: Date.now().toString(),
          productName: 'Product Name', // In real app, fetch from product ID
        };
        setVariants(prev => [...prev, newVariant]);
      }
      
      resetForm();
      setIsDialogOpen(false);
      setLoading(false);
    }, 1000);
  };

  const handleEdit = (variant: Variant) => {
    setEditingVariant(variant);
    setFormData({
      productId: variant.productId,
      label: variant.label,
      price: variant.price,
      originalPrice: variant.originalPrice,
      discount: variant.discount,
      sku: variant.sku,
      stock: variant.stock,
      isActive: variant.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this variant?')) {
      setVariants(prev => prev.filter(variant => variant.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      label: '',
      price: 0,
      originalPrice: undefined,
      discount: 0,
      sku: '',
      stock: 0,
      isActive: true
    });
    setEditingVariant(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const filteredVariants = variants.filter(variant =>
    variant.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variant.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variant.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Variants</h1>
          <p className="text-gray-600">Manage product variants, pricing, and inventory</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? 'Edit Variant' : 'Add New Variant'}
              </DialogTitle>
              <DialogDescription>
                {editingVariant 
                  ? 'Update variant information below.'
                  : 'Create a new product variant.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Variant Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Small, Medium, Large"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Stock keeping unit"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      originalPrice: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingVariant ? 'Update' : 'Create')} Variant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Variants</CardTitle>
          <CardDescription>
            Manage product variants with pricing and inventory details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.map((variant) => {
                const stockStatus = getStockStatus(variant.stock);
                return (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.productName}</TableCell>
                    <TableCell>{variant.label}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">₹{variant.price}</div>
                        {variant.originalPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            ₹{variant.originalPrice}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {variant.discount > 0 ? (
                        <Badge variant="secondary">{variant.discount}%</Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{variant.stock}</span>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.isActive ? "default" : "secondary"}>
                        {variant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(variant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredVariants.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No variants found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first variant.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}