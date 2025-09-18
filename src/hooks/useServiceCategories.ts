import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useServiceCategories = () => {
  return useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => apiService.getServiceCategories(),
  });
};

export const useServiceCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['serviceCategory', categoryId],
    queryFn: () => apiService.getServiceCategory(categoryId),
    enabled: !!categoryId,
  });
};

export const useCreateServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: 'mock_category_id', ...categoryData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
    },
  });
};

export const useUpdateServiceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCategories'] });
    },
  });
};

export const useCategorySubcategories = (categoryId: string) => {
  return useQuery({
    queryKey: ['categorySubcategories', categoryId],
    queryFn: () => apiService.getCategorySubcategories(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};