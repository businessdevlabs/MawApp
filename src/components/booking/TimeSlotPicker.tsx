
import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, startOfDay } from 'date-fns';

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  [key: string]: DayHours | undefined;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  duration: number;
  businessHours?: BusinessHours;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const TimeSlotPicker = ({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  duration,
  businessHours,
}: TimeSlotPickerProps) => {
  const today = startOfDay(new Date());

  const getDayHours = (date: Date): DayHours | undefined => {
    if (!businessHours) return undefined;
    const dayName = DAY_NAMES[date.getDay()];
    return businessHours[dayName];
  };

  const hasAvailableSlots = (date: Date): boolean => {
    const hours = getDayHours(date);
    return hours?.isOpen === true && !!hours.open && !!hours.close;
  };

  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedDate) return [];
    const hours = getDayHours(selectedDate);
    if (!hours?.isOpen || !hours.open || !hours.close) return [];

    const [startHour, startMin] = hours.open.split(':').map(Number);
    const [endHour, endMin] = hours.close.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const slots: TimeSlot[] = [];
    for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time, available: true });
    }
    return slots;
  };

  const timeSlots = useMemo(generateTimeSlots, [selectedDate, businessHours, duration]);

  const noHoursConfigured = !businessHours || Object.values(businessHours).every(d => !d?.isOpen);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            disabled={(date) => isBefore(date, today) || !hasAvailableSlots(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Available Times
            {selectedDate && (
              <span className="text-sm font-normal text-gray-600 block">
                {format(selectedDate, 'EEEE, MMMM do')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-gray-500 text-center py-8">Please select a date first</p>
          ) : timeSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No available slots for this day</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? 'default' : 'outline'}
                  size="sm"
                  disabled={!slot.available}
                  onClick={() => onTimeSelect(slot.time)}
                  className="text-xs"
                  style={selectedTime === slot.time ? { backgroundColor: '#025bae' } : undefined}
                >
                  {slot.time}
                </Button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#025bae' }}></div>
              <span>Selected time</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
              <span>Closed / unavailable days</span>
            </div>
            {selectedTime && (
              <Badge variant="secondary" className="mt-2">
                Duration: {duration} minutes
              </Badge>
            )}
            {noHoursConfigured && (
              <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded">
                This provider has not set their business hours yet. Please contact them directly.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotPicker;
