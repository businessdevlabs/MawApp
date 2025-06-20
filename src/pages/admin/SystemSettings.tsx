
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Shield, Database, Bell, DollarSign } from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformFee: 10,
    autoApproveProviders: false,
    emailNotifications: true,
    maintenanceMode: false,
    maxBookingsPerDay: 50,
    supportEmail: 'support@bookease.com',
    termsOfService: 'By using our platform, you agree to our terms and conditions...',
    privacyPolicy: 'We respect your privacy and are committed to protecting your personal data...'
  });

  const handleSave = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxBookings">Max Bookings Per Day</Label>
                      <Input
                        id="maxBookings"
                        type="number"
                        value={settings.maxBookingsPerDay}
                        onChange={(e) => handleSettingChange('maxBookingsPerDay', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-approve Providers</Label>
                        <p className="text-sm text-gray-600">Automatically approve new provider applications</p>
                      </div>
                      <Switch
                        checked={settings.autoApproveProviders}
                        onCheckedChange={(checked) => handleSettingChange('autoApproveProviders', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Mode</Label>
                        <p className="text-sm text-gray-600">Put the platform in maintenance mode</p>
                      </div>
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('General')}>Save General Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="platformFee">Platform Fee (%)</Label>
                    <Input
                      id="platformFee"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.platformFee}
                      onChange={(e) => handleSettingChange('platformFee', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Current fee: {settings.platformFee}% of each booking
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Payment Gateway Integration</h4>
                    <p className="text-sm text-blue-700">
                      Configure your payment gateway settings in the environment variables.
                      Supported gateways: Stripe, PayPal, Square.
                    </p>
                  </div>

                  <Button onClick={() => handleSave('Payment')}>Save Payment Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-600">Send email notifications to users</p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Email Templates</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Booking confirmation</p>
                      <p>• Booking reminder (24h before)</p>
                      <p>• Provider application status</p>
                      <p>• Payment confirmation</p>
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Notification')}>Save Notification Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Security Status</h4>
                    <div className="space-y-2 text-sm text-green-700">
                      <p>✅ SSL Certificate Active</p>
                      <p>✅ Database Encryption Enabled</p>
                      <p>✅ Row Level Security Active</p>
                      <p>✅ API Rate Limiting Configured</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Security Recommendations</h4>
                    <div className="space-y-2 text-sm text-yellow-700">
                      <p>• Enable two-factor authentication for admin accounts</p>
                      <p>• Regular security audits and penetration testing</p>
                      <p>• Monitor suspicious activities and failed login attempts</p>
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Security')}>Review Security Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Terms of Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={settings.termsOfService}
                    onChange={(e) => handleSettingChange('termsOfService', e.target.value)}
                    rows={6}
                    placeholder="Enter your terms of service..."
                  />
                  <Button onClick={() => handleSave('Terms of Service')}>Save Terms</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={settings.privacyPolicy}
                    onChange={(e) => handleSettingChange('privacyPolicy', e.target.value)}
                    rows={6}
                    placeholder="Enter your privacy policy..."
                  />
                  <Button onClick={() => handleSave('Privacy Policy')}>Save Policy</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
