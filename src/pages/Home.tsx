import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  CalendarToday,
  Star,
  LocationOn,
  Build,
  Palette,
  ElectricBolt,
  DonutLarge,
  AcUnit,
  Settings,
  CheckCircle,
  ArrowForward
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAllProviders } from '@/hooks/useProvider';
import { useServiceCategories } from '@/hooks/useServiceCategories';

function getIconForCategory(name: string) {
  switch (name) {
    case 'Engine & Mechanical':      return Build;
    case 'Body & Paint':             return Palette;
    case 'Electrical & Diagnostics': return ElectricBolt;
    case 'Tyres & Wheels':           return DonutLarge;
    case 'Air Conditioning':         return AcUnit;
    case 'Servicing & MOT':          return Settings;
    default:                         return Build;
  }
}

const features = [
  {
    icon: Search,
    title: 'Easy Discovery',
    description: 'Find the perfect mechanic or garage based on your location, speciality, and budget.'
  },
  {
    icon: CalendarToday,
    title: 'Instant Booking',
    description: 'Book appointments 24/7 with real-time availability and instant confirmation.'
  },
  {
    icon: Star,
    title: 'Verified Reviews',
    description: 'Read genuine reviews from verified customers to make informed decisions.'
  },
  {
    icon: CheckCircle,
    title: 'Secure Payments',
    description: 'Pay securely with multiple payment options and enjoy purchase protection.'
  }
];

const Home = () => {
  const navigate = useNavigate();

  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories();
  const categories = categoriesData?.categories || [];

  const { data: providersData, isLoading: providersLoading } = useAllProviders({
    limit: 3,
    sortBy: 'rating',
    sortOrder: 'desc',
  });
  const topProviders = providersData?.providers || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Book your next <span className="text-blue-600">car service</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find trusted mechanics and garages near you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Explore Services
                <ArrowForward className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register?role=provider">
              <Button size="lg" variant="outline" className="px-8 py-3">
                Join as a Mechanic
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100">
                    <Skeleton className="w-14 h-14 rounded-full mb-3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))
              : categories.map((category) => {
                  const Icon = getIconForCategory(category.name);
                  return (
                    <Link
                      key={category._id}
                      to={`/services?category=${encodeURIComponent(category.name)}`}
                      className="group"
                    >
                      <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer">
                        <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mb-3 transition-colors">
                          <Icon className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{category.name}</h3>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Zenith?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Garages */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Garages</h2>
            <Link to="/providers">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {providersLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-9 w-full" />
                    </CardContent>
                  </Card>
                ))
              : topProviders.map((provider) => (
                  <Card key={provider._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={provider.businessImage || '/placeholder.svg'}
                      alt={provider.businessName}
                      className="h-48 w-full object-cover"
                    />
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1 mr-2">
                          <h3 className="font-semibold text-lg truncate">{provider.businessName}</h3>
                          <p className="text-gray-600 text-sm truncate">{provider.category || 'General Services'}</p>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          {(provider.totalReviews ?? 0) > 0 ? (
                            <>
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="ml-1 text-sm font-medium">{(provider.averageRating ?? 0).toFixed(1)}</span>
                              <span className="ml-1 text-sm text-gray-500">({provider.totalReviews})</span>
                            </>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">New</Badge>
                          )}
                        </div>
                      </div>
                      {provider.businessAddress && (
                        <div className="flex items-center text-sm text-gray-600 mb-4">
                          <LocationOn className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{provider.businessAddress}</span>
                        </div>
                      )}
                      <Button className="w-full" onClick={() => navigate(`/provider/${provider._id}`)}>
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join a growing community of car owners who trust Zenith
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=provider">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Sign Up Now
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
