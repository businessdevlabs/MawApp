
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
import { CalendarToday, Schedule, LocationOn, Person, AttachMoney } from '@mui/icons-material';
import { format } from 'date-fns';

interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  providerId: {
    _id: string;
    businessName: string;
    businessAddress?: string;
    businessPhone?: string;
    averageRating?: number;
    totalReviews?: number;
  };
}

interface BookingFormProps {
  service: Service;
  onSuccess?: () => void;
}

const BookingForm = ({ service, onSuccess }: BookingFormProps) => {
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
        provider_id: service.providerId._id,
        service_id: service._id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        duration_minutes: service.duration,
        total_price: service.price,
        notes: notes || undefined,
      });

      toast({
        title: "Booking Successful!",
        description: "Your appointment has been requested. You'll receive a confirmation soon.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
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
    <div className="space-y-4">
      {/* Time Slot Selection */}
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Select Date & Time</h3>
          <p className="text-xs text-gray-600">Choose your preferred appointment slot</p>
        </div>
        <TimeSlotPicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateSelect={setSelectedDate}
          onTimeSelect={setSelectedTime}
          duration={service.duration}
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-sm font-medium text-gray-900">Additional Notes (Optional)</h3>
        </div>
        <Textarea
          placeholder="Any special requests or notes for your appointment..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Booking Summary & Submit */}
      <div className="space-y-4">
        {selectedDate && selectedTime && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Appointment Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CalendarToday className="w-4 h-4" style={{color: '#025bae'}} />
                <span>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Schedule className="w-4 h-4" style={{color: '#025bae'}} />
                <span>{selectedTime} ({service.duration} minutes)</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Total:</span>
                <span className="text-lg font-bold" style={{color: '#025bae'}}>${service.price}</span>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedTime || isSubmitting}
          className="w-full"
          size="lg"
          style={{backgroundColor: '#025bae'}}
        >
          {isSubmitting ? 'Booking...' : 'Book Appointment'}
        </Button>
      </div>
    </div>
  );
};

export default BookingForm;
