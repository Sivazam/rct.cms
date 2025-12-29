import mongoose, { Document, Schema } from 'mongoose';

export interface IProductMetadata {
  origin: string;
  material: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId;
  description: string;
  spiritualMeaning: string;
  deity: string;
  images: string[];
  metadata: IProductMetadata;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  spiritualMeaning: {
    type: String,
    required: true
  },
  deity: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  metadata: {
    origin: {
      type: String,
      required: true
    },
    material: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);