
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
import { CalendarToday, Schedule, Person, Phone, Email, CheckCircle, Cancel, Warning } from '@mui/icons-material';
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

  const BookingCard = ({ booking }: { booking: any }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed': return 'bg-blue-500';
        case 'pending': return 'bg-amber-500';
        case 'completed': return 'bg-green-500';
        case 'cancelled':
        case 'no_show': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    const getStatusBadge = (status: string) => {
      const badgeClass = status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                         status === 'cancelled' || status === 'no_show' ? 'bg-red-50 text-red-700 border-red-200' :
                         status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                         status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         'bg-gray-50 text-gray-700 border-gray-200';

      return (
        <Badge variant="outline" className={`font-medium ${badgeClass}`}>
          {status === 'no_show' ? 'No Show' : status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    };

    return (
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 border-0">
        {/* Colored Header */}
        <div className={`${getStatusColor(booking.status)} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Person className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.clientId?.fullName || 'Unknown Client'}
                </h3>
                <p className="text-white/80 text-sm">
                  {booking.serviceId?.name || 'Service'}
                </p>
              </div>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Date & Time - More prominent */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarToday className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-gray-900 text-base">
                    {format(new Date(booking.appointmentDate), 'EEEE, MMMM do, yyyy')}
                    {isToday(new Date(booking.appointmentDate)) &&
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Today
                      </span>
                    }
                    {isTomorrow(new Date(booking.appointmentDate)) &&
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Tomorrow
                      </span>
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Schedule className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-700">
                    {booking.startTime} <span className="font-normal text-gray-500">({booking.durationMinutes} min)</span>
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {booking.clientId?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{booking.clientId.phone}</span>
                  </div>
                )}
                {booking.clientId?.email && (
                  <div className="flex items-center gap-2">
                    <Email className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{booking.clientId.email}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-200 rounded-r">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Notes:</span>
                    <p className="text-gray-600 mt-1">{booking.notes}</p>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-green-600">
                  ${booking.totalAmount}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 ml-6">
              {booking.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                    disabled={updateBookingStatus.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shadow-sm"
                    onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                    disabled={updateBookingStatus.isPending}
                  >
                    <Cancel className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}

              {booking.status === 'confirmed' && !isPast(new Date(booking.appointmentDate)) && (
                <>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={() => handleStatusUpdate(booking._id, 'completed')}
                    disabled={updateBookingStatus.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
                    onClick={() => handleStatusUpdate(booking._id, 'no_show')}
                    disabled={updateBookingStatus.isPending}
                  >
                    <Warning className="w-4 h-4 mr-1" />
                    No Show
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
            <TabsList className="grid w-full grid-cols-6 bg-blue-500 border-0 rounded-lg p-1">
              {/* <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">All ({bookings.length})</TabsTrigger> */}
              <TabsTrigger value="today" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">Today ({filterBookings('today').length})</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">Upcoming ({filterBookings('upcoming').length})</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">Completed ({filterBookings('completed').length})</TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium">Past ({filterBookings('past').length})</TabsTrigger>
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
