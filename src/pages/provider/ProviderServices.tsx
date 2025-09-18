
import React, { useState, useMemo } from 'react';
import { useProviderProfile, useProviderServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useProvider';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { useProviderSchedule } from '@/hooks/useProviderSchedule';
import { Service } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Add,
  Edit,
  AttachMoney,
  Schedule,
  LocalOffer,
  Delete
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

interface ServiceSlots {
  [dayOfWeek: number]: TimeRange[];
}

// Helper functions to convert between formats
const parseServiceSlotsToServiceSlots = (serviceSlots: string[]): ServiceSlots => {
  const result: ServiceSlots = {};
  serviceSlots.forEach(slotString => {
    try {
      const parsed = JSON.parse(slotString);
      if (parsed.dayOfWeek !== undefined && parsed.startTime && parsed.endTime) {
        if (!result[parsed.dayOfWeek]) {
          result[parsed.dayOfWeek] = [];
        }
        result[parsed.dayOfWeek].push({
          startTime: parsed.startTime,
          endTime: parsed.endTime
        });
      }
    } catch (e) {
      console.warn('Failed to parse slot:', slotString);
    }
  });
  return result;
};

const convertServiceSlotsToArray = (serviceSlots: ServiceSlots): string[] => {
  const result: string[] = [];
  Object.entries(serviceSlots).forEach(([dayOfWeek, ranges]) => {
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

const ProviderServices = () => {
  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: services = [], isLoading: servicesLoading } = useProviderServices();
  const { data: categories = [] } = useServiceCategories();
  const { data: providerSchedule = [] } = useProviderSchedule();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    categoryId: '',
    maxBookingsPerDay: '',
    requirements: '',
    tags: '',
    slots: {} as ServiceSlots,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get available days from provider schedule
  const availableDays = useMemo(() => {
    return providerSchedule
      .filter(schedule => schedule.isAvailable)
      .map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        dayLabel: DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label || '',
        minTime: schedule.startTime,
        maxTime: schedule.endTime
      }));
  }, [providerSchedule]);

  const handleAddTimeRange = (dayOfWeek: number) => {
    const daySchedule = providerSchedule.find(s => s.dayOfWeek === dayOfWeek);
    const defaultStart = daySchedule?.startTime || '09:00';
    const defaultEnd = daySchedule?.endTime || '17:00';

    setFormData(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [dayOfWeek]: [
          ...(prev.slots[dayOfWeek] || []),
          { startTime: defaultStart, endTime: defaultEnd }
        ]
      }
    }));
  };

  const handleRemoveTimeRange = (dayOfWeek: number, index: number) => {
    setFormData(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [dayOfWeek]: prev.slots[dayOfWeek]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const handleTimeRangeChange = (dayOfWeek: number, index: number, field: keyof TimeRange, value: string) => {
    setFormData(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [dayOfWeek]: prev.slots[dayOfWeek]?.map((range: TimeRange, i) =>
          i === index ? { ...range, [field]: value } : range
        ) || []
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: '',
      maxBookingsPerDay: '',
      requirements: '',
      tags: '',
      slots: {},
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Name validation (min 2 characters)
    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Service name must be at least 2 characters';
    }

    // Description validation (min 10 characters)
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    // Category validation (required)
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    // Price validation (required, positive number)
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (parseFloat(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
    }

    // Duration validation (required, positive integer)
    if (!formData.duration) {
      errors.duration = 'Duration is required';
    } else if (parseInt(formData.duration) < 1) {
      errors.duration = 'Duration must be at least 1 minute';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await createService.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        categoryId: formData.categoryId,
        maxBookingsPerDay: formData.maxBookingsPerDay ? parseInt(formData.maxBookingsPerDay) : 10,
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        slots: convertServiceSlotsToArray(formData.slots),
      });

      toast({
        title: "Service created",
        description: "Your new service has been added successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateService.mutateAsync({
        id: editingService._id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        categoryId: formData.categoryId,
        maxBookingsPerDay: formData.maxBookingsPerDay ? parseInt(formData.maxBookingsPerDay) : 10,
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        slots: convertServiceSlotsToArray(formData.slots),
      });

      toast({
        title: "Service updated",
        description: "Your service has been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingService(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      categoryId: service.category?._id || '',
      maxBookingsPerDay: service.maxBookingsPerDay?.toString() || '10',
      requirements: service.requirements?.join(', ') || '',
      tags: service.tags?.join(', ') || '',
      slots: service.slots ? parseServiceSlotsToServiceSlots(service.slots) : {},
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await deleteService.mutateAsync(serviceId);
      toast({
        title: "Service deleted",
        description: "Your service has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (providerLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
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
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Add className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl [&>button]:text-white [&>button]:w-6 [&>button]:h-6 [&>button]:top-4 [&>button]:right-4" style={{borderRadius: 0, border: 'none'}}>
                {/* Colored Header */}
                <div className="-mx-6 -mt-6 px-6 py-4 text-white rounded-none" style={{backgroundColor: '#025bae'}}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-none">
                      <Add className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Create New Service</h2>
                      <p className="text-blue-100 text-sm">Add a new service to your offerings</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleCreateService} className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="name">Service Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={formErrors.description ? 'border-red-500' : ''}
                      placeholder="Enter at least 10 characters"
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($) <span className="text-red-500">*</span></Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        className={formErrors.price ? 'border-red-500' : ''}
                      />
                      {formErrors.price && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes) <span className="text-red-500">*</span></Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                        className={formErrors.duration ? 'border-red-500' : ''}
                      />
                      {formErrors.duration && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.duration}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                      <SelectTrigger className={formErrors.categoryId ? 'border-red-500' : ''}>
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
                    {formErrors.categoryId && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.categoryId}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxBookingsPerDay">Max Bookings/Day</Label>
                      <Input
                        id="maxBookingsPerDay"
                        type="number"
                        value={formData.maxBookingsPerDay}
                        onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="requirements">Requirements (comma separated)</Label>
                    <Input
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Valid ID, Prior appointment"
                    />
                  </div>
                  <div>
                    <Label>Service Availability</Label>
                    <div className="mt-2 space-y-3 max-h-60 overflow-y-auto border rounded-md p-4">
                      {availableDays.length > 0 ? (
                        availableDays.map((day) => (
                          <div key={day.dayOfWeek} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium text-sm">{day.dayLabel}</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddTimeRange(day.dayOfWeek)}
                                className="h-7 px-2 text-xs"
                              >
                                + Add Time
                              </Button>
                            </div>
                            <div className="space-y-2 pl-4">
                              {(formData.slots[day.dayOfWeek] || []).map((range, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={range.startTime}
                                    onChange={(e) => handleTimeRangeChange(day.dayOfWeek, index, 'startTime', e.target.value)}
                                    min={day.minTime}
                                    max={day.maxTime}
                                    className="w-32 h-8 text-xs"
                                  />
                                  <span className="text-gray-500 text-xs">to</span>
                                  <Input
                                    type="time"
                                    value={range.endTime}
                                    onChange={(e) => handleTimeRangeChange(day.dayOfWeek, index, 'endTime', e.target.value)}
                                    min={day.minTime}
                                    max={day.maxTime}
                                    className="w-32 h-8 text-xs"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveTimeRange(day.dayOfWeek, index)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No available days. Please set up your schedule first.</p>
                      )}
                    </div>
                  </div>
                  {/* <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="professional, consultation"
                    />
                  </div> */}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createService.isPending}>
                      {createService.isPending ? "Creating..." : "Create Service"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
                <p className="text-gray-600 mb-4">Create your first service to start accepting bookings.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Add className="w-4 h-4 mr-2" />
                  Add Your First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const getStatusColor = (isActive: boolean) => {
                  return isActive ? '#025bae' : '#6b7280';
                };

                const getStatusBadge = (isActive: boolean) => {
                  const badgeClass = isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200';

                  return (
                    <Badge variant="outline" className={`font-medium ${badgeClass}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  );
                };

                return (
                  <Card key={service._id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0 overflow-hidden">
                    {/* Colored Header */}
                    <div className="px-6 py-4 text-white" style={{backgroundColor: getStatusColor(service.isActive !== false)}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-full">
                            <LocalOffer className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-lg truncate">
                              {service.name}
                            </h3>
                            <p className="text-white/80 text-sm truncate">
                              {service.category?.name || 'No category'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                            className="text-white hover:bg-white/20 h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service._id)}
                            className="text-white hover:bg-red-500/20 h-8 w-8 p-0"
                          >
                            <Delete className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Description */}
                        {service.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {service.description}
                          </p>
                        )}

                        {/* Price & Duration */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AttachMoney style={{ fontSize: 16, color: '#025bae' }} />
                            <div>
                              <p className="text-lg font-semibold text-gray-900">${service.price}</p>
                              <p className="text-xs text-gray-500">Price</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Schedule style={{ fontSize: 16, color: '#025bae' }} />
                            <div>
                              <p className="text-lg font-semibold text-gray-900">{service.duration}</p>
                              <p className="text-xs text-gray-500">minutes</p>
                            </div>
                          </div>
                        </div>

                        {/* Status and Bookings */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {getStatusBadge(service.isActive !== false)}
                          <span className="text-xs text-gray-500">
                            Max {service.maxBookingsPerDay || 10}/day
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl rounded-none sm:rounded-none [&>button]:text-white [&>button]:w-8 [&>button]:h-8 [&>button]:top-4 [&>button]:right-4 [&>button>svg]:w-6 [&>button>svg]:h-6">
              {/* Colored Header */}
              <div className="-mx-6 -mt-6 px-6 py-4 text-white" style={{backgroundColor: '#025bae', padding: '1.43rem'}}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Edit Service</h2>
                    <p className="text-blue-100 text-sm">Update your service details</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleEditService} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="edit-name">Service Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-description">Description <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={formErrors.description ? 'border-red-500' : ''}
                    placeholder="Enter at least 10 characters"
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price">Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className={formErrors.price ? 'border-red-500' : ''}
                    />
                    {formErrors.price && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-duration">Duration (minutes) <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                      className={formErrors.duration ? 'border-red-500' : ''}
                    />
                    {formErrors.duration && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.duration}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className={formErrors.categoryId ? 'border-red-500' : ''}>
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
                  {formErrors.categoryId && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.categoryId}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-maxBookingsPerDay">Max Bookings/Day</Label>
                    <Input
                      id="edit-maxBookingsPerDay"
                      type="number"
                      value={formData.maxBookingsPerDay}
                      onChange={(e) => setFormData({ ...formData, maxBookingsPerDay: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-requirements">Requirements (comma separated)</Label>
                  <Input
                    id="edit-requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Valid ID, Prior appointment"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                  <Input
                    id="edit-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="professional, consultation"
                  />
                </div>
                <div>
                  <Label>Service Availability</Label>
                  <div className="mt-2 space-y-3 max-h-60 overflow-y-auto border rounded-md p-4">
                    {availableDays.length > 0 ? (
                      availableDays.map((day) => (
                        <div key={day.dayOfWeek} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium text-sm">{day.dayLabel}</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddTimeRange(day.dayOfWeek)}
                              className="h-7 px-2 text-xs"
                            >
                              + Add Time
                            </Button>
                          </div>
                          <div className="space-y-2 pl-4">
                            {(formData.slots[day.dayOfWeek] || []).map((range, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={range.startTime}
                                  onChange={(e) => handleTimeRangeChange(day.dayOfWeek, index, 'startTime', e.target.value)}
                                  min={day.minTime}
                                  max={day.maxTime}
                                  className="w-32 h-8 text-xs"
                                />
                                <span className="text-gray-500 text-xs">to</span>
                                <Input
                                  type="time"
                                  value={range.endTime}
                                  onChange={(e) => handleTimeRangeChange(day.dayOfWeek, index, 'endTime', e.target.value)}
                                  min={day.minTime}
                                  max={day.maxTime}
                                  className="w-32 h-8 text-xs"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveTimeRange(day.dayOfWeek, index)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No available days. Please set up your schedule first.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateService.isPending}>
                    {updateService.isPending ? "Updating..." : "Update Service"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProviderServices;
