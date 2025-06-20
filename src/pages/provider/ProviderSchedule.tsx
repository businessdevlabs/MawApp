
import React, { useState } from 'react';
import { useProviderProfile } from '@/hooks/useProvider';
import { useProviderSchedule, useCreateSchedule, useUpdateSchedule } from '@/hooks/useProviderSchedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

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
  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: schedules = [], isLoading: schedulesLoading } = useProviderSchedule(provider?.id);
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const { toast } = useToast();

  const [scheduleData, setScheduleData] = useState(() => {
    const initialData: Record<number, { is_available: boolean; start_time: string; end_time: string }> = {};
    DAYS_OF_WEEK.forEach(day => {
      initialData[day.value] = {
        is_available: false,
        start_time: '09:00',
        end_time: '17:00'
      };
    });
    return initialData;
  });

  React.useEffect(() => {
    if (schedules.length > 0) {
      const updatedData = { ...scheduleData };
      schedules.forEach(schedule => {
        updatedData[schedule.day_of_week] = {
          is_available: schedule.is_available,
          start_time: schedule.start_time,
          end_time: schedule.end_time
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
    if (!provider?.id) return;

    try {
      for (const dayOfWeek of DAYS_OF_WEEK) {
        const dayData = scheduleData[dayOfWeek.value];
        const existingSchedule = schedules.find(s => s.day_of_week === dayOfWeek.value);

        if (existingSchedule) {
          await updateSchedule.mutateAsync({
            id: existingSchedule.id,
            updates: {
              is_available: dayData.is_available,
              start_time: dayData.start_time,
              end_time: dayData.end_time,
              updated_at: new Date().toISOString()
            }
          });
        } else {
          await createSchedule.mutateAsync({
            provider_id: provider.id,
            day_of_week: dayOfWeek.value,
            is_available: dayData.is_available,
            start_time: dayData.start_time,
            end_time: dayData.end_time
          });
        }
      }

      toast({
        title: "Schedule saved",
        description: "Your availability schedule has been updated.",
      });
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
            <Button onClick={handleSaveSchedule} disabled={createSchedule.isPending || updateSchedule.isPending}>
              {(createSchedule.isPending || updateSchedule.isPending) ? "Saving..." : "Save Schedule"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={scheduleData[day.value]?.is_available || false}
                      onCheckedChange={(checked) => handleScheduleChange(day.value, 'is_available', checked)}
                    />
                    <Label className="font-medium w-20">{day.label}</Label>
                  </div>
                  
                  {scheduleData[day.value]?.is_available && (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={scheduleData[day.value]?.start_time || '09:00'}
                        onChange={(e) => handleScheduleChange(day.value, 'start_time', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={scheduleData[day.value]?.end_time || '17:00'}
                        onChange={(e) => handleScheduleChange(day.value, 'end_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Instructions</CardTitle>
            </CardHeader>
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
