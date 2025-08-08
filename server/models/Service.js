import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxBookingsPerDay: {
    type: Number,
    default: 10,
    min: 1
  },
  requirements: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
serviceSchema.index({ providerId: 1, isActive: 1 });
serviceSchema.index({ category: 1, isActive: 1 });

export default mongoose.model('Service', serviceSchema);