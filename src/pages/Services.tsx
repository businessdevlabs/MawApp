
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useServices } from '@/hooks/useServices';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  Scissors, 
  Dumbbell, 
  Heart,
  Users,
  Palette
} from 'lucide-react';

const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories();
  const services = servicesData?.services || [];
  const categories = categoriesData?.categories || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isLoading = servicesLoading || categoriesLoading;


  const handleBookNow = (serviceId: string) => {
    if (!user) {
      // Store the intended destination for after login
      localStorage.setItem('redirectAfterLogin', `/service/${serviceId}`);
      navigate('/login');
    } else {
      navigate(`/service/${serviceId}`);
    }
  };

  // Map categories from API to display format
  const displayCategories = [
    { id: 'all', name: 'All Services', icon: Users },
    ...categories.map(category => ({
      id: category.name,
      name: category.name,
      icon: getIconForCategory(category.name)
    }))
  ];

  // Helper function to get appropriate icon for each category
  function getIconForCategory(categoryName: string) {
    switch (categoryName) {
      case 'Beauty & Personal Care':
        return Scissors;
      case 'Health & Wellness':
        return Heart;
      case 'Technology Services':
        return Users; // Could use a computer icon if available
      case 'Professional Services':
        return Users;
      case 'Home & Maintenance':
        return Users;
      case 'Education & Training':
        return Users;
      default:
        return Users;
    }
  }

  const filteredServices = services?.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.providerId?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Services</h1>
          <p className="text-gray-600">Find and book the perfect service provider for your needs</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search services, providers, or treatments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {displayCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <span>{filteredServices.length} services found</span>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service._id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-6xl opacity-20">
                  {service.category?.name === 'Beauty & Personal Care' && '💇'}
                  {service.category?.name === 'Health & Wellness' && '🏥'}
                  {service.category?.name === 'Technology Services' && '💻'}
                  {service.category?.name === 'Professional Services' && '💼'}
                  {service.category?.name === 'Home & Maintenance' && '🔧'}
                  {service.category?.name === 'Education & Training' && '📚'}
                  {!service.category && '⭐'}
                </div>
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-white/90 text-gray-900">
                    Available
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {service.providerId?.averageRating || 4.8}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({service.providerId?.totalReviews || 0})
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs">
                    {service.category?.name || 'General'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{service.providerId?.businessName}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {service.duration} min
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-600 text-lg">
                    ${service.price}
                  </span>
                  <Button onClick={() => handleBookNow(service._id)}>
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {filteredServices.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Services
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
