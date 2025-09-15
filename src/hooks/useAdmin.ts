import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
interface AdminStats {
  totalClients: number;
  totalProviders: number;
  pendingProviders: number;
  approvedProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'client' | 'provider' | 'admin';
  isActive: boolean;
  suspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  _id: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  statusUpdatedAt?: string;
  statusReason?: string;
  createdAt: string;
  userId: User;
}

interface RecentBooking {
  _id: string;
  clientId: User;
  providerId: Provider;
  serviceId: {
    _id: string;
    name: string;
    price: number;
  };
  status: string;
  totalAmount: number;
  appointmentDate: string;
  createdAt: string;
}

// Helper function for authenticated requests
const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Admin stats hook
export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => makeAuthenticatedRequest('/admin/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Users management hooks
export const useAdminUsers = (params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.role) queryParams.append('role', params.role);
  if (params?.search) queryParams.append('search', params.search);

  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => makeAuthenticatedRequest(`/admin/users?${queryParams.toString()}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Providers management hooks
export const useAdminProviders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  return useQuery({
    queryKey: ['admin-providers', params],
    queryFn: () => makeAuthenticatedRequest(`/admin/providers?${queryParams.toString()}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Recent bookings hook
export const useAdminRecentBookings = (limit: number = 10) => {
  return useQuery<{ bookings: RecentBooking[] }>({
    queryKey: ['admin-recent-bookings', limit],
    queryFn: () => makeAuthenticatedRequest(`/admin/bookings/recent?limit=${limit}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Analytics hook
export const useAdminAnalytics = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  return useQuery({
    queryKey: ['admin-analytics', params],
    queryFn: () => makeAuthenticatedRequest(`/admin/analytics?${queryParams.toString()}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      makeAuthenticatedRequest(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
};

export const useUpdateProviderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, status, reason }: { 
      providerId: string; 
      status: string; 
      reason?: string; 
    }) =>
      makeAuthenticatedRequest(`/admin/providers/${providerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, suspended, reason }: { 
      userId: string; 
      suspended: boolean; 
      reason?: string; 
    }) =>
      makeAuthenticatedRequest(`/admin/users/${userId}/suspend`, {
        method: 'PUT',
        body: JSON.stringify({ suspended, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      makeAuthenticatedRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
};