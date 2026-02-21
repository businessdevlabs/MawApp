import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews — submit or update a review for a provider (one per client per provider)
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { providerId, rating, comment, bookingId } = req.body;

    if (!providerId || !rating) {
      return res.status(400).json({ error: 'providerId and rating are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ error: 'Invalid providerId' });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    // Upsert: update existing review or create new one
    const review = await Review.findOneAndUpdate(
      { clientId: req.user._id, providerId },
      {
        rating: Number(rating),
        comment: comment?.trim() || '',
        ...(bookingId && mongoose.Types.ObjectId.isValid(bookingId) ? { bookingId } : {})
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews/provider/:providerId — public, list reviews for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.providerId)) {
      return res.status(400).json({ error: 'Invalid providerId' });
    }

    const reviews = await Review.find({ providerId: req.params.providerId })
      .populate('clientId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    const agg = await Review.aggregate([
      { $match: { providerId: new mongoose.Types.ObjectId(req.params.providerId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const averageRating = agg[0] ? parseFloat(agg[0].avg.toFixed(2)) : 0;
    const totalReviews = agg[0] ? agg[0].count : 0;

    res.json({ reviews, averageRating, totalReviews });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/my/:providerId — check if current client already reviewed this provider
router.get('/my/:providerId', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.providerId)) {
      return res.status(400).json({ error: 'Invalid providerId' });
    }
    const review = await Review.findOne({
      clientId: req.user._id,
      providerId: req.params.providerId
    });
    res.json({ review: review || null });
  } catch (error) {
    console.error('Get my review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

export default router;
