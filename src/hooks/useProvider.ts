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
        const endpoint = `/api/bookings${queryString ? `?${queryString}` : ''}`;

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

export const useAllProviders = () => {
  return useQuery({
    queryKey: ['allProviders'],
    queryFn: async () => {
      return [];
    },
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
      const response = await fetch(`/api/bookings/${id}/status`, {
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
        const endpoint = `/api/provider/payments${queryString ? `?${queryString}` : ''}`;

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