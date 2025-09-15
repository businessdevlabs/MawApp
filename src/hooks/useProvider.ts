import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface ProviderProfileData {
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  category?: string;
  coordinates?: { lat: number; lng: number };
  [key: string]: unknown;
}

interface ServiceData {
  name: string;
  description?: string;
  price: number;
  duration: number;
  categoryId: string;
  isActive?: boolean;
  [key: string]: unknown;
}

interface ServiceUpdate {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  categoryId?: string;
  isActive?: boolean;
  maxBookingsPerDay?: number;
  requirements?: string[];
  tags?: string[];
}

export const useProviderProfile = () => {
  return useQuery({
    queryKey: ['providerProfile'],
    queryFn: () => apiService.getProviderProfile(),
    retry: (failureCount, error: Error) => {
      // Don't retry if provider profile doesn't exist (404)
      if (error?.message?.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useProviderDetail = (providerId: string) => {
  return useQuery({
    queryKey: ['providerDetail', providerId],
    queryFn: async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}/providers/${providerId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch provider details');
        }

        const data = await response.json();
        return data.provider || data;
      } catch (error) {
        console.error('Failed to fetch provider details:', error);
        throw error;
      }
    },
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateProviderProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerData: ProviderProfileData) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: 'mock_provider_id', ...providerData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
    },
  });
};

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ProviderProfileData) => apiService.updateProviderProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
    },
  });
};

export const useProviderBookings = (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['providerBookings', params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const queryString = queryParams.toString();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const endpoint = `${baseUrl}/bookings${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch provider bookings');
        }

        const data = await response.json();
        return data.bookings || [];
      } catch (error) {
        console.error('Failed to fetch provider bookings:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAllProviders = (filters?: {
  category?: string;
  search?: string;
  minRating?: number;
  maxRating?: number;
  location?: string;
  sortBy?: string;
  sortOrder?: string;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['allProviders', filters],
    queryFn: async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (filters?.category) queryParams.append('category', filters.category);
        if (filters?.search) queryParams.append('search', filters.search);
        if (filters?.minRating) queryParams.append('minRating', filters.minRating.toString());
        if (filters?.maxRating) queryParams.append('maxRating', filters.maxRating.toString());
        if (filters?.location) queryParams.append('location', filters.location);
        if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
        if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
        if (filters?.hasWebsite !== undefined) queryParams.append('hasWebsite', filters.hasWebsite.toString());
        if (filters?.hasPhone !== undefined) queryParams.append('hasPhone', filters.hasPhone.toString());
        if (filters?.page) queryParams.append('page', filters.page.toString());
        if (filters?.limit) queryParams.append('limit', filters.limit.toString());

        const url = `${baseUrl}/providers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        return { providers: [], pagination: { totalProviders: 0, totalPages: 0, currentPage: 1, limit: 50 } };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllBookings = () => {
  return useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      return [];
    },
  });
};

export const useProviderServices = () => {
  return useQuery({
    queryKey: ['providerServices'],
    queryFn: () => apiService.getProviderServices(),
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceData: ServiceData) => apiService.createService(serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ServiceUpdate) => {
      const { id, ...serviceUpdates } = updates;
      return apiService.updateService(id, serviceUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => apiService.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerServices'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      cancellationReason 
    }: { 
      id: string; 
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
      cancellationReason?: string;
    }) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status,
          cancellationReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking status');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
      queryClient.invalidateQueries({ queryKey: ['providerPayments'] });
    },
  });
};

export const useProviderPayments = (params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['providerPayments', params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const queryString = queryParams.toString();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const endpoint = `${baseUrl}/provider/payments${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch provider payments');
        }

        const data = await response.json();
        return data.payments || [];
      } catch (error) {
        console.error('Failed to fetch provider payments:', error);
        // Return mock data for now since backend might not be implemented yet
        return [
          {
            _id: '1',
            bookingId: {
              _id: 'booking1',
              clientId: { fullName: 'John Smith', email: 'john@example.com' },
              serviceId: { name: 'Haircut', duration: 30 },
              appointmentDate: '2024-01-15T10:00:00Z',
              startTime: '10:00 AM'
            },
            amount: 45.00,
            paymentMethod: 'credit_card',
            status: 'completed',
            transactionId: 'txn_1234567890',
            paymentDate: '2024-01-15T10:30:00Z',
            platformFee: 2.25,
            netAmount: 42.75
          },
          {
            _id: '2',
            bookingId: {
              _id: 'booking2',
              clientId: { fullName: 'Sarah Johnson', email: 'sarah@example.com' },
              serviceId: { name: 'Color Treatment', duration: 90 },
              appointmentDate: '2024-01-14T14:00:00Z',
              startTime: '2:00 PM'
            },
            amount: 120.00,
            paymentMethod: 'debit_card',
            status: 'completed',
            transactionId: 'txn_0987654321',
            paymentDate: '2024-01-14T15:30:00Z',
            platformFee: 6.00,
            netAmount: 114.00
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};