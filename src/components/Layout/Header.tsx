
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useProviderProfile } from '@/hooks/useProvider';
import { CalendarToday, Person, Logout, Settings, Store, Schedule, BarChart, Shield, Groups, List, AutorenewRounded } from '@mui/icons-material';

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch provider profile data if user is a provider
  const { data: providerData } = useProviderProfile(profile?.role === 'provider');

  console.log('profilePhoto2', profile)
  console.log('providerData', providerData)
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
  const isClient = profile?.role === 'client' || (!profile?.role && user);

  // Get profile photo - prioritize provider profile photo for providers
  const getProfilePhoto = () => {
    if (isProvider && providerData?.profilePhoto) {
      return providerData.profilePhoto;
    }
    return profile?.avatarUrl || null;
  };

  const profilePhoto = getProfilePhoto();

  // Helper function to determine if a link is active
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string) => {
    const baseClasses = "transition-colors";
    const activeClasses = "font-bold";
    const inactiveClasses = "text-gray-600 hover:text-gray-900 font-medium";

    return `${baseClasses} ${isActiveLink(path) ? activeClasses : inactiveClasses}`;
  };

  // Helper function to get link styles
  const getLinkStyle = (path: string) => {
    return isActiveLink(path) ? { color: '#025bae' } : {};
  };

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
            <span className="font-bold text-gray-900" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif', fontSize: '28px'}}>Mawaad</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!loading && (
              <>
                {isAdminRoute ? (
                  isAdmin && (
                    <>
                      <Link to="/admin/dashboard" className={getLinkClasses("/admin/dashboard")} style={getLinkStyle("/admin/dashboard")}>
                        Dashboard
                      </Link>
                      <Link to="/admin/users" className={getLinkClasses("/admin/users")} style={getLinkStyle("/admin/users")}>
                        Users
                      </Link>
                      <Link to="/admin/settings" className={getLinkClasses("/admin/settings")} style={getLinkStyle("/admin/settings")}>
                        Settings
                      </Link>
                    </>
                  )
                ) : isProviderRoute ? (
                  isProvider && (
                    <>
                      <Link to="/provider/dashboard" className={getLinkClasses("/provider/dashboard")} style={getLinkStyle("/provider/dashboard")}>
                        Dashboard
                      </Link>
                      <Link to="/provider/services" className={getLinkClasses("/provider/services")} style={getLinkStyle("/provider/services")}>
                        My Services
                      </Link>
                      <Link to="/provider/bookings" className={getLinkClasses("/provider/bookings")} style={getLinkStyle("/provider/bookings")}>
                        Appointments
                      </Link>
                      <Link to="/provider/schedule" className={getLinkClasses("/provider/schedule")} style={getLinkStyle("/provider/schedule")}>
                        Schedule
                      </Link>
                      <Link to="/provider/profile" className={getLinkClasses("/provider/profile")} style={getLinkStyle("/provider/profile")}>
                        Business Profile
                      </Link>
                    </>
                  )
                ) : (
                  <>
                    {user && (<Link to="/services" className={getLinkClasses("/services")} style={getLinkStyle("/services")}>
                      Services
                    </Link>)}
                    {/* <Link to="/providers" className={getLinkClasses("/providers")} style={getLinkStyle("/providers")}>
                      Providers
                    </Link> */}
                    {user && (
                      <Link to="/bookings" className={getLinkClasses("/bookings")} style={getLinkStyle("/bookings")}>
                        My Bookings
                      </Link>
                    )}
                    {user && isClient && (
                      <Link to="/profile" className={getLinkClasses("/profile")} style={getLinkStyle("/profile")}>
                        Profile
                      </Link>
                    )}
                    {user && (
                      <Link to={isProvider ? "/provider/dashboard" : "/dashboard"} className={getLinkClasses(isProvider ? "/provider/dashboard" : "/dashboard")} style={getLinkStyle(isProvider ? "/provider/dashboard" : "/dashboard")}>
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
                <AutorenewRounded className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-gray-100 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profilePhoto || undefined}
                          alt={profile?.fullName}
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                          {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <div className="flex items-center justify-start gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profilePhoto || undefined}
                        alt={profile?.fullName}
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                        {profile?.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-semibold text-base text-gray-900">{profile?.fullName || 'User'}</p>
                      <p className="w-[180px] truncate text-sm text-gray-600">
                        {user.email}
                      </p>
                      <p className="text-xs text-blue-600 font-medium capitalize bg-blue-50 px-2 py-1 rounded-full inline-block w-fit">
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
                        <CalendarToday className="mr-2 h-4 w-4" />
                        Client View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Person className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  
                  {!isProviderRoute && !isAdminRoute && (
                    <DropdownMenuItem onClick={() => navigate('/bookings')}>
                      <CalendarToday className="mr-2 h-4 w-4" />
                      My Bookings
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <Logout className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>

                {/* Business status pill for providers */}
                {isProvider && (
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                    Business
                  </div>
                )}

              </div>
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
