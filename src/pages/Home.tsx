
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, 
  Search, 
  Star, 
  Clock, 
  MapPin, 
  Scissors, 
  Dumbbell, 
  Spa,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const featuredServices = [
    {
      id: 1,
      name: "Premium Hair Salon",
      category: "Hair & Beauty",
      rating: 4.9,
      reviews: 128,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
      price: "From $45",
      distance: "0.5 mi",
      icon: Scissors
    },
    {
      id: 2,
      name: "Elite Fitness Center",
      category: "Fitness",
      rating: 4.8,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      price: "From $30",
      distance: "1.2 mi",
      icon: Dumbbell
    },
    {
      id: 3,
      name: "Serenity Spa & Wellness",
      category: "Spa & Wellness",
      rating: 4.9,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
      price: "From $75",
      distance: "0.8 mi",
      icon: Spa
    }
  ];

  const stats = [
    { label: "Active Providers", value: "10,000+", icon: Users },
    { label: "Bookings Monthly", value: "500K+", icon: Calendar },
    { label: "Customer Satisfaction", value: "98%", icon: Star },
    { label: "Cities Covered", value: "250+", icon: MapPin }
  ];

  const features = [
    {
      title: "Easy Discovery",
      description: "Find the perfect service provider based on location, ratings, and availability",
      icon: Search
    },
    {
      title: "Instant Booking",
      description: "Book appointments in real-time with instant confirmation",
      icon: Calendar
    },
    {
      title: "Secure Payments",
      description: "Pay safely with multiple payment options and automatic receipts",
      icon: CheckCircle
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
              Trusted by 1M+ customers worldwide
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Book appointments with ease
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover and book appointments with top-rated service providers in your area. 
              From hair salons to fitness centers, find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 py-6" asChild>
                  <Link to="/services">
                    Browse Services
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 py-6" asChild>
                    <Link to="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                    <Link to="/provider-signup">
                      Join as Provider
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Services</h2>
            <p className="text-lg text-gray-600">Discover top-rated service providers in your area</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {featuredServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-gray-900">
                      <service.icon className="w-3 h-3 mr-1" />
                      {service.category}
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
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {service.distance}
                    </div>
                    <div className="font-medium text-blue-600">{service.price}</div>
                  </div>
                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose BookEase?</h2>
            <p className="text-lg text-gray-600">Everything you need for seamless appointment booking</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers and providers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link to="/register">Start Booking Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6" asChild>
              <Link to="/provider-signup">Become a Provider</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
