
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminStats, useAdminRecentBookings, useAdminProviders } from '@/hooks/useAdmin';
import { Groups, Store, CalendarToday, AttachMoney, TrendingUp, Warning, CheckCircle, Schedule } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();
  const { data: recentBookingsData } = useAdminRecentBookings(5);
  const { data: pendingProvidersData } = useAdminProviders({ status: 'pending', limit: 10 });

  const recentBookings = recentBookingsData?.bookings || [];
  const pendingProviders = pendingProvidersData?.providers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your platform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
                  </div>
                  <Groups className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Providers</p>
                    <p className="text-2xl font-bold">{stats?.approvedProviders || 0}</p>
                  </div>
                  <Store className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
                  </div>
                  <CalendarToday className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <AttachMoney className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals Alert */}
          {stats?.pendingProviders > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Warning className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Pending Provider Approvals</p>
                      <p className="text-sm text-orange-700">
                        {stats.pendingProviders} provider{stats.pendingProviders > 1 ? 's' : ''} waiting for approval
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    <Link to="/admin/users?tab=pending">Review Applications</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Schedule className="h-5 w-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent bookings</p>
                ) : (
                  <div className="space-y-3">
                    {recentBookings.map(booking => (
                      <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{booking.clientId?.fullName || 'Unknown Client'}</p>
                          <p className="text-sm text-gray-600">{booking.serviceId?.name || 'Unknown Service'}</p>
                          <p className="text-sm text-gray-500">{booking.providerId?.businessName || 'Unknown Provider'}</p>
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
                )}
              </CardContent>
            </Card>

            {/* Pending Provider Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="h-5 w-5" />
                  Pending Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingProviders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending applications</p>
                ) : (
                  <div className="space-y-3">
                    {pendingProviders.map(provider => (
                      <div key={provider._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{provider.businessName}</p>
                          <p className="text-sm text-gray-600">{provider.userId?.fullName}</p>
                          <p className="text-sm text-gray-500">{provider.userId?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link to="/admin/users?tab=pending">Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-16">
                  <Link to="/admin/users" className="flex flex-col items-center gap-2">
                    <Groups className="h-6 w-6" />
                    Manage Users
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16">
                  <Link to="/admin/users?tab=pending" className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Review Applications
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16">
                  <Link to="/admin/settings" className="flex flex-col items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    System Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
