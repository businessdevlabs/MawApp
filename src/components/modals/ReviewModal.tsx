import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import apiService, { Review } from '@/services/api';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  /** Pre-fill with an existing review for editing */
  existingReview?: Review | null;
  onReviewSubmitted: (review: Review) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  providerId,
  providerName,
  existingReview,
  onReviewSubmitted,
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);

  // Sync when existing review changes (e.g. modal reopened with edit data)
  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? '');
  }, [existingReview, open]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a star rating', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const review = await apiService.submitReview(providerId, rating, comment.trim() || undefined);
      toast({ title: existingReview ? 'Review updated' : 'Review submitted', description: 'Thank you for your feedback!' });
      onReviewSubmitted(review);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingReview ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Reviewing <span className="font-medium">{providerName}</span>
          </p>

          {/* Star rating */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <Star
                    style={{
                      fontSize: 36,
                      color: star <= (hovered || rating) ? '#f59e0b' : '#d1d5db',
                      transition: 'color 0.1s',
                    }}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-sm text-amber-600 font-medium mt-1">
                {labels[hovered || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Your review <span className="font-normal text-gray-400">(optional)</span></p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this business..."
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            style={{ backgroundColor: '#025bae' }}
            className="hover:opacity-90"
          >
            {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
