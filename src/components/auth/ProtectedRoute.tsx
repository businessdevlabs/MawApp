import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectProvidersTo?: string;
  allowRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectProvidersTo,
  allowRoles 
}) => {
  const { user, profile, loading } = useAuth();
  
  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If redirectProvidersTo is specified and user is a provider, redirect them
  if (redirectProvidersTo && profile?.role === 'provider') {
    return <Navigate to={redirectProvidersTo} replace />;
  }
  
  // If allowRoles is specified, check if user has the required role
  if (allowRoles && profile?.role && !allowRoles.includes(profile.role)) {
    // Redirect based on user role
    const redirectPath = profile.role === 'provider' ? '/provider/dashboard' : 
                        profile.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;