import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAIBookingSuggestions } from '@/hooks/useAIBooking';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SmartToy,
  AccessTime,
  CalendarToday,
  TrendingUp,
  CheckCircle,
  Info
} from '@mui/icons-material';

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

interface AIBookingSuggestion {
  date: string;
  time: string;
  dayOfWeek: string;
  reasoning: string;
  duration: number;
  confidence: string;
  enhancedByAI?: boolean;
}

interface AIBookingSectionProps {
  service: Service;
  onBookingSuccess?: () => void;
}

const AIBookingSection = ({ service, onBookingSuccess }: AIBookingSectionProps) => {
  const [frequencyPerMonth, setFrequencyPerMonth] = useState<number>(1);
  const [suggestions, setSuggestions] = useState<AIBookingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isSavingBookings, setIsSavingBookings] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const aiBooking = useAIBookingSuggestions();
  const queryClient = useQueryClient();

  // Mutation for creating individual bookings
  const createBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const token = localStorage.getItem('authToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
    }
  });

  const handleGenerateSuggestions = async () => {
    try {
      const result = await aiBooking.mutateAsync({
        serviceId: service._id,
        frequencyPerMonth,
        autoBook: false
      });

      setSuggestions(result.suggestions);
      setShowSuggestions(true);
      setSelectedSuggestions(new Set()); // Reset selections

      toast({
        title: "AI Suggestions Generated",
        description: `Found ${result.suggestions.length} optimal time slots for you!`,
      });

    } catch (error: any) {
      toast({
        title: "AI Suggestion Failed",
        description: error.message || "Failed to generate AI booking suggestions",
        variant: "destructive",
      });
    }
  };

  const handleAutoBook = async () => {
    setIsSavingBookings(true);

    try {
      // Step 1: Get AI suggestions first
      const suggestionsResult = await aiBooking.mutateAsync({
        serviceId: service._id,
        frequencyPerMonth,
        autoBook: false
      });

      if (!suggestionsResult.suggestions || suggestionsResult.suggestions.length === 0) {
        toast({
          title: "No Suggestions Available",
          description: "AI couldn't find suitable time slots. Please try adjusting your frequency or check availability.",
          variant: "destructive",
        });
        setIsSavingBookings(false);
        return;
      }

      // Step 2: Automatically select timeslots based on frequency
      const suggestionsToBook = suggestionsResult.suggestions.slice(0, frequencyPerMonth);

      // Step 3: Create bookings for selected suggestions
      const bookingPromises = suggestionsToBook.map(async (suggestion) => {
        const appointmentDate = new Date(`${suggestion.date}T${suggestion.time}`);
        const endTime = new Date(appointmentDate.getTime() + suggestion.duration * 60000);

        return createBooking.mutateAsync({
          serviceId: service._id,
          providerId: service.providerId,
          appointmentDate: appointmentDate.toISOString(),
          startTime: suggestion.time,
          endTime: endTime.toTimeString().slice(0, 5),
          totalAmount: service.price,
          notes: `AI Auto-booked appointment - ${suggestion.reasoning}`,
          paymentStatus: 'pending'
        });
      });

      await Promise.all(bookingPromises);

      toast({
        title: "AI Auto-Booking Successful",
        description: `Successfully booked ${suggestionsToBook.length} appointments automatically!`,
      });

      // Step 4: Close modal and redirect to bookings page
      if (onBookingSuccess) {
        onBookingSuccess();
      }

      // Redirect to bookings page after a brief delay
      setTimeout(() => {
        navigate('/bookings');
      }, 1000);

    } catch (error: any) {
      toast({
        title: "AI Auto-Booking Failed",
        description: error.message || "Failed to auto-book appointments",
        variant: "destructive",
      });
    } finally {
      setIsSavingBookings(false);
    }
  };

  const handleSuggestionToggle = (index: number) => {
    const newSelections = new Set(selectedSuggestions);
    if (newSelections.has(index)) {
      newSelections.delete(index);
    } else {
      newSelections.add(index);
    }
    setSelectedSuggestions(newSelections);
  };

  const handleSaveSelectedBookings = async () => {
    if (selectedSuggestions.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one suggestion to book.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBookings(true);

    try {
      const selectedBookings = Array.from(selectedSuggestions).map(index => suggestions[index]);
      const bookingPromises = selectedBookings.map(async (suggestion) => {
        const appointmentDate = new Date(`${suggestion.date}T${suggestion.time}`);
        const endTime = new Date(appointmentDate.getTime() + suggestion.duration * 60000);

        return createBooking.mutateAsync({
          serviceId: service._id,
          providerId: service.providerId,
          appointmentDate: appointmentDate.toISOString(),
          startTime: suggestion.time,
          endTime: endTime.toTimeString().slice(0, 5),
          totalAmount: service.price,
          notes: `AI-selected appointment - ${suggestion.reasoning}`,
          paymentStatus: 'pending'
        });
      });

      await Promise.all(bookingPromises);

      toast({
        title: "Bookings Created Successfully",
        description: `${selectedSuggestions.size} appointment(s) have been booked successfully!`,
      });

      setSelectedSuggestions(new Set());
      setShowSuggestions(false);

      if (onBookingSuccess) {
        onBookingSuccess();
      }

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create bookings",
        variant: "destructive",
      });
    } finally {
      setIsSavingBookings(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <SmartToy className="w-5 h-5 text-blue-600" />
          AI-Powered Smart Booking
        </CardTitle>
        <p className="text-sm text-blue-700">
          Let AI find the perfect times based on your availability and preferences
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Frequency Selection */}
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-sm font-medium text-gray-900">
            How often would you like to book this service?
          </Label>
          <Select value={frequencyPerMonth.toString()} onValueChange={(value) => setFrequencyPerMonth(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Once per month</SelectItem>
              <SelectItem value="2">Twice per month</SelectItem>
              <SelectItem value="3">3 times per month</SelectItem>
              <SelectItem value="4">Weekly (4 times/month)</SelectItem>
              <SelectItem value="6">Every 2 weeks (6 times/month)</SelectItem>
              <SelectItem value="8">Twice per week</SelectItem>
              <SelectItem value="12">3 times per week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerateSuggestions}
            disabled={aiBooking.isPending}
            variant="outline"
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {aiBooking.isPending ? 'Generating...' : 'Get AI Suggestions'}
          </Button>

          <Button
            onClick={handleAutoBook}
            disabled={isSavingBookings || aiBooking.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <SmartToy className="w-4 h-4 mr-2" />
            {isSavingBookings || aiBooking.isPending ? 'Auto-Booking...' : 'AI Auto-Book'}
          </Button>
        </div>

        {/* AI Suggestions Display */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-4 border-t border-blue-200">
              <SmartToy className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">
                AI Suggestions ({suggestions.length} found)
              </h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border shadow-sm transition-colors ${
                    selectedSuggestions.has(index)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-blue-100 hover:bg-blue-25'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedSuggestions.has(index)}
                        onCheckedChange={() => handleSuggestionToggle(index)}
                        className="mt-0.5"
                      />
                      <CalendarToday className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {formatDate(suggestion.date)}
                      </span>
                    </div>
                    <Badge
                      variant={suggestion.confidence === 'High' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {suggestion.confidence} confidence
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <AccessTime className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {formatTime(suggestion.time)} ({suggestion.duration} minutes)
                    </span>
                  </div>

                  {suggestion.reasoning && (
                    <div className="flex items-start gap-2 mt-3">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  )}

                  {suggestion.enhancedByAI && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs text-purple-700 border-purple-200">
                        Enhanced by Hugging Face AI
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save Button */}
            {selectedSuggestions.size > 0 && (
              <div className="pt-4 border-t border-blue-200">
                <Button
                  onClick={handleSaveSelectedBookings}
                  disabled={isSavingBookings}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSavingBookings
                    ? 'Booking...'
                    : `Book Selected (${selectedSuggestions.size})`
                  }
                </Button>
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900">Smart Matching Complete</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {selectedSuggestions.size > 0
                      ? `${selectedSuggestions.size} appointment(s) selected for booking.`
                      : "These times are optimized based on your profile availability, provider schedule, and booking frequency preferences."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuggestions && suggestions.length === 0 && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                No optimal time slots found. Try adjusting your frequency or check your availability settings in your profile.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIBookingSection;