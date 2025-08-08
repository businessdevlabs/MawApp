import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  clientId: string;
  providerId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  clientId: {
    type: String,
    required: true,
    ref: 'User',
  },
  providerId: {
    type: String,
    required: true,
    ref: 'ServiceProvider',
  },
  bookingId: {
    type: String,
    required: true,
    ref: 'Booking',
    unique: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

ReviewSchema.index({ clientId: 1 });
ReviewSchema.index({ providerId: 1 });
ReviewSchema.index({ bookingId: 1 });
ReviewSchema.index({ rating: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);