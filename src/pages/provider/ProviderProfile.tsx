
import React, { useState } from 'react';
import { useProviderProfile, useUpdateProviderProfile } from '@/hooks/useProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Star } from 'lucide-react';

const ProviderProfile = () => {
  const { data: provider, isLoading } = useProviderProfile();
  const updateProfile = useUpdateProviderProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    business_address: '',
    business_phone: '',
    business_email: '',
  });

  React.useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || '',
        business_description: provider.business_description || '',
        business_address: provider.business_address || '',
        business_phone: provider.business_phone || '',
        business_email: provider.business_email || '',
      });
    }
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
            <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
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
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_description">Business Description</Label>
                    <Textarea
                      id="business_description"
                      value={formData.business_description}
                      onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_address">Business Address</Label>
                    <Input
                      id="business_address"
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_phone">Phone Number</Label>
                    <Input
                      id="business_phone"
                      type="tel"
                      value={formData.business_phone}
                      onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{provider.business_name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{provider.rating || 0}</span>
                      <span className="text-gray-500">({provider.total_reviews || 0} reviews)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {provider.business_description && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Description</Label>
                        <p className="mt-1 text-gray-900">{provider.business_description}</p>
                      </div>
                    )}

                    {provider.business_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Address</Label>
                          <p className="mt-1 text-gray-900">{provider.business_address}</p>
                        </div>
                      </div>
                    )}

                    {provider.business_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Phone</Label>
                          <p className="mt-1 text-gray-900">{provider.business_phone}</p>
                        </div>
                      </div>
                    )}

                    {provider.business_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Email</Label>
                          <p className="mt-1 text-gray-900">{provider.business_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
