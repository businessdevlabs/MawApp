import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalClients: number;
  averageRating: number;
  totalReviews: number;
  monthlyGrowth: {
    bookings: number;
    revenue: number;
    clients: number;
  };
}

interface UpcomingBooking {
  id: string;
  clientName?: string;
  serviceName?: string;
  providerName?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'other';
  message: string;
  timeAgo: string;
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}/bookings/stats`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        return {
          totalBookings: data.totalBookings || 0,
          totalRevenue: data.totalRevenue || data.totalSpent || 0,
          totalClients: data.totalClients || data.favoriteProviders || 0,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          monthlyGrowth: data.monthlyGrowth || {
            bookings: 0,
            revenue: 0,
            clients: 0
          }
        };
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Return empty stats as fallback
        return {
          totalBookings: 0,
          totalRevenue: 0,
          totalClients: 0,
          averageRating: 0,
          totalReviews: 0,
          monthlyGrowth: {
            bookings: 0,
            revenue: 0,
            clients: 0
          }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpcomingBookings = () => {
  return useQuery<UpcomingBooking[]>({
    queryKey: ['upcomingBookings'],
    queryFn: async (): Promise<UpcomingBooking[]> => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}/bookings/upcoming`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming bookings');
        }
        
        const data = await response.json();
        
        // Transform the data to match our interface
        return data.bookings.map((booking: any) => ({
          id: booking._id,
          clientName: booking.clientId?.fullName,
          serviceName: booking.serviceId?.name,
          providerName: booking.providerId?.businessName,
          appointmentDate: new Date(booking.appointmentDate).toLocaleDateString(),
          appointmentTime: booking.startTime,
          status: booking.status
        }));
      } catch (error) {
        console.error('Failed to fetch upcoming bookings:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRecentActivity = () => {
  return useQuery<RecentActivity[]>({
    queryKey: ['recentActivity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${baseUrl}/bookings?limit=5`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recent activity');
        }
        
        const data = await response.json();
        
        // Transform recent bookings into activity items
        return data.bookings.map((booking: any, index: number) => ({
          id: booking._id,
          type: booking.status === 'completed' ? 'booking' : 
                booking.status === 'cancelled' ? 'booking' : 'booking',
          message: `${booking.status === 'completed' ? 'Completed' :
                     booking.status === 'cancelled' ? 'Cancelled' : 'Booked'} ${booking.serviceId?.name} ${booking.providerId?.businessName ? `with ${booking.providerId.businessName}` : ''}`,
          timeAgo: getTimeAgo(new Date(booking.createdAt))
        }));
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Helper function to calculate time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
};