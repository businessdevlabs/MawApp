import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
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
  serviceId: {
    type: String,
    required: true,
    ref: 'Service',
  },
  appointmentDate: {
    type: String,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

BookingSchema.index({ clientId: 1 });
BookingSchema.index({ providerId: 1 });
BookingSchema.index({ serviceId: 1 });
BookingSchema.index({ appointmentDate: 1, appointmentTime: 1 });
BookingSchema.index({ status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);