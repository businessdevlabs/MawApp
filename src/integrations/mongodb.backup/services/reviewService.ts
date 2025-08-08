import { Review, type IReview } from '../models/Review';
import { ProviderService } from './providerService';

export interface CreateReviewData {
  clientId: string;
  providerId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export class ReviewService {
  static async createReview(data: CreateReviewData): Promise<IReview> {
    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId: data.bookingId });
    if (existingReview) {
      throw new Error('Review already exists for this booking');
    }

    const review = new Review(data);
    await review.save();

    // Update provider rating
    await this.updateProviderRating(data.providerId);

    return review;
  }

  static async getReviewById(reviewId: string): Promise<IReview | null> {
    return Review.findById(reviewId);
  }

  static async getReviewsByProvider(providerId: string): Promise<IReview[]> {
    return Review.find({ providerId }).sort({ createdAt: -1 });
  }

  static async getReviewsByClient(clientId: string): Promise<IReview[]> {
    return Review.find({ clientId }).sort({ createdAt: -1 });
  }

  static async getReviewByBooking(bookingId: string): Promise<IReview | null> {
    return Review.findOne({ bookingId });
  }

  static async updateReview(
    reviewId: string,
    updates: { rating?: number; comment?: string }
  ): Promise<IReview | null> {
    const review = await Review.findByIdAndUpdate(reviewId, updates, { new: true });
    
    if (review && updates.rating) {
      // Update provider rating if rating changed
      await this.updateProviderRating(review.providerId);
    }

    return review;
  }

  static async deleteReview(reviewId: string): Promise<boolean> {
    const review = await Review.findById(reviewId);
    if (!review) return false;

    await Review.findByIdAndDelete(reviewId);
    
    // Update provider rating after deletion
    await this.updateProviderRating(review.providerId);

    return true;
  }

  static async getProviderRatingStats(providerId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await Review.find({ providerId });
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Number((totalRating / reviews.length).toFixed(1));

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  private static async updateProviderRating(providerId: string): Promise<void> {
    const stats = await this.getProviderRatingStats(providerId);
    await ProviderService.updateProvider(providerId, {
      rating: stats.averageRating,
      totalReviews: stats.totalReviews
    });
  }
}