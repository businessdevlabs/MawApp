import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useProviderDetail } from '@/hooks/useProvider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  Globe,
  Star,
  Clock,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';

const ProviderDetail = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { data: provider, isLoading, error } = useProviderDetail(providerId || '');

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
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-6xl opacity-30">
                {provider.category === 'Beauty & Personal Care' && '💇'}
                {provider.category === 'Health & Wellness' && '🏥'}
                {provider.category === 'Technology Services' && '💻'}
                {provider.category === 'Professional Services' && '💼'}
                {provider.category === 'Home & Maintenance' && '🔧'}
                {provider.category === 'Education & Training' && '📚'}
                {!provider.category && '🏢'}
              </div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {provider.businessName || 'Business Name'}
              </h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 font-medium text-gray-900">
                    {String(provider.averageRating || 4.8)}
                  </span>
                  <span className="ml-1 text-gray-500">
                    ({String(provider.totalReviews || 0)} reviews)
                  </span>
                </div>
                <Badge variant="outline">
                  {provider.category || 'General Services'}
                </Badge>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {provider.businessDescription || 'Professional service provider offering quality services'}
              </p>
            </div>
          </div>

          {/* Contact & Location Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{provider.businessAddress || 'Location not specified'}</span>
                </div>
                {provider.businessPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{provider.businessPhone}</span>
                  </div>
                )}
                {provider.businessEmail && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span>{provider.businessEmail}</span>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Services ({String(provider.services?.length || 0)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {provider.services && provider.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.services.map((service: any) => (
                    <Card key={service._id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {String(service.price || '0')}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {String(service.duration || 0)} min
                          </div>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-1" />
                            Book Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services available at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          {provider.businessHours && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(provider.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="capitalize font-medium">{day}</span>
                      <span className="text-gray-600">
                        {typeof hours === 'string' ? hours : JSON.stringify(hours)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDetail;