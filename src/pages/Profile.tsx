import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Shield,
  Edit,
  Save,
  Close
} from '@mui/icons-material';

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the profile
      // await updateProfile(formData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile?.fullName || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setIsEditing(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile Header */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-4 text-white" style={{backgroundColor: '#025bae'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={profile?.avatarUrl || undefined}
                      alt={profile?.fullName}
                    />
                    <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                      {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>
                      My Profile
                    </h1>
                    <p className="text-white/80">Manage your account information</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                    {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Client'}
                  </Badge>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <p className="text-white/80 text-sm">Your account details and contact information</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-900">{profile?.fullName || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address
                  </Label>
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
                  <Label htmlFor="phone">
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-900">{profile?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-gray-900">{profile?.address || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <Button onClick={handleSave} style={{backgroundColor: '#025bae'}}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        <Close className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="px-6 py-3 text-white" style={{backgroundColor: '#4a90e2'}}>
              <h2 className="text-lg font-semibold">Account Information</h2>
              <p className="text-white/80 text-sm">Your account status and settings</p>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield style={{ fontSize: 16, color: '#025bae' }} />
                    <span className="text-sm font-medium text-gray-900">Account Status</span>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarToday style={{ fontSize: 16, color: '#025bae' }} />
                    <span className="text-sm font-medium text-gray-900">Member Since</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Person style={{ fontSize: 16, color: '#025bae' }} />
                    <span className="text-sm font-medium text-gray-900">Account Type</span>
                  </div>
                  <span className="text-sm text-gray-600 capitalize">
                    {profile?.role || 'Client'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;