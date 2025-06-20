
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Mail, Phone, Calendar, Ban, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          user:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateProviderStatus = useMutation({
    mutationFn: async ({ providerId, status }: { providerId: string; status: string }) => {
      const { error } = await supabase
        .from('service_providers')
        .update({ status })
        .eq('id', providerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      toast({
        title: "Provider status updated",
        description: "The provider status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update provider status.",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProviders = providers.filter(provider => 
    provider.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProviderStatusUpdate = (providerId: string, status: string) => {
    updateProviderStatus.mutate({ providerId, status });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="clients" className="w-full">
            <TabsList>
              <TabsTrigger value="clients">Clients ({filteredUsers.filter(u => u.role === 'client').length})</TabsTrigger>
              <TabsTrigger value="providers">Providers ({filteredProviders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval ({filteredProviders.filter(p => p.status === 'pending').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-4">
              {filteredUsers.filter(user => user.role === 'client').map(user => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{user.full_name}</h3>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm">
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              {filteredProviders.filter(provider => provider.status === 'approved').map(provider => (
                <Card key={provider.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{provider.business_name}</h3>
                          <Badge variant="default">{provider.status}</Badge>
                          <Badge variant="outline">Provider</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {provider.user?.email}
                          </div>
                          {provider.business_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {provider.business_phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Approved {format(new Date(provider.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {provider.business_description && (
                          <p className="text-sm text-gray-600 mt-2">{provider.business_description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProviderStatusUpdate(provider.id, 'suspended')}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filteredProviders.filter(provider => provider.status === 'pending').map(provider => (
                <Card key={provider.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{provider.business_name}</h3>
                          <Badge variant="secondary">{provider.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {provider.user?.email}
                          </div>
                          {provider.business_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {provider.business_phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Applied {format(new Date(provider.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {provider.business_description && (
                          <p className="text-sm text-gray-600 mt-2">{provider.business_description}</p>
                        )}
                        {provider.business_address && (
                          <p className="text-sm text-gray-600">📍 {provider.business_address}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleProviderStatusUpdate(provider.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleProviderStatusUpdate(provider.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
