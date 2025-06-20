
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      business_name?: string;
      business_description?: string;
      business_address?: string;
      business_phone?: string;
      business_email?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('service_providers')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
    },
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
          client:profiles!fk_bookings_client_id(*),
          service:services!fk_bookings_service_id(*)
        `)
        .eq('provider_id', provider.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
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
          user:profiles!fk_service_providers_user_id(*)
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
          client:profiles!fk_bookings_client_id(*),
          service:services!fk_bookings_service_id(*),
          provider:service_providers!fk_bookings_provider_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
