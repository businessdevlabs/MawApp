
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useUpcomingBookings, useRecentActivity } from '@/hooks/useDashboard';
import { useUpdateBooking } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Star, 
  TrendingUp,
  MapPin,
  Plus,
  DollarSign,
  X
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: upcomingBookings = [], isLoading: bookingsLoading } = useUpcomingBookings();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity();
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const isProvider = user.role === 'provider';
  const isAdmin = user.role === 'admin';
  const isLoading = statsLoading || bookingsLoading || activityLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.fullName}!
          </h1>
          <div className="flex items-center space-x-2">
            <Badge variant={isAdmin ? "destructive" : isProvider ? "default" : "secondary"}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{user.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-6 mb-8 ${
          isProvider || isAdmin 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1 max-w-md mx-auto'
        }`}>
          <Card data-testid="total-bookings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.monthlyGrowth?.bookings ? `+${stats.monthlyGrowth.bookings}%` : '+0%'} from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Provider and Admin only cards */}
          {(isProvider || isAdmin) && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${stats?.totalRevenue || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats?.monthlyGrowth?.revenue ? `+${stats.monthlyGrowth.revenue}%` : '+0%'} from last month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clients</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats?.monthlyGrowth?.clients ? `+${stats.monthlyGrowth.clients}` : '+0'} this month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Based on {stats?.totalReviews || 0} reviews
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card data-testid="upcoming-appointments-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Upcoming Appointments
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {isProvider ? 'Add Slot' : 'Book Now'}
                </Button>
              </CardTitle>
              <CardDescription>
                {isProvider ? 'Manage your schedule' : 'Your next appointments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} data-testid="upcoming-booking" className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {isProvider ? booking.clientName : booking.serviceName}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{booking.appointmentDate}, {booking.appointmentTime}</span>
                          {booking.providerName && (
                            <>
                              <MapPin className="w-4 h-4 ml-4 mr-1" />
                              <span>{booking.providerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                          {booking.status}
                        </Badge>
                        {!isProvider && booking.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={updateBooking.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming appointments</p>
                  <p className="text-sm">
                    {isProvider ? 'Your schedule is open' : 'Book your first service'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'booking' ? 'bg-blue-600' :
                        activity.type === 'payment' ? 'bg-green-600' :
                        activity.type === 'review' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Activity will appear here as you use the platform</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
