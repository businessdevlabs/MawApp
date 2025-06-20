
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
          provider:service_providers!fk_services_provider_id(*),
          category:service_categories!fk_services_category_id(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error('Service ID is required');
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:service_providers!fk_services_provider_id(*),
          category:service_categories!fk_services_category_id(*)
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
};
