import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ClientSchedule {
  _id: string;
  clientId: string;
  slots: string[];
  createdAt: string;
  updatedAt: string;
}

interface ScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const useClientSchedule = () => {
  return useQuery({
    queryKey: ['clientSchedule'],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/schedule`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client schedule');
      }

      const data = await response.json();
      return data.slots || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateClientSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: string[]) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ slots })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSchedule'] });
    },
  });
};

export const useUpdateClientSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: string[]) => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ slots })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSchedule'] });
    },
  });
};

export const useDeleteClientSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/client/schedule`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientSchedule'] });
    },
  });
};