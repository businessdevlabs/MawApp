import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProviderProfile, useUpdateProviderProfile } from '@/hooks/useProvider';
import { useServiceCategories, useCategorySubcategories } from '@/hooks/useServiceCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Business, Info, CameraAlt, Close } from '@mui/icons-material';
import ProviderMap from '@/components/maps/ProviderMap';

// Removed hardcoded subcategories - now fetched dynamically from API

// Form validation schema
const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  businessEmail: z.string().email('Please enter a valid email address').optional(),
  website: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  coordinates: z.object({
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
  }).optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProviderProfile = () => {
  const { data: provider, isLoading } = useProviderProfile();
  const { data: categories = [] } = useServiceCategories();
  const updateProfile = useUpdateProviderProfile();
  const { toast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fetch subcategories dynamically when category is selected
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useCategorySubcategories(selectedCategoryId || '');
  const availableSubcategories = React.useMemo(() => subcategoriesData?.subcategories || [], [subcategoriesData]);

  // Debug subcategories loading
  React.useEffect(() => {
    console.log('Subcategories state:', {
      selectedCategoryId,
      subcategoriesLoading,
      subcategoriesData,
      availableSubcategories
    });
  }, [selectedCategoryId, subcategoriesLoading, subcategoriesData, availableSubcategories]);

   // Initialize form with React Hook Form
   const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      website: null,
      category: null,
      subcategory: null,
      coordinates: undefined
    }
  });
  
  // Ensure subcategory is preserved when subcategories are loaded
  React.useEffect(() => {
    if (provider?.subcategory && availableSubcategories.length > 0 && !subcategoriesLoading) {
      const currentSubcategory = form.getValues('subcategory');
      if (!currentSubcategory && availableSubcategories.includes(provider.subcategory)) {
        console.log('Restoring subcategory value:', provider.subcategory);
        form.setValue('subcategory', provider.subcategory, { shouldDirty: false });
      }
    }
  }, [provider?.subcategory, availableSubcategories, subcategoriesLoading, form]);

  // Debug categories
  React.useEffect(() => {
    console.log('Available categories:', categories);
  }, [categories]);



  const { control, handleSubmit, reset, formState: { errors, isDirty } } = form;

  console.log('errors22', errors);
  React.useEffect(() => {
    if (provider) {
      console.log('Provider data:', provider);
      console.log('Provider category:', provider.category);
      console.log('Provider subcategory:', provider.subcategory);
      console.log('Provider profilePhoto:', provider.profilePhoto);
      const initialData = {
        businessName: provider.businessName || '',
        businessDescription: provider.businessDescription || '',
        businessAddress: provider.businessAddress || '',
        businessPhone: provider.businessPhone || '',
        businessEmail: provider.businessEmail || '',
        website: provider.website,
        category: typeof provider.category === 'object' ? provider.category._id : provider.category,
        subcategory: provider.subcategory || null,
        coordinates: provider.coordinates,
      };
      console.log('Form initial data:', initialData);
      reset(initialData);

      // Set initial category for subcategory fetching
      if (provider.category) {
        const categoryId = typeof provider.category === 'object' ? provider.category._id : provider.category;
        console.log('Setting selectedCategoryId to:', categoryId);
        setSelectedCategoryId(categoryId);
      }

      // Clear any previously selected photo when provider data loads
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  }, [provider, reset]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    console.log('Category changed to:', categoryId);

    // Update selected category ID for subcategory fetching
    setSelectedCategoryId(categoryId);

    // Reset subcategory when category changes
    form.setValue('subcategory', null);
    form.setValue('category', categoryId);
  };

  // Get selected category name for conditional rendering
  const getSelectedCategoryName = () => {
    if (!selectedCategoryId) return null;
    const category = categories.find(cat => cat._id === selectedCategoryId);
    return category?.name || null;
  };

  const selectedCategoryName = getSelectedCategoryName();

  // Handle photo selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle map address selection (only updates coordinates, not the address field)
  const handleMapAddressSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    console.log('Map address selected:', address, coordinates);
    // Only update coordinates, not the address field
    form.setValue('coordinates', coordinates, { shouldDirty: true });
  };


  // Form submit handler
  const onSubmit = async (data: ProfileFormData) => {
    try {
      console.log('🚀 Form submission started');
      console.log('Form data being submitted:', data);

      // Transform data to match API expectations (exclude businessEmail as it's read-only)
      const apiData = {
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessAddress: data.businessAddress,
        businessPhone: data.businessPhone,
        website: data.website,
        category: data.category,
        subcategory: data.subcategory,
        coordinates: data.coordinates && typeof data.coordinates.lat === 'number' && typeof data.coordinates.lng === 'number'
          ? { lat: data.coordinates.lat, lng: data.coordinates.lng }
          : undefined
      };

      console.log('API data:', apiData);
      console.log('Selected photo:', selectedPhoto);
      console.log('Has photo:', !!selectedPhoto);
      console.log('Mutation pending:', updateProfile.isPending);

      console.log('🔄 Starting mutation...');
      await updateProfile.mutateAsync({
        profileData: apiData,
        profilePhoto: selectedPhoto || undefined
      });
      console.log('✅ Mutation completed successfully');

      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });

      // Clear selected photo after successful update
      setSelectedPhoto(null);
      setPhotoPreview(null);
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center py-8">
          <div className="w-full max-w-3xl mx-auto px-6 space-y-6">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Card className="shadow-lg border-0 overflow-hidden rounded-xl">
              <CardContent className="p-8 space-y-6">
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-16">
          <div className="w-full max-w-md mx-auto text-center px-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Profile Not Found</h1>
              <p className="text-gray-600">Please complete your provider registration.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-center py-8">
        <div className="w-full max-w-3xl mx-auto px-6 space-y-6">
          {/* Header */}
          {isDirty && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                You have unsaved changes
              </p>
            </div>
          )}

          {/* Profile Card */}
          <Card className="shadow-lg border-0 overflow-hidden rounded-xl">
            {/* Colored Header */}
            <div className="bg-blue-500 px-8 py-6 text-white">
              <div className="flex items-center justify-center text-center">
                <div className="flex flex-col items-center gap-3">
                  {/* Profile Photo Section */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 flex items-center justify-center">
                      {photoPreview || provider?.profilePhoto ? (
                        <img
                          src={photoPreview || (
                            provider?.profilePhoto?.startsWith('http')
                              ? provider.profilePhoto
                              : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${provider?.profilePhoto}`
                          )}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', e.currentTarget.src);
                            console.log('photoPreview:', photoPreview);
                            console.log('provider.profilePhoto:', provider?.profilePhoto);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', photoPreview || provider?.profilePhoto);
                          }}
                        />
                      ) : (
                        <Business className="w-8 h-8 text-white/70" />
                      )}
                    </div>
                    {/* Photo Upload Button */}
                    <label
                      htmlFor="photo-upload"
                      className="absolute -bottom-1 -right-1 bg-white text-blue-500 p-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors shadow-lg"
                    >
                      <CameraAlt className="w-3 h-3" />
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {/* Remove Photo Button */}
                    {(photoPreview || provider?.profilePhoto) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Close className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Business Information</h2>
                    <p className="text-blue-100 text-sm">Manage your business profile and details</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-medium border-white/30 text-white ${provider.status === 'approved' ? 'bg-green-500/20' : 'bg-white/20'}`}
                  >
                    {provider.status}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                    <Label htmlFor="businessDescription">Description <span className="text-red-500">*</span></Label>
                    <Controller
                      name="businessDescription"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="businessDescription"
                          rows={5}
                          className={errors.businessDescription ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.businessDescription && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessDescription.message}</p>
                    )}
                  </div>

                  {/* Business Category & Specialization Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Business Category</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={handleCategoryChange}>
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

                    {/* Subcategory - always show but conditionally enabled */}
                    <div className="space-y-2">
                      <Label htmlFor="subcategory">
                        Specialization
                        {selectedCategoryName === 'Health & Wellness' && <span className="text-red-500">*</span>}
                      </Label>
                      <Controller
                        name="subcategory"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            disabled={!selectedCategoryId || subcategoriesLoading || availableSubcategories.length === 0}
                          >
                            <SelectTrigger className={`${errors.subcategory ? 'border-red-500' : ''} ${!selectedCategoryId || subcategoriesLoading || availableSubcategories.length === 0 ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                              <SelectValue
                                placeholder={
                                  !selectedCategoryId
                                    ? "Select a category first"
                                    : subcategoriesLoading
                                    ? "Loading..."
                                    : availableSubcategories.length === 0
                                    ? "No specializations"
                                    : selectedCategoryName === 'Health & Wellness'
                                    ? "Select specialization"
                                    : "Select specialization"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubcategories.map((subcategory) => (
                                <SelectItem key={subcategory} value={subcategory}>
                                  {subcategory}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {selectedCategoryName === 'Health & Wellness' && (
                        <p className="text-sm text-gray-500 mt-1">
                          Required for medical providers
                        </p>
                      )}
                      {!selectedCategoryId && (
                        <p className="text-sm text-gray-500 mt-1">
                          Select category first
                        </p>
                      )}
                      {selectedCategoryId && subcategoriesLoading && (
                        <p className="text-sm text-gray-500 mt-1">
                          Loading specializations...
                        </p>
                      )}
                      {selectedCategoryId && !subcategoriesLoading && availableSubcategories.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          No specializations available
                        </p>
                      )}
                      {errors.subcategory && (
                        <p className="text-sm text-red-500 mt-1">{errors.subcategory.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessAddress"> Street Address <span className="text-red-500">*</span></Label>
                    <Controller
                      name="businessAddress"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessAddress"
                          className={errors.businessAddress ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.businessAddress && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessAddress.message}</p>
                    )}
                  </div>

                  {/* Map Component - coordinates updated separately from address text field */}
                  <div>
                  <Label htmlFor="businessAddress"> Location <span className="text-red-500">*</span></Label>
                    <ProviderMap
                      address={provider?.businessAddress || ''}
                      businessName={provider?.businessName || ''}
                      coordinates={
                        (form.watch('coordinates') && form.watch('coordinates')?.lat && form.watch('coordinates')?.lng)
                          ? { lat: form.watch('coordinates')!.lat!, lng: form.watch('coordinates')!.lng! }
                          : (provider?.coordinates && provider.coordinates.lat && provider.coordinates.lng)
                            ? { lat: provider.coordinates.lat, lng: provider.coordinates.lng }
                            : null
                      }
                      onAddressSelect={handleMapAddressSelect}
                      isEditing={true}
                      height="300px"
                    />
                  </div>


                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Phone Number <span className="text-red-500">*</span></Label>
                      <Controller
                        name="businessPhone"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="businessPhone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            className={errors.businessPhone ? 'border-red-500' : ''}
                          />
                        )}
                      />
                      {errors.businessPhone && (
                        <p className="text-sm text-red-500 mt-1">{errors.businessPhone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Controller
                        name="website"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="website"
                            placeholder="https://your-website.com"
                            className={errors.website ? 'border-red-500' : ''}
                          />
                        )}
                      />
                      {errors.website && (
                        <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Business Email - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Controller
                      name="businessEmail"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="businessEmail"
                          type="email"
                          disabled
                          className="bg-gray-50 text-gray-600 cursor-not-allowed"
                        />
                      )}
                    />
                    <p className="text-sm text-gray-500 mt-1">Business email is set to your account email and cannot be changed</p>
                  </div>

                  {/* Submit Section */}
                  <div className="flex justify-center pt-8 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending || !isDirty}
                      className={`px-8 py-3 rounded-lg font-medium ${!isDirty ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      size="lg"
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