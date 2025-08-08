import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceCategory extends Document {
  _id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  createdAt: Date;
}

const ServiceCategorySchema = new Schema<IServiceCategory>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  iconUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

ServiceCategorySchema.index({ name: 1 });

export const ServiceCategory = mongoose.model<IServiceCategory>('ServiceCategory', ServiceCategorySchema);