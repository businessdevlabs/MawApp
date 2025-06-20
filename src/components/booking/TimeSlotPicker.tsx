
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

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
}

const TimeSlotPicker = ({ 
  selectedDate, 
  selectedTime, 
  onDateSelect, 
  onTimeSelect,
  duration 
}: TimeSlotPickerProps) => {
  // Generate time slots from 9 AM to 6 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Simulate some unavailable slots for demo
        const available = Math.random() > 0.3;
        slots.push({ time, available });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const today = startOfDay(new Date());

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
            disabled={(date) => isBefore(date, today)}
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
            <p className="text-gray-500 text-center py-8">
              Please select a date first
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  size="sm"
                  disabled={!slot.available}
                  onClick={() => onTimeSelect(slot.time)}
                  className="text-xs"
                >
                  {slot.time}
                </Button>
              ))}
            </div>
          )}
          
          {selectedDate && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Unavailable</span>
              </div>
              {selectedTime && (
                <Badge variant="secondary" className="mt-2">
                  Duration: {duration} minutes
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotPicker;
