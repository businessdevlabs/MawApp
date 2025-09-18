import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, LocationOn, Phone, Schedule, Email, Language, Person } from '@mui/icons-material';

interface ProviderInfoProps {
  provider: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    businessEmail?: string;
    website?: string;
    averageRating?: number;
    totalReviews?: number;
  };
  duration: number;
  description: string;
}

const ProviderInfo = ({ provider, duration, description }: ProviderInfoProps) => {
  const hasRating = provider.averageRating && provider.averageRating > 0;
  const hasReviews = provider.totalReviews && provider.totalReviews > 0;

  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Provider Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Person className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {provider.businessName}
                </h3>
                {(hasRating || hasReviews) && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {provider.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({provider.totalReviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Available
            </Badge>
          </div>

          {/* Service Description */}
          {description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">About this service</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Provider Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h4>
              
              {provider.businessAddress && (
                <div className="flex items-start gap-3">
                  <LocationOn className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{provider.businessAddress}</span>
                </div>
              )}
              
              {provider.businessPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{provider.businessPhone}</span>
                </div>
              )}
              
              {provider.businessEmail && (
                <div className="flex items-center gap-3">
                  <Email className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{provider.businessEmail}</span>
                </div>
              )}
              
              {provider.website && (
                <div className="flex items-center gap-3">
                  <Language className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <a 
                    href={provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                Service Details
              </h4>
              
              <div className="flex items-center gap-3">
                <Schedule className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{duration} minutes duration</span>
              </div>

              {/* Additional service-specific information could go here */}
              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-800">Professional Service</span>
                </div>
                <p className="text-xs text-blue-700">
                  This provider has been verified and maintains professional standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderInfo;