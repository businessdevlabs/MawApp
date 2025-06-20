
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProviderProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['providerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          user:profiles!service_providers_user_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useProviderBookings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['providerBookings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      // First get the provider record
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerError) throw providerError;
      if (!provider) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(*),
          service:services!bookings_service_id_fkey(*)
        `)
        .eq('provider_id', provider.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useAllProviders = () => {
  return useQuery({
    queryKey: ['allProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          user:profiles!service_providers_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAllBookings = () => {
  return useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(*),
          service:services!bookings_service_id_fkey(*),
          provider:service_providers!bookings_provider_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
