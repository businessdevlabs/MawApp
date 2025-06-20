
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProviderSchedule = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-schedule', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week');

      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useProviderBlackouts = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-blackouts', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('provider_blackouts')
        .select('*')
        .eq('provider_id', providerId)
        .order('start_date');

      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedule: any) => {
      const { data, error } = await supabase
        .from('provider_schedules')
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-schedule'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('provider_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-schedule'] });
    },
  });
};

export const useCreateBlackout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (blackout: any) => {
      const { data, error } = await supabase
        .from('provider_blackouts')
        .insert(blackout)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-blackouts'] });
    },
  });
};
