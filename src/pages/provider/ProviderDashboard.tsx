
import React from 'react';
import { Link } from 'react-router-dom';
import { useProviderProfile, useProviderBookings, useProviderServices } from '@/hooks/useProvider';
import { useProviderSchedule } from '@/hooks/useProviderSchedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MdCalendarToday,
  MdSchedule,
  MdAttachMoney,
  MdStar,
  MdTrendingUp,
  MdStore,
  MdArrowForward
} from 'react-icons/md';
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
              <div className="rounded-lg p-6 text-white" style={{backgroundColor: '#025bae'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="mb-2" style={{fontSize: '24px', fontWeight: 500, fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>Welcome back, {provider.businessName}!</h1>
                    <p className="font-small">Here's what's happening with your business today.</p>
                  </div>
                  <Badge
                    variant={provider.status === 'approved' ? 'default' : 'secondary'}
                    className="text-sm font-bold bg-white text-blue-800"
                  >
                    {provider.status}
                  </Badge>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                      <MdCalendarToday style={{ fontSize: 20, color: '#025bae' }} />
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{todayBookings.length}</p>
                  </CardContent>
                </Card>

                <Link to="/provider/bookings?tab=upcoming" className="block">
                  <Card className="cursor-pointer shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600">Upcoming Bookings</p>
                        <MdSchedule style={{ fontSize: 20, color: '#025bae' }} />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">{upcomingBookings.length}</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/provider/payments" className="block">
                  <Card className="cursor-pointer shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <MdAttachMoney style={{ fontSize: 20, color: '#025bae' }} />
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">${totalRevenue.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="shadow-sm hover:shadow-md transition-shadow border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-600">Rating</p>
                      <MdStar style={{ fontSize: 20, color: '#025bae' }} />
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{provider.rating?.toFixed(1) || 'N/A'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Services Overview */}
              <Card className="shadow-lg">
                <CardHeader className="text-white rounded-t-lg" style={{backgroundColor: '#025bae'}}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3" style={{fontSize: '16px', fontWeight: 600, fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif', letterSpacing: '0.5px'}}>
                      <div className="bg-opacity-20 rounded-full">
                        <MdStore className="text-white" style={{ fontSize: 28 }} />
                      </div>
                      YOUR SERVICES <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif', fontWeight: 600}}>{services.length}</Badge>
                    </CardTitle>
                    <Button asChild size="sm" className="bg-white text-indigo-700 hover:bg-gray-100 font-bold">
                      <Link to="/provider/services" className="flex items-center">
                        Manage Services
                        <MdArrowForward className="ml-1" style={{ fontSize: 16 }} />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {services.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                        <MdStore className="text-gray-400" style={{ fontSize: 48 }} />
                      </div>
                      <p className="text-gray-500 mb-4 font-medium">No services added yet</p>
                      <Button asChild className="font-bold">
                        <Link to="/provider/services">
                          Add Your First Service
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {services.slice(0, 4).map(service => (
                        <div key={service._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 hover:shadow-md transition-shadow" style={{borderLeftColor: '#025bae'}}>
                          <div>
                            <p className="font-bold text-gray-900">{service.name}</p>
                            <p className="text-sm font-medium text-gray-600">{service.category?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-gray-900">${service.price}</p>
                            <p className="text-sm font-medium text-gray-600">{service.duration} min</p>
                          </div>
                          <Badge
                            variant={service.isActive !== false ? "default" : "secondary"}
                            className="font-bold"
                          >
                            {service.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                      {services.length > 4 && (
                        <div className="text-center pt-4">
                          <Button asChild variant="outline" size="sm" className="font-bold">
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
                <Card className="shadow-lg">
                  <CardHeader className="text-white rounded-t-lg" style={{backgroundColor: '#025bae'}}>
                    <CardTitle className="flex items-center gap-3" style={{fontSize: '16px', fontWeight: 600, fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif', letterSpacing: '0.5px'}}>
                      <div className="bg-opacity-20 rounded-full">
                        <MdCalendarToday className="text-white" style={{ fontSize: 24 }} />
                      </div>
                      TODAY'S SCHEDULE
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {todayBookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-8 font-medium">No appointments scheduled for today</p>
                    ) : (
                      <div className="space-y-4">
                        {todayBookings.slice(0, 5).map((booking: any) => (
                          <div key={booking._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-l-4 border-l-emerald-400 hover:shadow-md transition-shadow">
                            <div>
                              <p className="font-bold text-gray-900">{booking.clientId?.fullName || 'Unknown Client'}</p>
                              <p className="text-sm font-medium text-gray-600">{booking.serviceId?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg text-gray-900">{booking.startTime}</p>
                              <Badge
                                variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'pending' ? 'secondary' : 'destructive'
                                }
                                className="font-bold"
                              >
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
                <Card className="shadow-lg">
                  <CardHeader className="text-white rounded-t-lg" style={{backgroundColor: '#025bae'}}>
                    <CardTitle className="flex items-center gap-3" style={{fontSize: '16px', fontWeight: 600, fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif', letterSpacing: '0.5px'}}>
                      <div className="bg-opacity-20 rounded-full">
                        <MdTrendingUp className="text-white" style={{ fontSize: 24 }} />
                      </div>
                      RECENT ACTIVITY
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking: any) => (
                        <div key={booking._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border-l-4 border-l-orange-400 hover:shadow-md transition-shadow">
                          <div>
                            <p className="font-bold text-gray-900">{booking.clientId?.fullName || 'Unknown Client'}</p>
                            <p className="text-sm font-medium text-gray-600">
                              {format(new Date(booking.appointmentDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-gray-900">${booking.totalAmount}</p>
                            <Badge
                              variant={
                                booking.status === 'completed' ? 'default' :
                                booking.status === 'confirmed' ? 'secondary' :
                                booking.status === 'pending' ? 'outline' : 'destructive'
                              }
                              className="font-bold"
                            >
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
