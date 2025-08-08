
import React, { useState } from 'react';
import { useProviderProfile, useProviderServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks/useProvider';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, DollarSign, Clock, Tag, Trash2 } from 'lucide-react';

const ProviderServices = () => {
  const { data: provider, isLoading: providerLoading } = useProviderProfile();
  const { data: services = [], isLoading: servicesLoading } = useProviderServices();
  const { data: categories = [] } = useServiceCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    maxBookingsPerDay: '',
    requirements: '',
    tags: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
      maxBookingsPerDay: '',
      requirements: '',
      tags: '',
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
    if (!formData.category) {
      errors.category = 'Category is required';
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
        category: formData.category,
        maxBookingsPerDay: formData.maxBookingsPerDay ? parseInt(formData.maxBookingsPerDay) : 10,
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
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
        category: formData.category,
        maxBookingsPerDay: formData.maxBookingsPerDay ? parseInt(formData.maxBookingsPerDay) : 10,
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
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

  const openEditDialog = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category._id || '',
      maxBookingsPerDay: service.maxBookingsPerDay?.toString() || '10',
      requirements: service.requirements?.join(', ') || '',
      tags: service.tags?.join(', ') || '',
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
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateService} className="space-y-4">
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
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
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
                    {formErrors.category && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
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
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="professional, consultation"
                    />
                  </div>
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
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(service)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service._id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.description && (
                        <p className="text-gray-600 text-sm">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                          <span className="font-semibold">${service.price}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                      {service.category && (
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-1 text-blue-600" />
                          <Badge variant="secondary" className="text-xs">
                            {service.category.name}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant={service.isActive !== false ? "default" : "secondary"}>
                          {service.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditService} className="space-y-4">
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
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
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
                  {formErrors.category && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
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
