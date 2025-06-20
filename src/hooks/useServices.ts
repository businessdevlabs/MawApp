
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:service_providers(
            id,
            business_name,
            business_address,
            business_phone,
            rating,
            total_reviews
          ),
          category:service_categories(name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
};

export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:service_providers(
            id,
            business_name,
            business_description,
            business_address,
            business_phone,
            rating,
            total_reviews
          ),
          category:service_categories(name)
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
};
