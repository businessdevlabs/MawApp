import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProviderProfile, useUpdateProviderProfile } from '@/hooks/useProvider';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Star } from 'lucide-react';
import ProviderMap from '@/components/maps/ProviderMap';

// Form validation schema
const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessDescription: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email('Please enter a valid email address'),
  website: z.string().url('Please enter a valid website URL (e.g., https://example.com)').or(z.literal('')),
  category: z.string().min(1, 'Business category is required').optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProviderProfile = () => {
  const { data: provider, isLoading } = useProviderProfile();
  const { data: categories = [] } = useServiceCategories();
  const updateProfile = useUpdateProviderProfile();
  const { toast } = useToast();

  // Debug categories
  React.useEffect(() => {
    console.log('Available categories:', categories);
  }, [categories]);

  // Initialize form with React Hook Form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      website: '',
      category: '',
      coordinates: undefined
    }
  });

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = form;

  React.useEffect(() => {
    if (provider) {
      console.log('Provider data:', provider);
      console.log('Provider category:', provider.category);
      const initialData = {
        businessName: provider.businessName || '',
        businessDescription: provider.businessDescription || '',
        businessAddress: provider.businessAddress || '',
        businessPhone: provider.businessPhone || '',
        businessEmail: provider.businessEmail || '',
        website: provider.website || '',
        category: provider.category?._id || provider.category || '',
        coordinates: provider.coordinates || undefined
      };
      console.log('Form initial data:', initialData);
      reset(initialData);
    }
  }, [provider, reset]);

  // Handle map address selection (only updates coordinates, not the address field)
  const handleMapAddressSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    console.log('Map address selected:', address, coordinates);
    // Only update coordinates, not the address field
    form.setValue('coordinates', coordinates, { shouldDirty: true });
  };


  // Form submit handler
  const onSubmit = async (data: ProfileFormData) => {
    try {
      console.log('Form data being submitted:', data);
      
      // Transform data to match API expectations
      const apiData = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessAddress: data.businessAddress,
        businessPhone: data.businessPhone,
        businessEmail: data.businessEmail,
        website: data.website,
        category: data.category,
        coordinates: data.coordinates && data.coordinates.lat && data.coordinates.lng 
          ? data.coordinates 
          : undefined
      };
      
      console.log('API data:', apiData);
      
      await updateProfile.mutateAsync(apiData);
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
              {isDirty && (
                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  You have unsaved changes
                </p>
              )}
            </div>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Business Information</CardTitle>
                <Badge variant={provider.status === 'approved' ? 'default' : 'secondary'}>
                  {provider.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Always show editable form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
                    <Controller
                      name="businessName"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessName"
                          className={errors.businessName ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Controller
                      name="businessDescription"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="businessDescription"
                          rows={3}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Controller
                      name="businessAddress"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessAddress"
                        />
                      )}
                    />
                  </div>

                  {/* Map Component - coordinates updated separately from address text field */}
                  {/* <div>
                    <ProviderMap
                      address={provider?.businessAddress || ''}
                      businessName={provider?.businessName || ''}
                      coordinates={
                        (form.watch('coordinates') && form.watch('coordinates')?.lat && form.watch('coordinates')?.lng) 
                          ? form.watch('coordinates') 
                          : (provider?.coordinates && provider.coordinates.lat && provider.coordinates.lng)
                            ? provider.coordinates
                            : null
                      }
                      onAddressSelect={handleMapAddressSelect}
                      isEditing={true}
                      height="300px"
                    />
                  </div> */}


                  <div>
                    <Label htmlFor="businessPhone">Phone Number</Label>
                    <Controller
                      name="businessPhone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessPhone"
                          type="tel"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessEmail">Business Email <span className="text-red-500">*</span></Label>
                    <Controller
                      name="businessEmail"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessEmail"
                          type="email"
                          className={errors.businessEmail ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.businessEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="website"
                          type="url"
                          placeholder="https://your-website.com"
                          className={errors.website ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.website && (
                      <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Business Category</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfile.isPending || !isDirty}
                      className={!isDirty ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;