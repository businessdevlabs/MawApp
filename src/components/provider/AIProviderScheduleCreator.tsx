import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import {
  SmartToy,
  Business,
  Schedule,
  AccessTime,
  Info,
  CheckCircle,
  AutoAwesome
} from '@mui/icons-material';

interface DaySchedule {
  startTime: string;
  endTime: string;
}

interface GeneratedSchedule {
  [day: string]: DaySchedule[];
}

interface AIProviderScheduleCreatorProps {
  onScheduleGenerated?: (schedule: GeneratedSchedule) => void;
}

interface ScheduleQuestions {
  businessHours: string;
  businessDays: string[];
  servicesNotes: string;
}

const AIProviderScheduleCreator = ({ onScheduleGenerated }: AIProviderScheduleCreatorProps) => {
  const [questions, setQuestions] = useState<ScheduleQuestions>({
    businessHours: '',
    businessDays: [],
    servicesNotes: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const { toast } = useToast();

  const businessDayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Mutation for generating AI schedule
  const generateAISchedule = useMutation({
    mutationFn: async (scheduleData: ScheduleQuestions) => {
      const token = localStorage.getItem('authToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${baseUrl}/ai-booking/generate-provider-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessHours: scheduleData.businessHours,
          businessDays: scheduleData.businessDays,
          servicesNotes: scheduleData.servicesNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate AI provider schedule');
      }

      return await response.json();
    }
  });

  const handleBusinessDayToggle = (day: string) => {
    setQuestions(prev => ({
      ...prev,
      businessDays: prev.businessDays.includes(day)
        ? prev.businessDays.filter(d => d !== day)
        : [...prev.businessDays, day]
    }));
  };

  const handleGenerateSchedule = async () => {
    if (!questions.businessHours || questions.businessDays.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in business hours and business days to generate your schedule.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Calling AI Provider Schedule API with:', questions);
      const result = await generateAISchedule.mutateAsync(questions);
      console.log('AI Provider Schedule Generation Result:', result);
      
      if (result.schedule) {
        setGeneratedSchedule(result.schedule);
        setShowSchedule(true);

        toast({
          title: "AI Schedule Generated",
          description: "Your personalized business schedule has been created!",
        });
      } else {
        throw new Error('No schedule returned from API');
      }

    } catch (error: any) {
      console.error('AI Provider Schedule Generation Error:', error);
      toast({
        title: "Schedule Generation Failed",
        description: error.message || "Failed to generate AI provider schedule",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!generatedSchedule) return;

    console.log('Passing generated provider schedule to parent:', generatedSchedule);
    
    // Pass the generated schedule to parent component
    if (onScheduleGenerated) {
      onScheduleGenerated(generatedSchedule);
    }

    // Reset form
    setQuestions({
      businessHours: '',
      businessDays: [],
      servicesNotes: ''
    });
    setShowSchedule(false);
    setGeneratedSchedule(null);
  };

  return (
    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-900">
          <AutoAwesome className="w-5 h-5 text-green-600" />
          AI Business Schedule Creator
        </CardTitle>
        <p className="text-sm text-green-700">
          Answer a few questions about your business to generate an optimal service schedule
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!showSchedule ? (
          <>
            {/* Question 1: Business Hours */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Business className="w-4 h-4 text-green-600" />
                What are your typical business hours?
              </Label>
              <Input
                placeholder="e.g., 9:00 AM - 6:00 PM"
                value={questions.businessHours}
                onChange={(e) => setQuestions(prev => ({ ...prev, businessHours: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-600">When do you typically operate your business?</p>
            </div>

            {/* Question 2: Business Days */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Schedule className="w-4 h-4 text-green-600" />
                Which days do you operate your business?
              </Label>
              <div className="flex flex-wrap gap-2">
                {businessDayOptions.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={questions.businessDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBusinessDayToggle(day.value)}
                    className="text-xs"
                    style={questions.businessDays.includes(day.value) ?
                      {backgroundColor: '#059669', borderColor: '#059669'} :
                      {borderColor: '#059669', color: '#059669'}
                    }
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-600">Select all days when you provide services</p>
            </div>

            {/* Question 3: Services Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-green-600" />
                Any special service notes or constraints?
              </Label>
              <Textarea
                placeholder="e.g., Lunch break from 12-1 PM, no appointments on Friday afternoons, buffer time between services..."
                value={questions.servicesNotes}
                onChange={(e) => setQuestions(prev => ({ ...prev, servicesNotes: e.target.value }))}
                className="w-full min-h-[80px]"
              />
              <p className="text-xs text-gray-600">Optional: Tell us about any scheduling preferences or constraints</p>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleGenerateSchedule}
                disabled={isGenerating || generateAISchedule.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <SmartToy className="w-4 h-4 mr-2" />
                {isGenerating || generateAISchedule.isPending ? 'Generating Schedule...' : 'Generate AI Schedule'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Generated Schedule Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                <SmartToy className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900">
                  AI-Generated Business Schedule
                </h3>
                <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                  Optimized for Business
                </Badge>
              </div>

              {/* Schedule Preview */}
              {generatedSchedule && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(generatedSchedule).map(([day, slots]) => (
                    <div key={day} className="p-4 rounded-lg border border-green-100 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {slots.length} slots
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <AccessTime className="w-3 h-3 text-green-500" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                        ))}
                        {slots.length === 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AccessTime className="w-3 h-3 text-gray-400" />
                            <span>Closed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-green-200">
                <Button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply & Save Schedule
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSchedule(false);
                    setGeneratedSchedule(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Regenerate
                </Button>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-900">Smart Business Schedule Complete</p>
                    <p className="text-xs text-green-700 mt-1">
                      This schedule was created based on your business hours and service constraints. Click "Apply & Save Schedule" to save it to your provider profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProviderScheduleCreator;