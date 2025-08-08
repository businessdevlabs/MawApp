import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'client' | 'provider' | 'admin';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client',
  },
  avatarUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);