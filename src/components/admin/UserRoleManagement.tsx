import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useUpdateUserRole, 
  useSuspendUser, 
  useDeleteUser, 
  useUpdateProviderStatus 
} from '@/hooks/useAdmin';
import { 
  Edit, 
  Ban, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'client' | 'provider' | 'admin';
  isActive: boolean;
  suspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  createdAt: string;
}

interface Provider {
  _id: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  statusUpdatedAt?: string;
  statusReason?: string;
  createdAt: string;
  userId: User;
}

interface UserRoleManagementProps {
  user?: User;
  provider?: Provider;
  type: 'user' | 'provider';
}

const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ user, provider, type }) => {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [providerStatusDialogOpen, setProviderStatusDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || '');
  const [selectedProviderStatus, setSelectedProviderStatus] = useState(provider?.status || '');
  const [reason, setReason] = useState('');
  
  const { toast } = useToast();
  
  const updateUserRole = useUpdateUserRole();
  const suspendUser = useSuspendUser();
  const deleteUser = useDeleteUser();
  const updateProviderStatus = useUpdateProviderStatus();

  const currentUser = user || provider?.userId;
  if (!currentUser) return null;

  const handleRoleUpdate = async () => {
    try {
      await updateUserRole.mutateAsync({
        userId: currentUser._id,
        role: selectedRole
      });
      setRoleDialogOpen(false);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleSuspendToggle = async () => {
    try {
      await suspendUser.mutateAsync({
        userId: currentUser._id,
        suspended: !currentUser.suspended,
        reason: reason || undefined
      });
      setSuspendDialogOpen(false);
      setReason('');
      toast({
        title: "Success",
        description: `User ${!currentUser.suspended ? 'suspended' : 'unsuspended'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${!currentUser.suspended ? 'suspend' : 'unsuspend'} user`,
        variant: "destructive",
      });
    }
  };

  const handleProviderStatusUpdate = async () => {
    if (!provider) return;
    
    try {
      await updateProviderStatus.mutateAsync({
        providerId: provider._id,
        status: selectedProviderStatus,
        reason: reason || undefined
      });
      setProviderStatusDialogOpen(false);
      setReason('');
      toast({
        title: "Success",
        description: "Provider status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync({
        userId: currentUser._id,
        reason: reason || undefined
      });
      setReason('');
      toast({
        title: "Success",
        description: "User account deactivated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate user account",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'provider': return 'default';
      case 'client': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'suspended': return <Ban className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">
                {type === 'provider' && provider ? provider.businessName : currentUser.fullName}
              </h3>
              <Badge variant={getRoleColor(currentUser.role)}>
                {currentUser.role}
              </Badge>
              {type === 'provider' && provider && (
                <Badge variant={getStatusColor(provider.status)} className="flex items-center gap-1">
                  {getStatusIcon(provider.status)}
                  {provider.status}
                </Badge>
              )}
              {currentUser.suspended && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Ban className="h-3 w-3" />
                  Suspended
                </Badge>
              )}
              {!currentUser.isActive && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserX className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>📧 {currentUser.email}</p>
              {currentUser.phone && <p>📞 {currentUser.phone}</p>}
              {type === 'provider' && provider?.businessAddress && (
                <p>📍 {provider.businessAddress}</p>
              )}
              <p>📅 Joined: {new Date(currentUser.createdAt).toLocaleDateString()}</p>
              {currentUser.suspended && currentUser.suspensionReason && (
                <p className="text-red-600">🚫 Suspension: {currentUser.suspensionReason}</p>
              )}
            </div>

            {type === 'provider' && provider?.businessDescription && (
              <p className="text-sm text-gray-600 mt-2">{provider.businessDescription}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {/* Change Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedRole(currentUser.role)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Change Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change User Role</DialogTitle>
                  <DialogDescription>
                    Update the role for {currentUser.fullName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">New Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRoleUpdate} 
                    disabled={updateUserRole.isPending || selectedRole === currentUser.role}
                  >
                    {updateUserRole.isPending ? 'Updating...' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Provider Status Dialog */}
            {type === 'provider' && provider && (
              <Dialog open={providerStatusDialogOpen} onOpenChange={setProviderStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedProviderStatus(provider.status)}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Change Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Provider Status</DialogTitle>
                    <DialogDescription>
                      Change the status for {provider.businessName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">New Status</Label>
                      <Select value={selectedProviderStatus} onValueChange={setSelectedProviderStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason (Optional)</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Provide a reason for this status change..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setProviderStatusDialogOpen(false);
                      setReason('');
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleProviderStatusUpdate} 
                      disabled={updateProviderStatus.isPending || selectedProviderStatus === provider.status}
                    >
                      {updateProviderStatus.isPending ? 'Updating...' : 'Update Status'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Suspend/Unsuspend Dialog */}
            <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant={currentUser.suspended ? "default" : "outline"} 
                  size="sm"
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {currentUser.suspended ? 'Unsuspend' : 'Suspend'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {currentUser.suspended ? 'Unsuspend' : 'Suspend'} User
                  </DialogTitle>
                  <DialogDescription>
                    {currentUser.suspended 
                      ? `Restore access for ${currentUser.fullName}`
                      : `Temporarily suspend access for ${currentUser.fullName}`
                    }
                  </DialogDescription>
                </DialogHeader>
                {!currentUser.suspended && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Reason for Suspension</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Provide a reason for suspension..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setSuspendDialogOpen(false);
                    setReason('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSuspendToggle}
                    variant={currentUser.suspended ? "default" : "destructive"}
                    disabled={suspendUser.isPending}
                  >
                    {suspendUser.isPending 
                      ? (currentUser.suspended ? 'Unsuspending...' : 'Suspending...') 
                      : (currentUser.suspended ? 'Unsuspend' : 'Suspend')
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            {currentUser.isActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Deactivate User Account
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently deactivate {currentUser.fullName}'s account. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="deleteReason">Reason for Deactivation</Label>
                      <Textarea
                        id="deleteReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Provide a reason for deactivation..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReason('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteUser}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteUser.isPending}
                    >
                      {deleteUser.isPending ? 'Deactivating...' : 'Deactivate Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleManagement;