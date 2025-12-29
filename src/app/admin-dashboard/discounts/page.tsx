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
import { Plus, Edit, Trash2, Tag, Search, Calendar, Percent } from 'lucide-react';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

const mockDiscounts: Discount[] = [
  {
    id: '1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    usageLimit: 100,
    usedCount: 45,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    isActive: true
  },
  {
    id: '2',
    code: 'FLAT50',
    type: 'fixed',
    value: 50,
    minOrderAmount: 299,
    usageLimit: 50,
    usedCount: 12,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    isActive: true
  },
  {
    id: '3',
    code: 'SPECIAL20',
    type: 'percentage',
    value: 20,
    minOrderAmount: 1000,
    usageLimit: 30,
    usedCount: 8,
    startDate: '2024-07-01',
    endDate: '2024-07-31',
    isActive: false
  }
];

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>(mockDiscounts);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: undefined as number | undefined,
    maxDiscountAmount: undefined as number | undefined,
    usageLimit: undefined as number | undefined,
    startDate: '',
    endDate: '',
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (editingDiscount) {
        setDiscounts(prev => prev.map(discount => 
          discount.id === editingDiscount.id 
            ? { ...editingDiscount, ...formData }
            : discount
        ));
      } else {
        const newDiscount: Discount = {
          ...formData,
          id: Date.now().toString(),
          usedCount: 0
        };
        setDiscounts(prev => [...prev, newDiscount]);
      }
      
      resetForm();
      setIsDialogOpen(false);
      setLoading(false);
    }, 1000);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrderAmount: discount.minOrderAmount,
      maxDiscountAmount: discount.maxDiscountAmount,
      usageLimit: discount.usageLimit,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      setDiscounts(prev => prev.filter(discount => discount.id !== id));
    }
  };

  const handleToggleActive = (discount: Discount) => {
    setDiscounts(prev => prev.map(d =>
      d.id === discount.id ? { ...d, isActive: !d.isActive } : d
    ));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      usageLimit: undefined,
      startDate: '',
      endDate: '',
      isActive: true
    });
    setEditingDiscount(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUsageStatus = (used: number, limit?: number) => {
    if (!limit) return { label: 'Unlimited', color: 'bg-blue-100 text-blue-800' };
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return { label: 'Exhausted', color: 'bg-red-100 text-red-800' };
    if (percentage >= 80) return { label: 'Almost Used', color: 'bg-orange-100 text-orange-800' };
    return { label: `${used}/${limit}`, color: 'bg-green-100 text-green-800' };
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discount Codes</h1>
          <p className="text-gray-600">Manage discount codes and promotional offers</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'Edit Discount' : 'Add New Discount'}
              </DialogTitle>
              <DialogDescription>
                {editingDiscount 
                  ? 'Update discount code details below.'
                  : 'Create a new discount code for customers.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Discount Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., WELCOME10"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minOrderAmount: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              {formData.type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscountAmount">Maximum Discount Amount (₹)</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDiscountAmount: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      usageLimit: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
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
                  {loading ? 'Saving...' : (editingDiscount ? 'Update' : 'Create')} Discount
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
              placeholder="Search discount codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Discount Codes</CardTitle>
          <CardDescription>
            Manage discount codes with usage tracking and expiration dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => {
                const usageStatus = getUsageStatus(discount.usedCount, discount.usageLimit);
                const expired = isExpired(discount.endDate);
                
                return (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="font-mono">{discount.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {discount.type === 'percentage' ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <span className="text-sm">₹</span>
                        )}
                        <span className="capitalize">{discount.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {discount.type === 'percentage' ? (
                        `${discount.value}%`
                      ) : (
                        `₹${discount.value}`
                      )}
                    </TableCell>
                    <TableCell>
                      {discount.minOrderAmount ? `₹${discount.minOrderAmount}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={usageStatus.color}>
                        {usageStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(discount.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(discount.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={discount.isActive && !expired ? "default" : "secondary"}>
                          {discount.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(discount)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(discount)}
                        >
                          {discount.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(discount.id)}
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
          
          {filteredDiscounts.length === 0 && (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discount codes found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first discount code.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}