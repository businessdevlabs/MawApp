import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClientProfile, useUpdateClientProfile } from '@/hooks/useClientProfile';
import AIScheduleCreator from '@/components/profile/AIScheduleCreator';
import {
  Language,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Shield,
  Save,
  Close,
  Schedule,
  Add
} from '@mui/icons-material';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface ScheduleSlots {
  [dayOfWeek: number]: TimeRange[];
}

interface ProfileFormData {
  fullName: string;
  phone: string;
  address: string;
  scheduleSlots: ScheduleSlots;
}

// Helper functions to convert between formats
const parseClientSlotsToScheduleSlots = (clientSlots: string[]): ScheduleSlots => {
  const result: ScheduleSlots = {};
  DAYS_OF_WEEK.forEach(day => {
    result[day.value] = [];
  });

  clientSlots.forEach(slotString => {
    try {
      const parsed = JSON.parse(slotString);
      if (!result[parsed.dayOfWeek]) {
        result[parsed.dayOfWeek] = [];
      }
      result[parsed.dayOfWeek].push({
        startTime: parsed.startTime,
        endTime: parsed.endTime
      });
    } catch (e) {
      console.warn('Failed to parse client slot:', slotString);
    }
  });
  return result;
};

const convertScheduleSlotsToArray = (scheduleSlots: ScheduleSlots): string[] => {
  const result: string[] = [];
  Object.entries(scheduleSlots).forEach(([dayOfWeek, ranges]) => {
    ranges.forEach(range => {
      result.push(JSON.stringify({
        dayOfWeek: parseInt(dayOfWeek),
        startTime: range.startTime,
        endTime: range.endTime
      }));
    });
  });
  return result;
};

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { data: clientProfile, isLoading, error } = useClientProfile();
  const updateProfile = useUpdateClientProfile();
  const [scheduleTab, setScheduleTab] = useState('manual');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { isDirty, isSubmitting }
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      scheduleSlots: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day.value]: [] }), {})
    }
  });

  // Initialize form with client profile data
  useEffect(() => {
    if (clientProfile) {
      const scheduleSlots = parseClientSlotsToScheduleSlots(clientProfile.schedule || []);
      reset({
        fullName: clientProfile.fullName || '',
        phone: clientProfile.phone || '',
        address: clientProfile.address || '',
        scheduleSlots
      });
    }
  }, [clientProfile, reset]);

  const watchedScheduleSlots = watch('scheduleSlots');

  const handleTimeSlotChange = (dayOfWeek: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const currentScheduleSlots = { ...watchedScheduleSlots };
    currentScheduleSlots[dayOfWeek] = currentScheduleSlots[dayOfWeek].map((slot, index) =>
      index === slotIndex ? { ...slot, [field]: value } : slot
    );
    setValue('scheduleSlots', currentScheduleSlots, { shouldDirty: true });
  };

  const handleAddTimeSlot = (dayOfWeek: number) => {
    const currentScheduleSlots = { ...watchedScheduleSlots };
    currentScheduleSlots[dayOfWeek] = [
      ...(currentScheduleSlots[dayOfWeek] || []),
      { startTime: '09:00', endTime: '17:00' }
    ];
    setValue('scheduleSlots', currentScheduleSlots, { shouldDirty: true });
  };

  const handleRemoveTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    const currentScheduleSlots = { ...watchedScheduleSlots };
    currentScheduleSlots[dayOfWeek] = currentScheduleSlots[dayOfWeek].filter((_, index) => index !== slotIndex);
    setValue('scheduleSlots', currentScheduleSlots, { shouldDirty: true });
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const scheduleArray = convertScheduleSlotsToArray(data.scheduleSlots);

      console.log('Form data before submit:', data);
      console.log('Submitting profile update:', {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        schedule: scheduleArray
      });

      await updateProfile.mutateAsync({
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        schedule: scheduleArray
      });

      toast({
        title: t('common.success'),
        description: t('profile.profileUpdated'), //88888888
      });

      // Reset form state to make it no longer dirty
      reset(data);
    } catch (error: unknown) {
      toast({
        title: t('common.error'),
        description: (error as Error).message || t('profile.profileUpdateError'),
        variant: "destructive",
      });
    }
  };

  const handleAIScheduleGenerated = async (generatedSchedule: any) => {
    console.log('Received AI schedule in Profile:', generatedSchedule);
    
    // Convert AI-generated schedule to the form format
    const convertedSchedule: ScheduleSlots = {};

    // Initialize all days with empty arrays
    DAYS_OF_WEEK.forEach(day => {
      convertedSchedule[day.value] = [];
    });

    // Populate with AI-generated data
    Object.entries(generatedSchedule).forEach(([dayName, slots]: [string, any]) => {
      const dayIndex = DAYS_OF_WEEK.find(d => d.label.toLowerCase() === dayName.toLowerCase())?.value;
      if (dayIndex !== undefined && Array.isArray(slots)) {
        convertedSchedule[dayIndex] = slots;
      }
    });

    console.log('Converted schedule:', convertedSchedule);
    
    // Update the form with the new schedule
    setValue('scheduleSlots', convertedSchedule, { shouldDirty: true });

    // Get current form values
    const currentValues = getValues();
    
    try {
      // Auto-save the schedule to database
      const scheduleArray = convertScheduleSlotsToArray(convertedSchedule);
      
      await updateProfile.mutateAsync({
        fullName: currentValues.fullName,
        phone: currentValues.phone,
        address: currentValues.address,
        schedule: scheduleArray
      });

      // Reset form with new values to clear dirty state
      reset({
        ...currentValues,
        scheduleSlots: convertedSchedule
      });

      toast({
        title: t('common.success'),
        description: t('aiSchedule.generationSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.profileUpdateError'),
        variant: "destructive",
      });
    }

    // Switch back to manual tab to show the applied schedule
    setScheduleTab('manual');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <p className="text-gray-500">Please log in again to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Profile Header */}
            <Card className="shadow-sm border-0 overflow-hidden rounded-none">
              <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={clientProfile?.avatarUrl || undefined}
                        alt={clientProfile?.fullName}
                      />
                      <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                        {clientProfile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-semibold" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>
                        {t('profile.title')}
                      </h1>
                      <p className="text-white/80">{t('profile.personalInfo')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'fr' | 'ar')}>
                      <SelectTrigger className="w-[120px] bg-white/20 border-white/30 text-white">
                        <Language className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={t('common.language')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                      {clientProfile?.role?.charAt(0).toUpperCase() + clientProfile?.role?.slice(1) || 'Client'}
                    </Badge>
                    <Button
                      type="submit"
                      disabled={!isDirty || isSubmitting}
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSubmitting ? t('common.loading') : t('profile.updateProfile')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Information */}
            <Card className="shadow-sm border-0 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Person className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('profile.personalInfo')}</h2>
                </div>
              </div>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('profile.firstName')} {t('profile.lastName')}</Label>
                    <Input
                      id="fullName"
                      {...register('fullName', { required: true })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.email')}</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-900">{user.email}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('profile.phone')}</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('profile.businessAddress')}</Label>
                    <Input
                      id="address"
                      {...register('address')}
                      placeholder="Enter your address"
                    />
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Status */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                        <div className="p-3 bg-green-50 rounded-md border border-green-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-800 font-medium">Active</span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">Your account is in good standing</p>
                        </div>
                      </div>

                      {/* Account Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-center gap-2">
                            <Person className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-800 font-medium capitalize">
                              {clientProfile?.role || 'Client'}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">Standard booking privileges</p>
                        </div>
                      </div>

                      {/* Member Since */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center gap-2">
                            <CalendarToday className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-800 font-medium">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long'
                              }) : 'Recently'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Account creation date</p>
                        </div>
                      </div>

                      {/* Security Settings */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Security</Label>
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-800 font-medium">Protected</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Email verification completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability Schedule */}
            <Card className="shadow-sm border-0 overflow-hidden mt-8 rounded-none">
              <div className="px-6 py-3 text-white" style={{backgroundColor: '#025bae'}}>
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Schedule className="w-5 h-5" />
                    {t('profile.schedule')}
                  </h2>
                </div>
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
                      <div key={day.value} className="border-l-4 bg-gray-50 rounded-r-lg p-4" style={{borderLeftColor: watchedScheduleSlots[day.value]?.length > 0 ? '#025bae' : '#d1d5db'}}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${watchedScheduleSlots[day.value]?.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <Label className="font-medium text-gray-900">{day.label}</Label>
                            <span className="text-xs text-gray-500">
                              {watchedScheduleSlots[day.value]?.length || 0} time slots
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleAddTimeSlot(day.value)}
                            size="sm"
                            className="text-xs text-white hover:opacity-90"
                            style={{backgroundColor: '#025bae'}}
                          >
                            <Add className="w-3 h-3 mr-1" />
                            Add Time Slot
                          </Button>
                        </div>

                        {/* Time Slots for this day */}
                        <div className="space-y-2">
                          {watchedScheduleSlots[day.value]?.map((slot, slotIndex) => (
                            <div key={slotIndex} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => handleTimeSlotChange(day.value, slotIndex, 'startTime', e.target.value)}
                                className="w-32 text-sm"
                              />
                              <span className="text-gray-500 text-sm">to</span>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => handleTimeSlotChange(day.value, slotIndex, 'endTime', e.target.value)}
                                className="w-32 text-sm"
                              />
                              <Button
                                type="button"
                                onClick={() => handleRemoveTimeSlot(day.value, slotIndex)}
                                size="sm"
                                variant="ghost"
                                className="hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                              >
                                <Close className="w-4 h-4" style={{color: 'black'}} />
                              </Button>
                            </div>
                          ))}

                          {watchedScheduleSlots[day.value]?.length === 0 && (
                            <div className="text-center py-2 text-gray-500 text-sm">
                              No time slots set for this day
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Add multiple time slots per day to show when you're available. Changes will be saved when you click "Save Changes".
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="mt-6">
                    <AIScheduleCreator onScheduleGenerated={handleAIScheduleGenerated} />
                  </TabsContent>
                </Tabs>

                {isDirty && (
                  <div className="text-center py-2">
                    <span className="text-sm text-amber-600">You have unsaved changes</span>
                  </div>
                )}
              </CardContent>
            </Card>

            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;