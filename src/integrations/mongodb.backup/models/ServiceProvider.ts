import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceProvider extends Document {
  _id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating?: number;
  totalReviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceProviderSchema = new Schema<IServiceProvider>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  businessDescription: {
    type: String,
    trim: true,
  },
  businessEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  businessPhone: {
    type: String,
    trim: true,
  },
  businessAddress: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

ServiceProviderSchema.index({ userId: 1 });
ServiceProviderSchema.index({ status: 1 });
ServiceProviderSchema.index({ businessName: 'text' });

export const ServiceProvider = mongoose.model<IServiceProvider>('ServiceProvider', ServiceProviderSchema);