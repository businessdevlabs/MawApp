
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  Star, 
  MapPin, 
  Clock, 
  Scissors, 
  Dumbbell, 
  Heart,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const categories = [
    { name: 'Beauty & Hair', icon: Scissors, count: '1,200+' },
    { name: 'Fitness', icon: Dumbbell, count: '800+' },
    { name: 'Wellness', icon: Heart, count: '600+' },
    { name: 'Health', icon: Users, count: '400+' }
  ];

  const features = [
    {
      icon: Search,
      title: 'Easy Discovery',
      description: 'Find the perfect service provider based on your location, preferences, and budget.'
    },
    {
      icon: Calendar,
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

  const topProviders = [
    {
      id: 1,
      name: "Elite Hair Studio",
      category: "Beauty & Hair",
      rating: 4.9,
      reviews: 324,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300",
      distance: "0.5 mi",
      nextAvailable: "Today"
    },
    {
      id: 2,
      name: "FitZone Personal Training",
      category: "Fitness",
      rating: 4.8,
      reviews: 189,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300",
      distance: "1.2 mi",
      nextAvailable: "Tomorrow"
    },
    {
      id: 3,
      name: "Serenity Wellness Spa",
      category: "Wellness",
      rating: 4.9,
      reviews: 267,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300",
      distance: "0.8 mi",
      nextAvailable: "Today"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Book your next appointment with <span className="text-blue-600">ease</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover and book appointments with top-rated service providers. From hair salons to fitness centers, find exactly what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/services">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Explore Services
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="px-8 py-3">
                Join as Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <category.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                  <p className="text-gray-600">{category.count} providers</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose BookEase?</h2>
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

      {/* Top Providers */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Top-Rated Providers</h2>
            <Link to="/services">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topProviders.map((provider) => (
              <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={provider.image} 
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <p className="text-gray-600 text-sm">{provider.category}</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium">{provider.rating}</span>
                      <span className="ml-1 text-sm text-gray-500">({provider.reviews})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.distance}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {provider.nextAvailable}
                    </div>
                  </div>
                  <Button className="w-full">Book Now</Button>
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
            Join thousands of satisfied customers who trust BookEase
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
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
