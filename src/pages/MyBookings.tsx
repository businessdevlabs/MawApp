
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, useUpdateBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ReviewModal from '@/components/modals/ReviewModal';
import {
  CalendarToday,
  Schedule,
  Close,
  CheckCircle,
  Warning,
  RateReview,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bookings, isLoading, refetch } = useBookings();
  const updateBooking = useUpdateBooking();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    providerId: string;
    providerName: string;
  }>({ open: false, providerId: '', providerName: '' });

  const [reviewedProviderIds, setReviewedProviderIds] = useState<Set<string>>(new Set());

  const openReviewModal = (booking: { provider?: { id?: string; business_name?: string } }) => {
    setReviewModal({
      open: true,
      providerId: booking.provider?.id || '',
      providerName: booking.provider?.business_name || 'Provider',
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBooking.mutateAsync({ id: bookingId, status: 'cancelled' });
      toast({
        title: 'Booking Cancelled',
        description: 'Your appointment has been cancelled successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending:   { variant: 'secondary' as const,    icon: Warning },
      confirmed: { variant: 'default' as const,      icon: CheckCircle },
      completed: { variant: 'outline' as const,      icon: CheckCircle },
      cancelled: { variant: 'destructive' as const,  icon: Close },
      no_show:   { variant: 'destructive' as const,  icon: Close },
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

  // BOOK-006: Updated loading skeleton — matches text header + tabs + card layout
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-16 w-20 rounded-lg" />
                <Skeleton className="h-16 w-20 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-10 w-80 mb-6" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(booking => {
    const appointmentDateTime = parseISO(`${booking.appointment_date}T${booking.appointment_time}`);
    const now = new Date();
    return (
      appointmentDateTime >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) &&
      booking.status !== 'completed' &&
      booking.status !== 'cancelled' &&
      booking.status !== 'no_show'
    );
  }) || [];

  const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled' || b.status === 'no_show') || [];

  type Booking = (typeof upcomingBookings)[number];

  // BOOK-003: Modern white rounded card — replaces border-l-4 pattern
  const renderBookingCard = (booking: Booking, showCancel: boolean, showReview: boolean) => (
    <div key={booking.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-150">
      {/* Row 1: Status badge + date */}
      <div className="flex items-center justify-between mb-3">
        {getStatusBadge(booking.status)}
        <span className="text-sm text-gray-500">
          {format(parseISO(booking.appointment_date), 'EEE, MMM d, yyyy')}
        </span>
      </div>

      {/* Row 2: Service name */}
      <h3 className="font-semibold text-gray-900 text-base mb-1">{booking.service?.name}</h3>

      {/* Row 3: Provider link */}
      <p className="text-sm text-gray-500 mb-3">
        <Link to={`/provider/${booking.provider?.id}`} className="text-primary hover:underline">
          {booking.provider?.business_name}
        </Link>
      </p>

      {/* Row 4: Time + price + action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Schedule className="w-4 h-4 text-gray-400" />
            {booking.appointment_time}
          </span>
          <span className="font-medium text-gray-900">${booking.total_price}</span>
        </div>

        <div className="flex gap-2">
          {/* BOOK-002 cancel button — upcoming only, pending status only */}
          {showCancel && booking.status === 'pending' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={updateBooking.isPending} className="text-xs">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancelBooking(booking.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Confirm Cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* BOOK-004 review + book again — completed only */}
          {showReview && (
            <>
              {booking.provider?.id && !reviewedProviderIds.has(booking.provider.id) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => openReviewModal(booking)}
                >
                  <RateReview className="w-3 h-3 mr-1" />
                  Leave Review
                </Button>
              )}
              {booking.provider?.id && reviewedProviderIds.has(booking.provider.id) && (
                <span className="text-xs text-green-600 font-medium">Reviewed ✓</span>
              )}
              {booking.provider?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => navigate(`/provider/${booking.provider?.id}`)}
                >
                  Book Again
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes — neutral gray instead of blue-50 border-l-2 */}
      {booking.notes && (
        <div className="mt-3 px-3 py-2 bg-gray-50 rounded-md text-xs text-gray-600">
          <strong>Notes:</strong> {booking.notes}
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'upcoming' as const,  label: 'Upcoming',  count: upcomingBookings.length },
    { id: 'completed' as const, label: 'Completed', count: completedBookings.length },
    { id: 'cancelled' as const, label: 'Cancelled', count: cancelledBookings.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {/* BOOK-001: Clean text header — no blue card, no avatar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your appointments and service history</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-gray-700">{completedBookings.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>

          {/* BOOK-002: Tab bar — replaces the two blue section cards */}
          <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-3">
            {/* Upcoming */}
            {activeTab === 'upcoming' && (
              upcomingBookings.length === 0 ? (
                // BOOK-005: actionable empty state
                <div className="py-12 text-center">
                  <CalendarToday className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No upcoming appointments</h3>
                  <p className="text-sm text-gray-500 mb-4">Browse our services to find a mechanic near you</p>
                  <Button onClick={() => navigate('/services')} className="bg-primary hover:bg-primary/90">
                    Browse Services
                  </Button>
                </div>
              ) : (
                upcomingBookings.map(booking => renderBookingCard(booking, true, false))
              )
            )}

            {/* Completed */}
            {activeTab === 'completed' && (
              completedBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No completed services yet</h3>
                  <p className="text-sm text-gray-500">Your service history will appear here after your first visit</p>
                </div>
              ) : (
                completedBookings.map(booking => renderBookingCard(booking, false, true))
              )
            )}

            {/* Cancelled */}
            {activeTab === 'cancelled' && (
              cancelledBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <Close className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No cancelled bookings</h3>
                  <p className="text-sm text-gray-500">That's a good sign — keep it up!</p>
                </div>
              ) : (
                cancelledBookings.map(booking => renderBookingCard(booking, false, false))
              )
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        open={reviewModal.open}
        onClose={() => setReviewModal(prev => ({ ...prev, open: false }))}
        providerId={reviewModal.providerId}
        providerName={reviewModal.providerName}
        onReviewSubmitted={() => {
          setReviewedProviderIds(prev => new Set([...prev, reviewModal.providerId]));
          refetch?.();
        }}
      />
    </div>
  );
};

export default MyBookings;
