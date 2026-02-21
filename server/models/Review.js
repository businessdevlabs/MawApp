import mongoose from 'mongoose';
import ServiceProvider from './ServiceProvider.js';

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, { timestamps: true });

// One review per client per provider
reviewSchema.index({ clientId: 1, providerId: 1 }, { unique: true });
reviewSchema.index({ providerId: 1, createdAt: -1 });

// Recalculate provider averageRating and totalReviews after each save
reviewSchema.post('save', async function () {
  try {
    const result = await mongoose.model('Review').aggregate([
      { $match: { providerId: this.providerId } },
      { $group: { _id: '$providerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (result.length > 0) {
      await ServiceProvider.findByIdAndUpdate(this.providerId, {
        averageRating: parseFloat(result[0].avg.toFixed(2)),
        totalReviews: result[0].count
      });
    }
  } catch (err) {
    console.error('Failed to update provider rating:', err);
  }
});

export default mongoose.model('Review', reviewSchema);
