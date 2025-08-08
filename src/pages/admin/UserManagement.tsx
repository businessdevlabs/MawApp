
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminUsers, useAdminProviders } from '@/hooks/useAdmin';
import UserRoleManagement from '@/components/admin/UserRoleManagement';

import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') || 'clients';

  const { data: usersData, isLoading: usersLoading } = useAdminUsers({
    search: searchTerm || undefined,
    limit: 50
  });

  const { data: providersData, isLoading: providersLoading } = useAdminProviders({
    search: searchTerm || undefined,
    limit: 50
  });

  const users = usersData?.users || [];
  const providers = providersData?.providers || [];

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProviders = providers.filter(provider => 
    provider.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = usersLoading || providersLoading;

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

          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList>
              <TabsTrigger value="clients">Clients ({filteredUsers.filter(u => u.role === 'client').length})</TabsTrigger>
              <TabsTrigger value="providers">Providers ({filteredProviders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval ({filteredProviders.filter(p => p.status === 'pending').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-4">
              {filteredUsers.filter(user => user.role === 'client').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No clients found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.filter(user => user.role === 'client').map(user => (
                  <UserRoleManagement key={user._id} user={user} type="user" />
                ))
              )}
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              {filteredProviders.filter(provider => provider.status === 'approved').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No approved providers found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredProviders.filter(provider => provider.status === 'approved').map(provider => (
                  <UserRoleManagement key={provider._id} provider={provider} type="provider" />
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filteredProviders.filter(provider => provider.status === 'pending').length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No pending applications</p>
                  </CardContent>
                </Card>
              ) : (
                filteredProviders.filter(provider => provider.status === 'pending').map(provider => (
                  <UserRoleManagement key={provider._id} provider={provider} type="provider" />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
