import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export const useProviderSchedule = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-schedule'],
    queryFn: () => apiService.getProviderSchedule(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableSlots = (providerId: string, date: string) => {
  return useQuery({
    queryKey: ['available-slots', providerId, date],
    queryFn: async () => {
      if (!providerId || !date) return [];
      
      return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    },
    enabled: !!providerId && !!date,
  });
};

export const useProviderBlackouts = (providerId?: string) => {
  return useQuery({
    queryKey: ['provider-blackouts', providerId],
    queryFn: async () => {
      return [];
    },
    enabled: !!providerId,
  });
};

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface ScheduleData {
  dayOfWeek: number;
  isAvailable: boolean;
  timeSlots?: TimeSlot[];
  // Legacy fields for backward compatibility
  startTime?: string;
  endTime?: string;
}

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (schedules: ScheduleData[]) => apiService.updateProviderSchedule(schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-schedule'] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (schedules: ScheduleData[]) => apiService.updateProviderSchedule(schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-schedule'] });
    },
  });
};

export const useCreateBlackout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (blackout: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Blackout creation simulated:', blackout);
      return blackout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-blackouts'] });
    },
  });
};