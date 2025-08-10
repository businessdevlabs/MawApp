import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/bookings', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        
        // Transform the API response to match the expected format
        return data.bookings.map((booking: any) => ({
          id: booking._id,
          appointment_date: booking.appointmentDate.split('T')[0], // Convert to YYYY-MM-DD
          appointment_time: booking.startTime,
          duration_minutes: booking.durationMinutes,
          total_price: booking.totalAmount,
          status: booking.status,
          notes: booking.notes,
          service: {
            name: booking.serviceId?.name,
            description: booking.serviceId?.description,
            price: booking.serviceId?.price
          },
          provider: {
            business_name: booking.providerId?.businessName,
            business_address: booking.providerId?.businessAddress,
            business_phone: booking.providerId?.businessPhone
          }
        }));
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: {
      provider_id: string;
      service_id: string;
      appointment_date: string;
      appointment_time: string;
      duration_minutes: number;
      total_price: number;
      notes?: string;
    }) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          serviceId: bookingData.service_id,
          appointmentDate: bookingData.appointment_date,
          startTime: bookingData.appointment_time,
          notes: bookingData.notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { 
      id: string; 
      status: string;
      cancellationReason?: string;
    }) => {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status,
          cancellationReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update booking');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string; 
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' 
    }) => {
      // Simulate status update
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['providerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
  });
};

export const useAvailableTimeSlots = (providerId: string, date: string) => {
  return useQuery({
    queryKey: ['availableTimeSlots', providerId, date],
    queryFn: async () => {
      // Return mock time slots
      return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    },
    enabled: !!providerId && !!date,
  });
};