import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface UseServicesFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  page?: number;
  limit?: number;
}

export const useServices = (filters?: UseServicesFilters) => {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => apiService.getAllServices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => apiService.getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useServicesByCategory = (
  categoryId: string,
  params?: {
    search?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['services', 'category', categoryId, params],
    queryFn: () => apiService.getServicesByCategory(categoryId, params),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};