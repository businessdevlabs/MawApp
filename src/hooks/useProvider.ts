
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProviderProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['provider-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useProviderBookings = () => {
  const { data: provider } = useProviderProfile();
  
  return useQuery({
    queryKey: ['provider-bookings', provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, duration_minutes),
          client:profiles!client_id(full_name, phone, email)
        `)
        .eq('provider_id', provider.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });
};

// Simplified earnings hook - will return empty array until new tables are in types
export const useProviderEarnings = () => {
  const { data: provider } = useProviderProfile();
  
  return useQuery({
    queryKey: ['provider-earnings', provider?.id],
    queryFn: async () => {
      // Return empty array for now since provider_earnings table isn't in types yet
      return [];
    },
    enabled: !!provider?.id,
  });
};

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: any) => {
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
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
    },
  });
};
