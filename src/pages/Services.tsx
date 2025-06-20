import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Services', icon: Users },
    { id: 'beauty', name: 'Beauty & Hair', icon: Scissors },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell },
    { id: 'wellness', name: 'Spa & Wellness', icon: Heart },
    { id: 'nails', name: 'Nails & Beauty', icon: Palette },
    { id: 'health', name: 'Health & Therapy', icon: Heart }
  ];

  const services = [
    {
      id: 1,
      name: "Premium Hair Salon",
      category: "beauty",
      description: "Professional hair cutting, styling, and coloring services",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
      rating: 4.9,
      reviews: 128,
      price: "From $45",
      duration: "1-2 hours",
      distance: "0.5 mi",
      availability: "Available today",
      services: ["Hair Cut", "Hair Color", "Styling", "Treatments"]
    },
    {
      id: 2,
      name: "Elite Fitness Center",
      category: "fitness",
      description: "Personal training, group classes, and fitness coaching",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      rating: 4.8,
      reviews: 89,
      price: "From $30",
      duration: "45-60 mins",
      distance: "1.2 mi",
      availability: "Next available: Tomorrow",
      services: ["Personal Training", "Group Classes", "Nutrition Coaching"]
    },
    {
      id: 3,
      name: "Serenity Spa & Wellness",
      category: "wellness",
      description: "Relaxing massage therapy and wellness treatments",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
      rating: 4.9,
      reviews: 156,
      price: "From $75",
      duration: "60-90 mins",
      distance: "0.8 mi",
      availability: "Available today",
      services: ["Massage", "Facial", "Body Treatments", "Aromatherapy"]
    },
    {
      id: 4,
      name: "Nail Art Studio",
      category: "nails",
      description: "Creative nail designs and professional manicures",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc138bb8?w=400",
      rating: 4.7,
      reviews: 93,
      price: "From $25",
      duration: "30-60 mins",
      distance: "0.3 mi",
      availability: "Available today",
      services: ["Manicure", "Pedicure", "Nail Art", "Extensions"]
    },
    {
      id: 5,
      name: "Wellness Therapy Center",
      category: "health",
      description: "Physical therapy and rehabilitation services",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
      rating: 4.8,
      reviews: 67,
      price: "From $85",
      duration: "45-60 mins",
      distance: "1.5 mi",
      availability: "Next available: Tomorrow",
      services: ["Physical Therapy", "Massage Therapy", "Rehabilitation"]
    },
    {
      id: 6,
      name: "Urban Barbershop",
      category: "beauty",
      description: "Classic and modern men's grooming services",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400",
      rating: 4.6,
      reviews: 112,
      price: "From $35",
      duration: "30-45 mins",
      distance: "0.7 mi",
      availability: "Available today",
      services: ["Haircut", "Beard Trim", "Shave", "Styling"]
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            {categories.map((category) => (
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
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <Badge className="bg-white/90 text-gray-900">
                    {service.availability}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">{service.rating}</span>
                    <span className="ml-1 text-sm text-gray-500">({service.reviews})</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.services.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {service.distance}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {service.duration}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-600 text-lg">{service.price}</span>
                  <Button>
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
