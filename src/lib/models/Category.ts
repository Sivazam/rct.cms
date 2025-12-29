import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  iconUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  iconUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);