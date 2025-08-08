import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  _id: string;
  providerId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  providerId: {
    type: String,
    required: true,
    ref: 'ServiceProvider',
  },
  categoryId: {
    type: String,
    ref: 'ServiceCategory',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

ServiceSchema.index({ providerId: 1 });
ServiceSchema.index({ categoryId: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ name: 'text', description: 'text' });

export const Service = mongoose.model<IService>('Service', ServiceSchema);