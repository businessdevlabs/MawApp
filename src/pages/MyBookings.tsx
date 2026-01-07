
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, useUpdateBooking } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarToday,
  Schedule,
  LocationOn,
  Person,
  Close,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { format, parseISO, isPast } from 'date-fns';

const MyBookings = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useBookings();
  const updateBooking = useUpdateBooking();
  const { toast } = useToast();

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBooking.mutateAsync({
        id: bookingId,
        status: 'cancelled'
      });
      
      toast({
        title: "Booking Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Warning, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' },
      cancelled: { variant: 'destructive' as const, icon: Close, color: 'text-red-600' },
      no_show: { variant: 'destructive' as const, icon: Close, color: 'text-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your bookings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <Card className="shadow-sm border-0 overflow-hidden">
              <div className="px-6 py-4" style={{backgroundColor: '#025bae'}}>
                <Skeleton className="h-8 w-48 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/10 mt-2" />
              </div>
            </Card>

            {/* Content Skeletons */}
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-sm border-0 overflow-hidden">
                <div className="px-6 py-3" style={{backgroundColor: '#025bae'}}>
                  <Skeleton className="h-6 w-40 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/10 mt-1" />
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Card className="shadow-sm border border-gray-100">
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(booking => {
    const appointmentDateTime = parseISO(`${booking.appointment_date}T${booking.appointment_time}`);
    const now = new Date();

    // Show appointments that are not completed and are today or in the future
    return (appointmentDateTime >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
            booking.status !== 'completed' &&
            booking.status !== 'cancelled' &&
            booking.status !== 'no_show');
  }) || [];

  const completedBookings = bookings?.filter(booking =>
    booking.status === 'completed'
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={user?.profilePhoto}
                      alt={user?.fullName || user?.email}
                    />
                    <AvatarFallback className="bg-white/20 text-white text-lg font-semibold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>
                      My Bookings
                    </h1>
                    <p className="text-white/80">Manage your appointments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                    {upcomingBookings.length} Upcoming
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {completedBookings.length} Completed
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Upcoming Bookings */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <h2 className="text-lg font-semibold">Upcoming Appointments ({upcomingBookings.length})</h2>
              <p className="text-white/80 text-sm">Your scheduled appointments</p>
            </div>
            <CardContent className="p-6">
            
              {upcomingBookings.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarToday className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-600">Book a service to see your appointments here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors" style={{borderLeftColor: '#025bae'}}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: booking.status === 'pending' ? '#f59e0b' : '#025bae'
                            }}
                          ></div>
                          <span
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{
                              color: booking.status === 'pending' ? '#f59e0b' : '#025bae'
                            }}
                          >
                            {booking.status === 'confirmed' ? 'Confirmed' :
                             booking.status === 'pending' ? 'Pending' : booking.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(booking.appointment_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900">{booking.service?.name}</h3>
                        <p className="text-sm text-gray-600">
                          with{' '}
                          <Link
                            to={`/provider/${booking.provider?.id}`}
                            className="font-medium hover:underline"
                            style={{color: '#025bae'}}
                          >
                            {booking.provider?.business_name}
                          </Link>
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center gap-1">
                            <Schedule className="w-4 h-4" style={{color: '#025bae'}} />
                            <span>{booking.appointment_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">${booking.total_price}</span>
                          </div>
                        </div>

                        {booking.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={updateBooking.isPending}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-2 bg-blue-50 border-l-2" style={{borderLeftColor: '#025bae'}}>
                          <p className="text-xs text-gray-600">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Bookings */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <h2 className="text-lg font-semibold">Completed Appointments ({completedBookings.length})</h2>
              <p className="text-white/80 text-sm">Your completed appointments</p>
            </div>
            <CardContent className="p-6">

              {completedBookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Schedule className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed appointments</h3>
                  <p className="text-gray-600">Your completed appointments will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors opacity-75" style={{borderLeftColor: '#10b981'}}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium uppercase tracking-wide text-green-600">
                            Completed
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(parseISO(booking.appointment_date), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900">{booking.service?.name}</h3>
                        <p className="text-sm text-gray-600">
                          with{' '}
                          <Link
                            to={`/provider/${booking.provider?.id}`}
                            className="font-medium hover:underline"
                            style={{color: '#025bae'}}
                          >
                            {booking.provider?.business_name}
                          </Link>
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Schedule className="w-4 h-4 text-green-500" />
                          <span>{booking.appointment_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">${booking.total_price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
