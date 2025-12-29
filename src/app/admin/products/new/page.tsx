'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Plus, 
  Minus,
  Star,
  Tag,
  Package
} from 'lucide-react';
import Link from 'next/link';

interface ProductVariant {
  id: string;
  label: string;
  price: number;
  sku: string;
  discount: number;
  stock: number;
}

interface ProductFormData {
  name: string;
  deity: string;
  description: string;
  spiritualMeaning?: string;
  origin?: string;
  specifications?: string[];
  wearGuide?: {
    title: string;
    steps: string[];
    image?: string;
  };
  careGuide?: {
    title: string;
    steps: string[];
    image?: string;
  };
  category: string;
  tags: string[];
  status: 'active' | 'inactive' | 'draft';
  isBestseller: boolean;
  variants: ProductVariant[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newSpecification, setNewSpecification] = useState('');
  const [newWearGuideStep, setNewWearGuideStep] = useState('');
  const [newCareGuideStep, setNewCareGuideStep] = useState('');
  const [wearGuideImage, setWearGuideImage] = useState<string>('');
  const [wearGuideImageFile, setWearGuideImageFile] = useState<File | null>(null);
  const [careGuideImage, setCareGuideImage] = useState<string>('');
  const [careGuideImageFile, setCareGuideImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    deity: '',
    description: '',
    category: '',
    tags: [],
    status: 'draft',
    isBestseller: false,
    variants: [
      { id: '1', label: 'Standard', price: 0, sku: '', discount: 0, stock: 0 }
    ]
  });

  const categories = ['Rudraksha', 'Malas', 'Idols', 'Yantras', 'Bracelets', 'Pendants', 'Puja Items', 'Gemstones'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImageFiles(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleWearGuideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setWearGuideImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setWearGuideImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCareGuideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCareGuideImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCareGuideImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      label: '',
      price: 0,
      sku: '',
      discount: 0,
      stock: 0
    };
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const removeVariant = (id: string) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter(v => v.id !== id)
      }));
    }
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.id === id ? { ...v, [field]: value } : v
      )
    }));
  };

  // Specification management
  const addSpecification = () => {
    if (newSpecification.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...(prev.specifications || []), newSpecification.trim()]
      }));
      setNewSpecification('');
    }
  };

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications?.filter((_, i) => i !== index) || []
    }));
  };

  // Wear Guide management
  const addWearGuideStep = () => {
    if (newWearGuideStep.trim()) {
      setFormData(prev => ({
        ...prev,
        wearGuide: {
          title: prev.wearGuide?.title || 'Rudraksha Wear Guide',
          steps: [...(prev.wearGuide?.steps || []), newWearGuideStep.trim()],
          image: prev.wearGuide?.image || wearGuideImage
        }
      }));
      setNewWearGuideStep('');
    }
  };

  const removeWearGuideStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      wearGuide: prev.wearGuide ? {
        ...prev.wearGuide,
        steps: prev.wearGuide.steps.filter((_, i) => i !== index)
      } : undefined
    }));
  };

  const updateWearGuideTitle = (title: string) => {
    setFormData(prev => ({
      ...prev,
      wearGuide: prev.wearGuide ? {
        ...prev.wearGuide,
        title,
        image: prev.wearGuide?.image || wearGuideImage
      } : {
        title,
        steps: [],
        image: wearGuideImage
      }
    }));
  };

  const updateWearGuideImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      wearGuide: prev.wearGuide ? {
        ...prev.wearGuide,
        image
      } : {
        title: 'Rudraksha Wear Guide',
        steps: [],
        image
      }
    }));
  };

  // Care Guide management
  const addCareGuideStep = () => {
    if (newCareGuideStep.trim()) {
      setFormData(prev => ({
        ...prev,
        careGuide: {
          title: prev.careGuide?.title || 'Rudraksha Care Guide',
          steps: [...(prev.careGuide?.steps || []), newCareGuideStep.trim()],
          image: prev.careGuide?.image || careGuideImage
        }
      }));
      setNewCareGuideStep('');
    }
  };

  const removeCareGuideStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      careGuide: prev.careGuide ? {
        ...prev.careGuide,
        steps: prev.careGuide.steps.filter((_, i) => i !== index)
      } : undefined
    }));
  };

  const updateCareGuideTitle = (title: string) => {
    setFormData(prev => ({
      ...prev,
      careGuide: prev.careGuide ? {
        ...prev.careGuide,
        title,
        image: prev.careGuide?.image || careGuideImage
      } : {
        title,
        steps: [],
        image: careGuideImage
      }
    }));
  };

  const updateCareGuideImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      careGuide: prev.careGuide ? {
        ...prev.careGuide,
        image
      } : {
        title: 'Rudraksha Care Guide',
        steps: [],
        image
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      
      // Add basic product data
      formDataObj.append('name', formData.name);
      formDataObj.append('deity', formData.deity);
      formDataObj.append('description', formData.description);
      if (formData.spiritualMeaning) {
        formDataObj.append('spiritualMeaning', formData.spiritualMeaning);
      }
      if (formData.origin) {
        formDataObj.append('origin', formData.origin);
      }
      formDataObj.append('category', formData.category);
      formDataObj.append('status', formData.status);
      formDataObj.append('isBestseller', formData.isBestseller.toString());
      formDataObj.append('tags', JSON.stringify(formData.tags));
      formDataObj.append('variants', JSON.stringify(formData.variants));
      
      // Add new fields
      if (formData.specifications) {
        formDataObj.append('specifications', JSON.stringify(formData.specifications));
      }
      if (formData.wearGuide) {
        formDataObj.append('wearGuide', JSON.stringify(formData.wearGuide));
      }
      if (formData.careGuide) {
        formDataObj.append('careGuide', JSON.stringify(formData.careGuide));
      }
      
      // Add image files
      imageFiles.forEach((file, index) => {
        formDataObj.append('images', file);
      });

      // Add guide images
      if (wearGuideImageFile) {
        formDataObj.append('wearGuideImage', wearGuideImageFile);
      }
      if (careGuideImageFile) {
        formDataObj.append('careGuideImage', careGuideImageFile);
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Redirect to products list
          router.push('/admin/products');
        } else {
          console.error('Error creating product:', result.error);
          alert('Failed to create product: ' + result.error);
        }
      } else {
        console.error('Failed to create product');
        alert('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600">Create a new product with variants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for the new product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., 5 Mukhi Rudraksha"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deity">Deity/Associated With *</Label>
                    <Input
                      id="deity"
                      value={formData.deity}
                      onChange={(e) => setFormData({...formData, deity: e.target.value})}
                      placeholder="e.g., Lord Shiva"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'draft') => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe this product..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spiritualMeaning">Spiritual Meaning</Label>
                  <Textarea
                    id="spiritualMeaning"
                    value={formData.spiritualMeaning || ''}
                    onChange={(e) => setFormData({...formData, spiritualMeaning: e.target.value})}
                    placeholder="Describe the spiritual significance of this product..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={formData.origin || ''}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    placeholder="e.g., Nepali, Indonesian, Indian"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bestseller"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({...formData, isBestseller: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="bestseller" className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    Mark as Bestseller
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
                <CardDescription>
                  Add key features and specifications of the product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newSpecification}
                      onChange={(e) => setNewSpecification(e.target.value)}
                      placeholder="Add a specification..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                    />
                    <Button type="button" onClick={addSpecification}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.specifications?.map((spec, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm flex-1">{spec}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecification(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wear Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Wear Guide</CardTitle>
                <CardDescription>
                  Add instructions for wearing the product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guide Title</Label>
                    <Input
                      value={formData.wearGuide?.title || ''}
                      onChange={(e) => updateWearGuideTitle(e.target.value)}
                      placeholder="e.g., Rudraksha Wear Guide"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Guide Image</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleWearGuideImageUpload}
                          className="cursor-pointer"
                        />
                      </div>
                      {wearGuideImage && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border">
                          <img
                            src={wearGuideImage}
                            alt="Wear Guide Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Steps</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newWearGuideStep}
                        onChange={(e) => setNewWearGuideStep(e.target.value)}
                        placeholder="Add a step..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWearGuideStep())}
                      />
                      <Button type="button" onClick={addWearGuideStep}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      {formData.wearGuide?.steps.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{index + 1}. {step}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWearGuideStep(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Care Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Care Guide</CardTitle>
                <CardDescription>
                  Add instructions for caring for the product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Guide Title</Label>
                    <Input
                      value={formData.careGuide?.title || ''}
                      onChange={(e) => updateCareGuideTitle(e.target.value)}
                      placeholder="e.g., Rudraksha Care Guide"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Guide Image</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleCareGuideImageUpload}
                          className="cursor-pointer"
                        />
                      </div>
                      {careGuideImage && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border">
                          <img
                            src={careGuideImage}
                            alt="Care Guide Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Steps</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newCareGuideStep}
                        onChange={(e) => setNewCareGuideStep(e.target.value)}
                        placeholder="Add a step..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCareGuideStep())}
                      />
                      <Button type="button" onClick={addCareGuideStep}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      {formData.careGuide?.steps.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{index + 1}. {step}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCareGuideStep(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Variants */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                      Add different variants like sizes, types, etc.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addVariant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <div key={variant.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Variant {index + 1}</h4>
                      {formData.variants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Label *</Label>
                        <Input
                          value={variant.label}
                          onChange={(e) => updateVariant(variant.id, 'label', e.target.value)}
                          placeholder="e.g., Small"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹) *</Label>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, 'price', Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          value={variant.discount}
                          onChange={(e) => updateVariant(variant.id, 'discount', Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock *</Label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(variant.id, 'stock', Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                        placeholder="e.g., 5M-S"
                        required
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload high-quality images of the product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-900">
                          Add Images
                        </span>
                        <span className="block text-xs text-gray-500">
                          PNG, JPG, GIF
                        </span>
                      </Label>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Product Tags</CardTitle>
                <CardDescription>
                  Add tags to help categorize and search for products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Naming</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Use clear, descriptive names that customers will understand.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Images</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Use high-quality images with good lighting and clear backgrounds.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Pricing</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Set competitive prices and offer discounts for promotions.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Inventory</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Keep stock levels updated to avoid overselling.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Preview Product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>When you're ready, publish this product to make it available in your store.</p>
                </div>
                <Button 
                  type="submit" 
                  form="product-form"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading || !formData.name || !formData.deity || !formData.category || !formData.description}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Product'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden form for submission */}
        <form id="product-form" onSubmit={handleSubmit}></form>
      </div>
    </AdminLayout>
  );
}