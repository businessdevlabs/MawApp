
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
import ServiceDetailModal from '@/components/modals/ServiceDetailModal';
import {
  Search,
  FilterList,
  Star,
  LocationOn,
  Schedule,
  ContentCut,
  FitnessCenter,
  Favorite,
  Groups,
  Palette
} from '@mui/icons-material';

const Services = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories();
  const services = servicesData?.services || [];
  const categories = categoriesData?.categories || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLoading = servicesLoading || categoriesLoading;


  const handleBookNow = (service: any) => {
    if (!user) {
      // Store the intended destination for after login
      localStorage.setItem('redirectAfterLogin', `/service/${service._id}`);
      navigate('/login');
    } else {
      setSelectedService(service);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  // Map categories from API to display format
  const displayCategories = [
    { id: 'all', name: 'All Services', icon: Groups },
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
        return ContentCut;
      case 'Health & Wellness':
        return Favorite;
      case 'Technology Services':
        return Groups; // Could use a computer icon if available
      case 'Professional Services':
        return Groups;
      case 'Home & Maintenance':
        return Groups;
      case 'Education & Training':
        return Groups;
      default:
        return Groups;
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
                style={selectedCategory === category.id ?
                  {backgroundColor: '#025bae', borderColor: '#025bae'} :
                  {borderColor: '#025bae', color: '#025bae'}
                }
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <Button variant="outline" size="sm">
              <FilterList className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <span>{filteredServices.length} services found</span>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service._id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0 overflow-hidden">
              {/* Header with service name */}
              <div className="px-4 py-3 text-white" style={{backgroundColor: '#025bae'}}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {service.providerId?.profilePhoto ? (
                      <img
                        src={service.providerId.profilePhoto}
                        alt={service.providerId?.businessName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {service.providerId?.businessName?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">{service.name}</h3>
                    <p className="text-white/80 text-sm truncate">
                      {service.providerId?.businessName} ({service.category?.name || 'General Service'})
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Description */}
                  {service.description && (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  {/* Provider and Duration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LocationOn style={{ fontSize: 16, color: '#025bae' }} />
                      <span className="text-sm text-gray-900 truncate">{service.providerId?.businessName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Schedule style={{ fontSize: 16, color: '#025bae' }} />
                      <span className="text-sm text-gray-900">{service.duration} min</span>
                    </div>
                  </div>

                  {/* Rating and Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {service.providerId?.averageRating || 4.8}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({service.providerId?.totalReviews || 0})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-lg" style={{color: '#025bae'}}>
                        ${service.price}
                      </span>
                      <Button onClick={() => handleBookNow(service)} size="sm" style={{backgroundColor: '#025bae'}} className="hover:opacity-90">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {filteredServices.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" style={{backgroundColor: '#025bae', color: 'white', borderColor: '#025bae'}} className="hover:opacity-90">
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

        {/* Service Detail Modal */}
        <ServiceDetailModal
          service={selectedService}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
};

export default Services;
