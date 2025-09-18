import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BookingForm from '@/components/booking/BookingForm';
import { Schedule, Star, LocationOn, Close } from '@mui/icons-material';

interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category?: {
    name: string;
  };
  providerId: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    averageRating?: number;
    totalReviews?: number;
    profilePhoto?: string;
  };
}

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceDetailModal = ({ service, isOpen, onClose }: ServiceDetailModalProps) => {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Book {service.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Header Card */}
          <Card className="shadow-sm border-0 overflow-hidden rounded-t-lg">
            <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {service.providerId?.profilePhoto ? (
                    <img
                      src={service.providerId.profilePhoto}
                      alt={service.providerId?.businessName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {service.providerId?.businessName?.charAt(0)?.toUpperCase() || 'P'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold">{service.name}</h1>
                    <p className="text-white/80">{service.providerId?.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">${service.price}</div>
                  </div>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white hover:bg-white/20 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button> */}
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Schedule style={{ fontSize: 16, color: '#025bae' }} />
                  <span className="text-sm text-gray-900">{service.duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-900">
                    {service.providerId?.averageRating?.toFixed(1) || '4.8'} ({service.providerId?.totalReviews || 0})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <LocationOn style={{ fontSize: 16, color: '#025bae' }} />
                  <span className="text-sm text-gray-900 truncate">{service.providerId?.businessAddress || 'Location available'}</span>
                </div>
              </div>

              {service.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">About this service</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <Badge variant="outline" className="text-xs">
                  {service.category?.name || 'General Service'}
                </Badge>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  Available for booking
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Booking Section */}
          <Card className="shadow-sm border-0 overflow-hidden">
            {/* <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
              <h2 className="text-lg font-semibold">Book Your Appointment</h2>
              <p className="text-white/80 text-sm">Choose your preferred date and time</p>
            </div> */}
            <CardContent className="p-6">
              <BookingForm service={service} onSuccess={onClose} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailModal;