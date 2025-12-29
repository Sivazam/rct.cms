import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant extends Document {
  productId: mongoose.Types.ObjectId;
  label: 'Regular' | 'Medium' | 'Ultra' | 'Rare';
  price: number;
  sku: string;
  inventory: number;
  discount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  label: {
    type: String,
    enum: ['Regular', 'Medium', 'Ultra', 'Rare'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  inventory: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.models.Variant || mongoose.model<IVariant>('Variant', variantSchema);