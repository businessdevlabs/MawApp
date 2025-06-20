
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBooking } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import TimeSlotPicker from './TimeSlotPicker';
import { Calendar, Clock, MapPin, User, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  provider: {
    id: string;
    business_name: string;
    business_address: string;
    business_phone: string;
    rating: number;
    total_reviews: number;
  };
}

interface BookingFormProps {
  service: Service;
}

const BookingForm = ({ service }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBooking = useCreateBooking();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createBooking.mutateAsync({
        client_id: user.id,
        provider_id: service.provider.id,
        service_id: service.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        duration_minutes: service.duration_minutes,
        total_price: service.price,
        notes: notes || null,
        status: 'pending',
      });

      toast({
        title: "Booking Successful!",
        description: "Your appointment has been requested. You'll receive a confirmation soon.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{service.name}</span>
            <Badge variant="secondary">${service.price}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span>{service.provider.business_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{service.provider.business_address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{service.duration_minutes} minutes</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{service.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rating:</span>
                <Badge variant="outline">
                  ⭐ {service.provider.rating} ({service.provider.total_reviews} reviews)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date & Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSlotPicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            duration={service.duration_minutes}
          />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special requests or notes for your appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Booking Summary & Submit */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDate && selectedTime && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{selectedTime} ({service.duration_minutes} minutes)</span>
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Amount:</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-lg font-bold">{service.price}</span>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Booking...' : 'Book Appointment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingForm;
