import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ClientProfile {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: string;
  avatarUrl?: string;
  schedule: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientProfileUpdate {
  fullName?: string;
  phone?: string;
  address?: string;
  schedule?: string[];
}

export const useClientProfile = () => {
  return useQuery({
    queryKey: ['clientProfile'],
    queryFn: async (): Promise<ClientProfile> => {
      const token = localStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No valid authentication token available');
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('authToken');
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error('Failed to fetch client profile');
      }

      const data = await response.json();
      return data.client;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: ClientProfileUpdate): Promise<ClientProfile> => {
      const token = localStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No valid authentication token available');
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('authToken');
          throw new Error('Authentication expired. Please log in again.');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to update client profile');
      }

      const data = await response.json();
      return data.client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientProfile'] });
    },
  });
};