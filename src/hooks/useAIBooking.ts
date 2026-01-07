import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HfInference } from '@huggingface/inference';
import { useRef } from 'react';

interface AIBookingSuggestion {
  date: string;
  time: string;
  dayOfWeek: string;
  reasoning: string;
  duration: number;
  confidence: string;
}

interface BookingResult {
  booking: string;
  date: string;
  time: string;
  status: 'booked' | 'failed';
  error?: string;
}

interface AIBookingResponse {
  message: string;
  success: boolean;
  suggestions: AIBookingSuggestion[];
  reasoning: string;
  autoBooked: boolean;
  bookingResults?: BookingResult[];
  totalSuggestions: number;
  clientId: string;
  serviceId: string;
}

interface AIBookingRequest {
  serviceId: string;
  frequencyPerMonth: number;
  autoBook?: boolean;
}

export const useAIBookingSuggestions = () => {
  const queryClient = useQueryClient();
  const hfInference = useRef(
    import.meta.env.VITE_HUGGINGFACE_API_KEY
      ? new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY)
      : null
  );

  const enhanceSuggestionsWithHF = async (suggestions: AIBookingSuggestion[], request: AIBookingRequest) => {
    if (!hfInference.current) {
      return suggestions;
    }

    try {
      const prompt = `
Analyze these appointment scheduling suggestions and provide enhanced reasoning:

Suggestions: ${JSON.stringify(suggestions)}
Frequency: ${request.frequencyPerMonth} times per month
Auto-book: ${request.autoBook ? 'Yes' : 'No'}

Please provide improved reasoning for each suggestion considering:
1. Optimal spacing between appointments
2. Consistency for regular clients
3. Peak/off-peak scheduling preferences
4. Weekend vs weekday considerations

Respond with enhanced reasoning for each suggestion.
`;

      // Using Hugging Face's conversational model
      const response = await hfInference.current.chatCompletion({
        model: 'microsoft/DialoGPT-large',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const enhancedReasoning = response.choices[0]?.message?.content || '';

      // Enhance original suggestions with HF reasoning
      return suggestions.map((suggestion, index) => ({
        ...suggestion,
        reasoning: enhancedReasoning.includes(`Suggestion ${index + 1}`)
          ? enhancedReasoning.split(`Suggestion ${index + 1}`)[1]?.split(`Suggestion ${index + 2}`)[0]?.trim() || suggestion.reasoning
          : suggestion.reasoning,
        enhancedByAI: true
      }));

    } catch (error) {
      console.warn('HF enhancement failed:', error);
      return suggestions;
    }
  };

  return useMutation({
    mutationFn: async (request: AIBookingRequest): Promise<AIBookingResponse> => {
      const token = localStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No valid authentication token available');
      }

      // First, get suggestions from backend
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/ai-booking/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication expired. Please log in again.');
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate AI booking suggestions');
      }

      const result = await response.json();

      // Enhance suggestions with Hugging Face AI analysis if available
      if (hfInference.current && result.suggestions.length > 0) {
        try {
          const enhancedSuggestions = await enhanceSuggestionsWithHF(result.suggestions, request);
          result.suggestions = enhancedSuggestions;
        } catch (hfError) {
          console.warn('Hugging Face enhancement failed, using original suggestions:', hfError);
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingBookings'] });
    },
  });
};

export const useAIBookingHistory = () => {
  return useMutation({
    mutationFn: async (): Promise<any> => {
      const token = localStorage.getItem('authToken');

      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No valid authentication token available');
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${baseUrl}/ai-booking/history`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error('Failed to fetch AI booking history');
      }

      return await response.json();
    }
  });
};