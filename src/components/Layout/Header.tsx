
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, User, LogOut, Settings, Store, Clock, BarChart3, Shield, Users, List, Loader2 } from 'lucide-react';

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isProviderRoute = location.pathname.startsWith('/provider');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProvider = profile?.role === 'provider';
  const isAdmin = profile?.role === 'admin';

  return (
    <header className="shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={isProvider && !isAdminRoute ? "/provider/dashboard" : "/"} 
            className="flex items-center"
          >
            <img src="/logo3.png" alt="Mawaad Logo" className="w-16 h-16" />
            <span className="font-bold text-gray-900" style={{fontFamily: 'Inter, sans-serif', fontSize: '28px'}}>Mawaad</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!loading && (
              <>
                {isAdminRoute ? (
                  isAdmin && (
                    <>
                      <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Users
                      </Link>
                      <Link to="/admin/settings" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Settings
                      </Link>
                    </>
                  )
                ) : isProviderRoute ? (
                  isProvider && (
                    <>
                      <Link to="/provider/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/provider/services" className="text-gray-600 hover:text-gray-900 transition-colors">
                        My Services
                      </Link>
                      <Link to="/provider/bookings" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Appointments
                      </Link>
                      <Link to="/provider/schedule" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Schedule
                      </Link>
                      <Link to="/provider/profile" className="text-gray-600 hover:text-gray-900 transition-colors">
                        Business Profile
                      </Link>
                    </>
                  )
                ) : (
                  <>
                    {user && (<Link to="/services" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Services
                    </Link>)}
                    <Link to="/providers" className="text-gray-600 hover:text-gray-900 transition-colors">
                      Providers
                    </Link>
                    {user && (
                      <Link to="/bookings" className="text-gray-600 hover:text-gray-900 transition-colors">
                        My Bookings
                      </Link>
                    )}
                    {user && (
                      <Link to={isProvider ? "/provider/dashboard" : "/dashboard"} className="text-gray-600 hover:text-gray-900 transition-colors">
                        Dashboard
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {profile?.role || 'User'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Role-based navigation */}
                  {isAdmin && !isAdminRoute && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {isProvider && !isProviderRoute && !isAdminRoute && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/provider/dashboard')}>
                        <Store className="mr-2 h-4 w-4" />
                        Provider Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {(isAdminRoute) && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/services')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Client View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  
                  {!isProviderRoute && !isAdminRoute && (
                    <DropdownMenuItem onClick={() => navigate('/bookings')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      My Bookings
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
