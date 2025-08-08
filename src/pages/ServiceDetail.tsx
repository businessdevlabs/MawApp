
import { useParams, Navigate } from 'react-router-dom';
import { useService } from '@/hooks/useServices';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import BookingForm from '@/components/booking/BookingForm';
import ProviderInfo from '@/components/service/ProviderInfo';
import { DollarSign } from 'lucide-react';

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { data: service, isLoading, error } = useService(serviceId || '');

  if (!serviceId) {
    return <Navigate to="/services" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
            <p className="text-gray-600">The service you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <DollarSign className="w-4 h-4 mr-1" />
              {service.price}
            </Badge>
          </div>

          {/* Provider Info */}
          <ProviderInfo 
            provider={service.providerId}
            duration={service.duration}
            description={service.description}
          />
        </div>

        {/* Booking Form */}
        <BookingForm service={service} />
      </div>
    </div>
  );
};

export default ServiceDetail;
