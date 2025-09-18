
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats, useUpcomingBookings, useRecentActivity } from '@/hooks/useDashboard';
import { useUpdateBooking } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarToday,
  Schedule,
  Person,
  Star,
  TrendingUp,
  LocationOn,
  Add,
  AttachMoney,
  Close
} from '@mui/icons-material';

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
        <Card className="shadow-sm border-0 overflow-hidden mb-6">
          <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>
                  Welcome back, {user.fullName}!
                </h1>
                <p className="text-white/80">Your dashboard overview</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  className={`${isAdmin ? "bg-red-500/20 text-red-100 border-red-400/30" :
                              isProvider ? "bg-green-500/20 text-green-100 border-green-400/30" :
                              "bg-blue-500/20 text-blue-100 border-blue-400/30"}`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Person style={{ fontSize: 16, color: '#025bae' }} />
              <span>{user.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card data-testid="upcoming-appointments-card" className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
                  <p className="text-white/80 text-sm">{isProvider ? 'Manage your schedule' : 'Your next appointments'}</p>
                </div>
                {isProvider && <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Add className="w-4 h-4 mr-2" />
                  {isProvider ? 'Add Slot' : 'Book Now'}
                </Button>}
              </div>
            </div>
            <CardContent className="min-h-[400px]">
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
                <div className="space-y-2 mt-5">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} data-testid="upcoming-booking" className="flex items-center justify-between p-3 border-l-4 border-l-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {isProvider ? booking.clientName : booking.serviceName}
                          </h4>
                          <Badge
                            className={`text-xs ${booking.status === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <Schedule style={{ fontSize: 12, color: '#025bae' }} className="mr-1" />
                            <span>{booking.appointmentDate} at {booking.appointmentTime}</span>
                          </div>
                          {booking.providerName && (
                            <div className="flex items-center">
                              <LocationOn style={{ fontSize: 12, color: '#025bae' }} className="mr-1" />
                              <span>{booking.providerName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!isProvider && booking.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={updateBooking.isPending}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0 ml-2"
                        >
                          <Close className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarToday className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming appointments</p>
                  <p className="text-sm">
                    {isProvider ? 'Your schedule is open' : 'Book your first service'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-white/80 text-sm">Latest updates and notifications</p>
            </div>
            <CardContent className="min-h-[400px]">
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
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'booking' ? 'bg-blue-600' :
                            activity.type === 'payment' ? 'bg-green-600' :
                            activity.type === 'review' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }`} style={{
                            backgroundColor: activity.type === 'booking' ? '#025bae' :
                            activity.type === 'payment' ? '#00b894' :
                            activity.type === 'review' ? '#fdcb6e' :
                            '#6c757d'
                          }}></div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {activity.type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{activity.timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed">{activity.message}</p>
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

        {/* Stats Grid */}
        <div className={`grid gap-6 mt-8 ${
          isProvider || isAdmin
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1 max-w-md mx-auto'
        }`}>

          {/* Provider and Admin only cards */}
          {(isProvider || isAdmin) && (
            <>
              <Card className="shadow-sm border-0 overflow-hidden">
                <div className="px-4 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Revenue</h3>
                    <AttachMoney className="h-4 w-4 text-white/80" />
                  </div>
                </div>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" style={{color: '#025bae'}}>${stats?.totalRevenue || 0}</div>
                      <p className="text-xs text-gray-600">
                        {stats?.monthlyGrowth?.revenue ? `+${stats.monthlyGrowth.revenue}%` : '+0%'} from last month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 overflow-hidden">
                <div className="px-4 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Clients</h3>
                    <Person className="h-4 w-4 text-white/80" />
                  </div>
                </div>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" style={{color: '#025bae'}}>{stats?.totalClients || 0}</div>
                      <p className="text-xs text-gray-600">
                        {stats?.monthlyGrowth?.clients ? `+${stats.monthlyGrowth.clients}` : '+0'} this month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 overflow-hidden">
                <div className="px-4 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Average Rating</h3>
                    <Star className="h-4 w-4 text-white/80" />
                  </div>
                </div>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" style={{color: '#025bae'}}>
                        {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                      </div>
                      <p className="text-xs text-gray-600">
                        Based on {stats?.totalReviews || 0} reviews
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
