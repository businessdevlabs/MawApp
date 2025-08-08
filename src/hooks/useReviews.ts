import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useProviderReviews = (providerId: string) => {
  return useQuery({
    queryKey: ['providerReviews', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      // Return mock reviews
      return [
        {
          id: '1',
          clientId: 'client1',
          providerId,
          rating: 5,
          comment: 'Excellent service!',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          clientId: 'client2',
          providerId,
          rating: 4,
          comment: 'Very good experience.',
          createdAt: new Date().toISOString()
        }
      ];
    },
    enabled: !!providerId,
  });
};

export const useClientReviews = () => {
  return useQuery({
    queryKey: ['clientReviews'],
    queryFn: async () => {
      return [];
    },
  });
};

export const useBookingReview = (bookingId: string) => {
  return useQuery({
    queryKey: ['bookingReview', bookingId],
    queryFn: async () => {
      return null;
    },
    enabled: !!bookingId,
  });
};

export const useProviderRatingStats = (providerId: string) => {
  return useQuery({
    queryKey: ['providerRatingStats', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      return {
        averageRating: 4.5,
        totalReviews: 2,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }
      };
    },
    enabled: !!providerId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: 'mock_review_id', ...reviewData };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providerReviews', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['clientReviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookingReview', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['providerRatingStats', variables.providerId] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rating, comment }: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, rating, comment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerReviews'] });
      queryClient.invalidateQueries({ queryKey: ['clientReviews'] });
      queryClient.invalidateQueries({ queryKey: ['providerRatingStats'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerReviews'] });
      queryClient.invalidateQueries({ queryKey: ['clientReviews'] });
      queryClient.invalidateQueries({ queryKey: ['providerRatingStats'] });
    },
  });
};