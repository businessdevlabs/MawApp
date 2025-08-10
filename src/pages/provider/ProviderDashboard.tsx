
import React from 'react';
import { Link } from 'react-router-dom';
import { useProviderProfile, useProviderBookings, useProviderServices } from '@/hooks/useProvider';
import { useProviderSchedule } from '@/hooks/useProviderSchedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, DollarSign, Users, TrendingUp, Star, Store, ArrowRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import ProviderWelcome from '@/components/provider/ProviderWelcome';

const ProviderDashboard = () => {
  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: bookings = [], isLoading: bookingsLoading } = useProviderBookings();
  const { data: services = [], isLoading: servicesLoading } = useProviderServices();
  const { data: schedules = [], isLoading: schedulesLoading } = useProviderSchedule();

  const todayBookings = bookings.filter(booking => isToday(new Date(booking.appointmentDate)));
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.appointmentDate) > new Date() && !isToday(new Date(booking.appointmentDate))
  );
  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const paidCompletedBookings = bookings.filter(booking => 
    booking.status === 'completed' && booking.paymentStatus === 'paid'
  );
  const totalRevenue = paidCompletedBookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0);

  const hasServices = services.length > 0;
  const hasSchedule = schedules.some(s => s.isAvailable);
  const hasProfile = !!(provider && provider.businessName && (
    provider.businessDescription &&
    provider.businessAddress &&
    provider.businessPhone &&
    provider.businessEmail
  ));

  const isLoading = providerLoading || bookingsLoading || servicesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Provider Profile Not Found</h2>
                <p className="text-gray-600">You need to set up your provider profile to access the dashboard.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome screen if setup is not complete
  const isSetupComplete = hasServices && hasSchedule && hasProfile;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {!isSetupComplete ? (
            <ProviderWelcome 
              providerName={provider.businessName || provider.user?.fullName}
              hasServices={hasServices}
              hasSchedule={hasSchedule}
              hasProfile={hasProfile}
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Welcome back, {provider.businessName}!</h1>
                  <p className="text-gray-600">Here's what's happening with your business today.</p>
                </div>
                <Badge 
                  variant={provider.status === 'approved' ? 'default' : 'secondary'}
                  className="text-sm"
                >
                  {provider.status}
                </Badge>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today's Appointments</p>
                        <p className="text-2xl font-bold">{todayBookings.length}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Link to="/provider/bookings?tab=upcoming" className="block">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Upcoming Bookings</p>
                          <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                        </div>
                        <Clock className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/provider/payments" className="block">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="text-2xl font-bold">{provider.rating?.toFixed(1) || 'N/A'}</p>
                      </div>
                      <Star className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Your Services ({services.length})
                    </CardTitle>
                    <Button asChild size="sm">
                      <Link to="/provider/services" className="flex items-center">
                        Manage Services
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-6">
                      <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No services added yet</p>
                      <Button asChild>
                        <Link to="/provider/services">
                          Add Your First Service
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {services.slice(0, 4).map(service => (
                        <div key={service._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.category?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${service.price}</p>
                            <p className="text-sm text-gray-600">{service.duration} min</p>
                          </div>
                          <Badge variant={service.isActive !== false ? "default" : "secondary"}>
                            {service.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                      {services.length > 4 && (
                        <div className="text-center pt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to="/provider/services">
                              View All {services.length} Services
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Today's Schedule and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayBookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
                    ) : (
                      <div className="space-y-3">
                        {todayBookings.slice(0, 5).map(booking => (
                          <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{booking.clientId?.fullName || 'Unknown Client'}</p>
                              <p className="text-sm text-gray-600">{booking.serviceId?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{booking.startTime}</p>
                              <Badge variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map(booking => (
                        <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{booking.clientId?.fullName || 'Unknown Client'}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(booking.appointmentDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${booking.totalAmount}</p>
                            <Badge variant={
                              booking.status === 'completed' ? 'default' :
                              booking.status === 'confirmed' ? 'secondary' :
                              booking.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
