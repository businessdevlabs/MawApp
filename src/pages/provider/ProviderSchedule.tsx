
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Schedule } from '@mui/icons-material';

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

  const [scheduleData, setScheduleData] = useState(() => {
    const initialData: Record<number, { isAvailable: boolean; startTime: string; endTime: string }> = {};
    DAYS_OF_WEEK.forEach(day => {
      initialData[day.value] = {
        isAvailable: false,
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
        updatedData[schedule.dayOfWeek] = {
          isAvailable: schedule.isAvailable,
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

  const handleSaveSchedule = async () => {
    try {
      const schedulesToSave = DAYS_OF_WEEK.map(day => {
        const dayData = scheduleData[day.value];
        return {
          dayOfWeek: day.value,
          isAvailable: dayData.isAvailable,
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
                    <p className="text-white/80">Set your weekly availability</p>
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
                Weekly Availability
              </h2>
              <p className="text-white/80 text-sm">Toggle days and set your working hours</p>
            </div>
            <CardContent className="space-y-6">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center justify-between p-4 border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors" style={{borderLeftColor: scheduleData[day.value]?.isAvailable ? '#025bae' : '#d1d5db', borderRadius: '0 8px 8px 0'}}>
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={scheduleData[day.value]?.isAvailable || false}
                      onCheckedChange={(checked) => handleScheduleChange(day.value, 'isAvailable', checked)}
                    />
                    <Label className="font-medium w-20 text-gray-900">{day.label}</Label>
                  </div>
                  
                  {scheduleData[day.value]?.isAvailable && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={scheduleData[day.value]?.startTime || '09:00'}
                        onChange={(e) => handleScheduleChange(day.value, 'startTime', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={scheduleData[day.value]?.endTime || '17:00'}
                        onChange={(e) => handleScheduleChange(day.value, 'endTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 overflow-hidden">
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderSchedule;
