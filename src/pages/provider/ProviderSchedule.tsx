
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderProfile } from '@/hooks/useProvider';
import { useProviderSchedule, useCreateSchedule, useUpdateSchedule } from '@/hooks/useProviderSchedule';
import { useProviderServices } from '@/hooks/useProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Schedule, Add, Remove } from '@mui/icons-material';
import AIProviderScheduleCreator from '@/components/provider/AIProviderScheduleCreator';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const ProviderSchedule = () => {
  const navigate = useNavigate();
  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: schedules = [], isLoading: schedulesLoading } = useProviderSchedule(provider?.id);
  const { data: services = [], isLoading: servicesLoading } = useProviderServices();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const { toast } = useToast();

  const [scheduleTab, setScheduleTab] = useState('manual');

  interface TimeSlot {
    startTime: string;
    endTime: string;
  }

  interface DaySchedule {
    isAvailable: boolean;
    timeSlots: TimeSlot[];
    // Keep legacy fields for backward compatibility
    startTime?: string;
    endTime?: string;
  }

  const [scheduleData, setScheduleData] = useState(() => {
    const initialData: Record<number, DaySchedule> = {};
    DAYS_OF_WEEK.forEach(day => {
      initialData[day.value] = {
        isAvailable: false,
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
        startTime: '09:00',
        endTime: '17:00'
      };
    });
    return initialData;
  });

  React.useEffect(() => {
    if (schedules.length > 0) {
      const updatedData = { ...scheduleData };
      schedules.forEach(schedule => {
        // Handle both legacy single slot and new multiple slots format
        let timeSlots: TimeSlot[] = [];
        
        if (schedule.timeSlots && schedule.timeSlots.length > 0) {
          // New multiple slots format
          timeSlots = schedule.timeSlots;
        } else if (schedule.startTime && schedule.endTime) {
          // Legacy single slot format
          timeSlots = [{ startTime: schedule.startTime, endTime: schedule.endTime }];
        }
        
        updatedData[schedule.dayOfWeek] = {
          isAvailable: schedule.isAvailable,
          timeSlots: timeSlots.length > 0 ? timeSlots : [{ startTime: '09:00', endTime: '17:00' }],
          startTime: schedule.startTime,
          endTime: schedule.endTime
        };
      });
      setScheduleData(updatedData);
    }
  }, [schedules]);

  const handleScheduleChange = (dayOfWeek: number, field: string, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value
      }
    }));
  };

  const handleTimeSlotChange = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setScheduleData(prev => {
      const updatedTimeSlots = [...prev[dayOfWeek].timeSlots];
      updatedTimeSlots[slotIndex] = {
        ...updatedTimeSlots[slotIndex],
        [field]: value
      };
      
      return {
        ...prev,
        [dayOfWeek]: {
          ...prev[dayOfWeek],
          timeSlots: updatedTimeSlots,
          // Update legacy fields for the first slot
          startTime: updatedTimeSlots[0]?.startTime || '09:00',
          endTime: updatedTimeSlots[0]?.endTime || '17:00'
        }
      };
    });
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setScheduleData(prev => {
      const currentSlots = prev[dayOfWeek].timeSlots;
      const lastSlot = currentSlots[currentSlots.length - 1];
      const newSlot = {
        startTime: lastSlot?.endTime || '09:00',
        endTime: lastSlot?.endTime ? 
          (parseInt(lastSlot.endTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00' : 
          '17:00'
      };
      
      return {
        ...prev,
        [dayOfWeek]: {
          ...prev[dayOfWeek],
          timeSlots: [...currentSlots, newSlot]
        }
      };
    });
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setScheduleData(prev => {
      const updatedTimeSlots = prev[dayOfWeek].timeSlots.filter((_, index) => index !== slotIndex);
      
      // Ensure at least one time slot remains
      if (updatedTimeSlots.length === 0) {
        updatedTimeSlots.push({ startTime: '09:00', endTime: '17:00' });
      }
      
      return {
        ...prev,
        [dayOfWeek]: {
          ...prev[dayOfWeek],
          timeSlots: updatedTimeSlots,
          // Update legacy fields for the first slot
          startTime: updatedTimeSlots[0]?.startTime || '09:00',
          endTime: updatedTimeSlots[0]?.endTime || '17:00'
        }
      };
    });
  };

  const handleSaveSchedule = async () => {
    try {
      const schedulesToSave = DAYS_OF_WEEK.map(day => {
        const dayData = scheduleData[day.value];
        return {
          dayOfWeek: day.value,
          isAvailable: dayData.isAvailable,
          timeSlots: dayData.timeSlots,
          // Keep legacy fields for backward compatibility
          startTime: dayData.startTime,
          endTime: dayData.endTime
        };
      });

      await updateSchedule.mutateAsync(schedulesToSave);

      toast({
        title: "Schedule saved",
        description: "Your availability schedule has been updated.",
      });

      // Check if provider is still in setup mode and navigate to step 3
      const hasServices = services.length > 0;
      // Check if schedule is being set (either existing schedules or the ones being saved now)
      const hasSchedule = schedules.some(s => s.isAvailable) || schedulesToSave.some(s => s.isAvailable);
      // For profile, be more lenient - just need business name OR email
      const hasProfile = !!(provider && (
        provider.businessName || 
        provider.businessDescription || 
        provider.businessAddress || 
        provider.businessPhone || 
        provider.businessEmail
      ));

      // If profile is complete and schedule is now set but services are not set, navigate to services
      if (hasProfile && hasSchedule && !hasServices) {
        console.log('Provider setup: Navigating from schedule (step 2) to services (step 3)');
        setTimeout(() => {
          navigate('/provider/services');
        }, 1500); // Small delay to show success message
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAIScheduleGenerated = async (generatedSchedule: any) => {
    console.log('Received AI provider schedule:', generatedSchedule);
    
    // Convert AI-generated schedule to the new multiple time slots format
    const convertedScheduleData: Record<number, DaySchedule> = {};

    // Initialize all days as unavailable
    DAYS_OF_WEEK.forEach(day => {
      convertedScheduleData[day.value] = {
        isAvailable: false,
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
        startTime: '09:00',
        endTime: '17:00'
      };
    });

    // Map day names to numbers
    const dayNameToNumber: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    // Populate with AI-generated data
    Object.entries(generatedSchedule).forEach(([dayName, slots]: [string, any]) => {
      const dayNumber = dayNameToNumber[dayName.toLowerCase()];
      if (dayNumber !== undefined && Array.isArray(slots) && slots.length > 0) {
        // Convert all slots for the day
        const timeSlots = slots.map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        }));
        
        convertedScheduleData[dayNumber] = {
          isAvailable: true,
          timeSlots: timeSlots,
          // Keep legacy fields for the first slot
          startTime: timeSlots[0].startTime,
          endTime: timeSlots[0].endTime
        };
      }
    });

    console.log('Converted provider schedule:', convertedScheduleData);
    
    // Update the schedule data
    setScheduleData(convertedScheduleData);

    // Auto-save the schedule
    try {
      const schedulesToSave = DAYS_OF_WEEK.map(day => {
        const dayData = convertedScheduleData[day.value];
        return {
          dayOfWeek: day.value,
          isAvailable: dayData.isAvailable,
          timeSlots: dayData.timeSlots,
          startTime: dayData.startTime,
          endTime: dayData.endTime
        };
      });

      await updateSchedule.mutateAsync(schedulesToSave);

      toast({
        title: "AI Schedule Saved",
        description: "Your AI-generated business schedule has been saved successfully!",
      });

      // Check if provider setup should navigate to next step
      const hasServices = services.length > 0;
      const hasSchedule = schedulesToSave.some(s => s.isAvailable);
      const hasProfile = !!(provider && (
        provider.businessName || 
        provider.businessDescription || 
        provider.businessAddress || 
        provider.businessPhone || 
        provider.businessEmail
      ));

      if (hasProfile && hasSchedule && !hasServices) {
        console.log('Provider setup: Navigating from AI schedule to services');
        setTimeout(() => {
          navigate('/provider/services');
        }, 1500);
      }

    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save AI schedule. Please try saving manually.",
        variant: "destructive",
      });
    }

    // Switch back to manual tab to show the applied schedule
    setScheduleTab('manual');
  };

  if (providerLoading || schedulesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Card>
              <CardContent className="p-6 space-y-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Profile Not Found</h1>
            <p className="text-gray-600">Please complete your provider registration.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Schedule className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>Schedule Management</h1>
                  </div>
                </div>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={createSchedule.isPending || updateSchedule.isPending}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {(createSchedule.isPending || updateSchedule.isPending) ? "Saving..." : "Save Schedule"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Schedule className="w-5 h-5" />
                Business Hours
              </h2>
              <p className="text-white/80 text-sm">Set your availability schedule</p>
            </div>
            <CardContent className="space-y-4">
              <Tabs value={scheduleTab} onValueChange={setScheduleTab} className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 bg-blue-500 border-0 rounded-lg p-1">
                  <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium"
                  >
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white/80 hover:text-white font-medium"
                  >
                    AI Generator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-6 mt-6">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="p-4 border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-r-lg" style={{borderLeftColor: scheduleData[day.value]?.isAvailable ? '#025bae' : '#d1d5db'}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <Switch
                            checked={scheduleData[day.value]?.isAvailable || false}
                            onCheckedChange={(checked) => handleScheduleChange(day.value, 'isAvailable', checked)}
                            style={{
                              backgroundColor: scheduleData[day.value]?.isAvailable ? '#025bae' : ''
                            }}
                          />
                          <Label className="font-medium text-gray-900">{day.label}</Label>
                        </div>
                        
                        {scheduleData[day.value]?.isAvailable && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(day.value)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Add className="w-4 h-4 mr-1" />
                            Add Time Slot
                          </Button>
                        )}
                      </div>
                      
                      {scheduleData[day.value]?.isAvailable && (
                        <div className="space-y-2">
                          {scheduleData[day.value].timeSlots.map((slot, slotIndex) => (
                            <div key={slotIndex} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleTimeSlotChange(day.value, slotIndex, 'startTime', e.target.value)}
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleTimeSlotChange(day.value, slotIndex, 'endTime', e.target.value)}
                                className="w-32"
                              />
                              {scheduleData[day.value].timeSlots.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeTimeSlot(day.value, slotIndex)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 ml-2"
                                >
                                  <Remove className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> Toggle days on/off and add multiple time slots for each day. Use "Add Time Slot" to create separate working periods (e.g., morning and afternoon sessions). Changes will be saved when you click "Save Schedule".
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-6">
                  <AIProviderScheduleCreator onScheduleGenerated={handleAIScheduleGenerated} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#6b7280'}}>
              <h2 className="text-lg font-semibold">Schedule Instructions</h2>
              <p className="text-white/80 text-sm">How to manage your availability</p>
            </div>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Toggle the switch to enable availability for each day</p>
                <p>• Set your working hours using the time inputs</p>
                <p>• Changes will apply to future bookings only</p>
                <p>• Clients can only book during your available hours</p>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default ProviderSchedule;
