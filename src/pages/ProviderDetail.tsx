import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useProviderDetail } from '@/hooks/useProvider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { Review } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ReviewModal from '@/components/modals/ReviewModal';
import {
  LocationOn,
  Phone,
  Language,
  Star,
  Schedule,
  Groups,
  CalendarToday,
  Chat,
  RateReview,
  Edit
} from '@mui/icons-material';

const ProviderDetail = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data: provider, isLoading, error } = useProviderDetail(providerId || '');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  const loadReviews = () => {
    if (!providerId) return;
    apiService.getProviderReviews(providerId).then(({ reviews: r, averageRating, totalReviews: t }) => {
      setReviews(r);
      setAvgRating(averageRating);
      setTotalReviews(t);
    }).catch(() => {});
  };

  useEffect(() => {
    loadReviews();
  }, [providerId]);

  // Check if the logged-in client already reviewed this provider
  useEffect(() => {
    if (!providerId || profile?.role !== 'client') return;
    apiService.getMyReviewForProvider(providerId).then(setMyReview).catch(() => {});
  }, [providerId, profile?.role]);

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (profile?.role !== 'client') {
      toast({ title: 'Only clients can message providers', variant: 'destructive' });
      return;
    }
    setMessagingLoading(true);
    try {
      const conversation = await apiService.getOrCreateConversation(providerId!);
      navigate(`/messages?conversation=${conversation._id}`);
    } catch {
      toast({ title: 'Could not open conversation', variant: 'destructive' });
    } finally {
      setMessagingLoading(false);
    }
  };

  // Helper function to ensure URL has proper protocol
  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Handler for booking a service
  const handleBookService = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  if (!providerId) {
    return <Navigate to="/providers" replace />;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h1>
            <p className="text-gray-600">The provider you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Provider Header Card */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {provider.profilePhoto ? (
                    <img
                      src={provider.profilePhoto}
                      alt={provider.businessName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-semibold text-xl">
                        {provider.businessName?.charAt(0)?.toUpperCase() || 'P'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-semibold">{provider.businessName || 'Business Name'}</h1>
                    <p className="text-white/80">{typeof provider.category === 'string' ? provider.category : provider.category?.name || 'General Services'}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center text-white/90">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-lg font-semibold">
                      {avgRating > 0 ? avgRating.toFixed(1) : (totalReviews === 0 ? 'New' : String(provider.averageRating || 0))}
                    </span>
                  </div>
                  <div className="text-white/80 text-sm">({totalReviews} reviews)</div>
                  {user && profile?.role === 'client' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/20 bg-white/10 mt-1"
                      onClick={handleMessage}
                      disabled={messagingLoading}
                    >
                      <Chat className="w-4 h-4 mr-1" />
                      {messagingLoading ? '...' : 'Message'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <LocationOn style={{ fontSize: 16, color: '#025bae' }} />
                  <span className="text-sm text-gray-900 truncate">{provider.businessAddress || 'Location not specified'}</span>
                </div>
                {provider.businessPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone style={{ fontSize: 16, color: '#025bae' }} />
                    <span className="text-sm text-gray-900">{provider.businessPhone}</span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center space-x-2">
                    <Language style={{ fontSize: 16, color: '#025bae' }} />
                    <a
                      href={formatWebsiteUrl(provider.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-900 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {provider.businessDescription && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">About this business</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{provider.businessDescription}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {typeof provider.category === 'string' ? provider.category : provider.category?.name || 'General Services'}
                  </Badge>
                  {provider.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {typeof provider.subcategory === 'string' ? provider.subcategory : provider.subcategory?.name || ''}
                    </Badge>
                  )}
                </div>
                {(provider as { isVerified?: boolean }).isVerified === true && (
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Verified Provider
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <h2 className="text-lg font-semibold">Services ({String(provider.services?.length || 0)})</h2>
            </div>
            <CardContent className="p-6">
              {provider.services && provider.services.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {provider.services.map((service: any) => (
                    <Card key={service._id} className="shadow-sm border-0 overflow-hidden">
                      <div className="px-4 py-2 text-white" style={{backgroundColor: '#4a90e2'}}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{service.name}</h3>
                          <div className="text-lg font-bold">
                            ${String(service.price || '0')}
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Schedule style={{ fontSize: 16, color: '#025bae' }} />
                            <span className="text-sm text-gray-900">{String(service.duration || 0)} minutes</span>
                          </div>
                          <Button
                            size="sm"
                            style={{backgroundColor: '#025bae'}}
                            className="hover:opacity-90"
                            onClick={() => handleBookService(service._id)}
                          >
                            <CalendarToday className="w-4 h-4 mr-1" />
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Groups className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services available at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          {provider.businessHours && (
            <Card className='p-8'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Schedule className="w-5 h-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map((day) => {
                    const hours = provider.businessHours?.[day] as { open?: string; close?: string; isOpen?: boolean } | undefined;
                    const formatTime = (t?: string) => {
                      if (!t) return '';
                      const [h, m] = t.split(':').map(Number);
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const hour = h % 12 || 12;
                      return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
                    };
                    return (
                      <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="capitalize font-medium text-gray-800">{day}</span>
                        {hours?.isOpen
                          ? <span className="text-gray-700">{formatTime(hours.open)} – {formatTime(hours.close)}</span>
                          : <span className="text-gray-400">Closed</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white flex items-center justify-between" style={{ backgroundColor: '#025bae' }}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RateReview className="w-5 h-5" />
                Reviews ({totalReviews})
              </h2>
              {user && profile?.role === 'client' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/20 bg-white/10"
                  onClick={() => setReviewModalOpen(true)}
                >
                  {myReview ? (
                    <><Edit className="w-3.5 h-3.5 mr-1" /> Edit Review</>
                  ) : (
                    <><RateReview className="w-3.5 h-3.5 mr-1" /> Write a Review</>
                  )}
                </Button>
              )}
              {!user && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/20 bg-white/10"
                  onClick={() => navigate('/login')}
                >
                  <RateReview className="w-3.5 h-3.5 mr-1" /> Write a Review
                </Button>
              )}
            </div>
            <CardContent className="p-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="mb-3">No reviews yet. Be the first to leave one!</p>
                  {!user && (
                    <Button size="sm" onClick={() => navigate('/login')} style={{ backgroundColor: '#025bae' }} className="hover:opacity-90">
                      Sign in to review
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const clientName = typeof review.clientId === 'object' ? review.clientId.fullName : 'Client';
                    const isOwn = typeof review.clientId === 'object'
                      ? review.clientId._id === profile?._id
                      : review.clientId === profile?._id;
                    return (
                      <div key={review._id} className={`border-b border-gray-100 pb-4 last:border-0 last:pb-0 ${isOwn ? 'bg-blue-50 -mx-2 px-2 py-2 rounded-md' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {clientName}
                            {isOwn && <span className="ml-2 text-xs text-blue-600 font-normal">(your review)</span>}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1,2,3,4,5].map((s) => (
                            <Star
                              key={s}
                              style={{ fontSize: 16, color: s <= review.rating ? '#f59e0b' : '#d1d5db' }}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        providerId={providerId!}
        providerName={provider?.businessName || 'Provider'}
        existingReview={myReview}
        onReviewSubmitted={(review) => {
          setMyReview(review);
          loadReviews();
        }}
      />
    </div>
  );
};

export default ProviderDetail;