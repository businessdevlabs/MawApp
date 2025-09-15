
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProviderBookings } from '@/hooks/useProvider';
import { useUpdateBookingStatus } from '@/hooks/useProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

const ProviderBookings = () => {
  const [searchParams] = useSearchParams();
  const { data: bookings = [], isLoading } = useProviderBookings();
  const updateBookingStatus = useUpdateBookingStatus();
  const { toast } = useToast();
  
  // Get the tab from URL params, default to 'all'
  const defaultTab = searchParams.get('tab') || 'all';

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus.mutateAsync({ id: bookingId, status });
      toast({
        title: "Booking updated",
        description: `Booking status updated to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    }
  };

  const filterBookings = (filter: string) => {
    switch (filter) {
      case 'today':
        return bookings.filter(booking =>
          isToday(new Date(booking.appointmentDate)) &&
          booking.status !== 'cancelled' &&
          booking.status !== 'no_show'
        );
      case 'upcoming':
        return bookings.filter(booking =>
          new Date(booking.appointmentDate) > new Date() &&
          !isToday(new Date(booking.appointmentDate)) &&
          booking.status !== 'cancelled' &&
          booking.status !== 'no_show'
        );
      case 'past':
        return bookings.filter(booking => isPast(new Date(booking.appointmentDate)));
      case 'completed':
        return bookings.filter(booking => booking.status === 'completed');
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled' || booking.status === 'no_show');
      default:
        return bookings;
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold">{booking.clientId?.fullName || 'Unknown Client'}</h3>
              <Badge 
                variant={
                  booking.status === 'confirmed' ? 'default' :
                  booking.status === 'pending' ? 'secondary' :
                  booking.status === 'completed' ? 'default' :
                  booking.status === 'cancelled' ? 'destructive' :
                  booking.status === 'no_show' ? 'destructive' :
                  'outline'
                }
                className={
                  booking.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                  booking.status === 'cancelled' || booking.status === 'no_show' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                  ''
                }
              >
                {booking.status === 'no_show' ? 'No Show' : 
                 booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(booking.appointmentDate), 'EEEE, MMMM do, yyyy')}
                  {isToday(new Date(booking.appointmentDate)) && ' (Today)'}
                  {isTomorrow(new Date(booking.appointmentDate)) && ' (Tomorrow)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{booking.startTime} ({booking.durationMinutes} min)</span>
              </div>
              <div className="font-medium">
                Service: {booking.serviceId?.name}
              </div>
              {booking.clientId?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{booking.clientId.phone}</span>
                </div>
              )}
              {booking.clientId?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{booking.clientId.email}</span>
                </div>
              )}
              {booking.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Notes:</strong> {booking.notes}
                </div>
              )}
            </div>

            <div className="text-lg font-semibold text-green-600">
              ${booking.totalAmount}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {booking.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                  disabled={updateBookingStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                  disabled={updateBookingStatus.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            
            {booking.status === 'confirmed' && !isPast(new Date(booking.appointmentDate)) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate(booking._id, 'completed')}
                  disabled={updateBookingStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate(booking._id, 'no_show')}
                  disabled={updateBookingStatus.isPending}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No Show
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
              <TabsTrigger value="today">Today ({filterBookings('today').length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({filterBookings('upcoming').length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterBookings('completed').length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
              <TabsTrigger value="past">Past ({filterBookings('past').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No bookings yet</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="today" className="space-y-4">
              {filterBookings('today').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No bookings for today</p>
                  </CardContent>
                </Card>
              ) : (
                filterBookings('today').map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {filterBookings('upcoming').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No upcoming bookings</p>
                  </CardContent>
                </Card>
              ) : (
                filterBookings('upcoming').map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filterBookings('completed').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No completed bookings</p>
                  </CardContent>
                </Card>
              ) : (
                filterBookings('completed').map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {filterBookings('cancelled').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No cancelled bookings</p>
                  </CardContent>
                </Card>
              ) : (
                filterBookings('cancelled').map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {filterBookings('past').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No past bookings</p>
                  </CardContent>
                </Card>
              ) : (
                filterBookings('past').map(booking => <BookingCard key={booking._id} booking={booking} />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProviderBookings;
