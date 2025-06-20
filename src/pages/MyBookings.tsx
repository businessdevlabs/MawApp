
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, useUpdateBooking } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

const MyBookings = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useBookings(user?.id);
  const updateBooking = useUpdateBooking();
  const { toast } = useToast();

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBooking.mutateAsync({
        id: bookingId,
        updates: { status: 'cancelled' }
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
      pending: { variant: 'secondary' as const, icon: AlertCircle, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' },
      cancelled: { variant: 'destructive' as const, icon: X, color: 'text-red-600' },
      no_show: { variant: 'destructive' as const, icon: X, color: 'text-red-600' },
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
            <Skeleton className="h-8 w-64" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(booking => 
    !isPast(parseISO(`${booking.appointment_date}T${booking.appointment_time}`)) &&
    booking.status !== 'cancelled'
  ) || [];

  const pastBookings = bookings?.filter(booking => 
    isPast(parseISO(`${booking.appointment_date}T${booking.appointment_time}`)) ||
    booking.status === 'cancelled' ||
    booking.status === 'completed'
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">Manage your appointments</p>
          </div>

          {/* Upcoming Bookings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Appointments ({upcomingBookings.length})
            </h2>
            
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-600">Book a service to see your appointments here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.service?.name}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <User className="w-4 h-4" />
                            <span>{booking.provider?.business_name}</span>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || 'pending')}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{format(parseISO(booking.appointment_date), 'EEEE, MMMM do, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{booking.appointment_time} ({booking.duration_minutes} min)</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{booking.provider?.business_address}</span>
                          </div>
                          <div className="text-sm font-medium">
                            Total: ${booking.total_price}
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        </div>
                      )}

                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={updateBooking.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Past Appointments ({pastBookings.length})
            </h2>
            
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                  <p className="text-gray-600">Your completed appointments will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{booking.service?.name}</h3>
                          <div className="flex items-center gap-2 text-gray-600 mt-1">
                            <User className="w-4 h-4" />
                            <span>{booking.provider?.business_name}</span>
                          </div>
                        </div>
                        {getStatusBadge(booking.status || 'completed')}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{format(parseISO(booking.appointment_date), 'EEEE, MMMM do, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{booking.appointment_time} ({booking.duration_minutes} min)</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          Total: ${booking.total_price}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
