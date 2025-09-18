import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAllProviders } from '@/hooks/useProvider';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
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
  Business,
  Phone,
  Language,
  Tune,
  UnfoldMore,
  Close
} from '@mui/icons-material';

const Providers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minRating, setMinRating] = useState([0]);
  const [maxRating, setMaxRating] = useState([5]);
  const [hasWebsite, setHasWebsite] = useState<boolean | undefined>(undefined);
  const [hasPhone, setHasPhone] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object
  const filters = {
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchTerm || undefined,
    location: location || undefined,
    sortBy,
    sortOrder,
    minRating: minRating[0] > 0 ? minRating[0] : undefined,
    maxRating: maxRating[0] < 5 ? maxRating[0] : undefined,
    hasWebsite,
    hasPhone,
  };

  const { data: providersResponse, isLoading: providersLoading } = useAllProviders(filters);
  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories();
  
  const providers = providersResponse?.providers || [];
  const pagination = providersResponse?.pagination;
  const categories = categoriesData?.categories || [];

  const isLoading = providersLoading || categoriesLoading;

  const handleViewProvider = (providerId: string) => {
    if (!user) {
      // Store the intended destination for after login
      localStorage.setItem('redirectAfterLogin', `/provider/${providerId}`);
      navigate('/login');
    } else {
      navigate(`/provider/${providerId}`);
    }
  };

  // Map categories from API to display format
  const displayCategories = [
    { id: 'all', name: 'All Providers', icon: Groups },
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
        return Groups;
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

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setLocation('');
    setSortBy('rating');
    setSortOrder('desc');
    setMinRating([0]);
    setMaxRating([5]);
    setHasWebsite(undefined);
    setHasPhone(undefined);
  };

  // Active filters count
  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all' ? selectedCategory : null,
    location,
    minRating[0] > 0 ? minRating : null,
    maxRating[0] < 5 ? maxRating : null,
    hasWebsite !== undefined ? hasWebsite : null,
    hasPhone !== undefined ? hasPhone : null,
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="py-8">
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
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'}}>Find Service Providers</h1>
          <p className="text-gray-600">Connect with verified professionals in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="relative md:col-span-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search providers, businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <div className="relative md:col-span-3">
              <LocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12">
                  <UnfoldMore className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {displayCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
                size="sm"
                style={selectedCategory === category.id ? {backgroundColor: '#025bae'} : {}}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {/* Advanced Filters Sheet */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Tune className="w-4 h-4 mr-2" />
                    Advanced Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="destructive" className="ml-2 px-1 min-w-[20px] h-5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    {/* Rating Filter */}
                    <div className="space-y-3">
                      <Label>Minimum Rating</Label>
                      <div className="px-2">
                        <Slider
                          value={minRating}
                          onValueChange={setMinRating}
                          max={5}
                          min={0}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0 stars</span>
                          <span className="font-medium">{minRating[0]} stars</span>
                          <span>5 stars</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Provider Features */}
                    <div className="space-y-4">
                      <Label>Provider Features</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id="has-website"
                            checked={hasWebsite === true}
                            onCheckedChange={(checked) => 
                              setHasWebsite(checked ? true : undefined)
                            }
                          />
                          <Label htmlFor="has-website" className="flex items-center space-x-2">
                            <Language className="w-4 h-4" />
                            <span>Has Website</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id="has-phone"
                            checked={hasPhone === true}
                            onCheckedChange={(checked) => 
                              setHasPhone(checked ? true : undefined)
                            }
                          />
                          <Label htmlFor="has-phone" className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>Has Phone Number</span>
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Clear Filters */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={clearAllFilters}>
                        <Close className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                      <Button onClick={() => setShowFilters(false)} style={{backgroundColor: '#025bae'}}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <span>{providers.length} providers found</span>
              
              {pagination && pagination.totalProviders > pagination.limit && (
                <span>• Page {pagination.currentPage} of {pagination.totalPages}</span>
              )}
            </div>

            {/* Clear all filters button */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500 hover:text-gray-700">
                <Close className="w-4 h-4 mr-1" />
                Clear all ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card key={provider._id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0 overflow-hidden">
              {/* Header with provider info */}
              <div className="px-4 py-3 text-white" style={{backgroundColor: '#025bae'}}>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {provider.profilePhoto ? (
                      <img
                        src={provider.profilePhoto}
                        alt={provider.businessName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {provider.businessName?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">{provider.businessName || 'Business Name'}</h3>
                    <p className="text-white/80 text-sm truncate">
                      {provider.category || 'General Services'}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Description */}
                  {provider.businessDescription && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {provider.businessDescription}
                    </p>
                  )}

                  {/* Location and Contact */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <LocationOn style={{ fontSize: 16, color: '#025bae' }} />
                      <span className="text-sm text-gray-900 truncate">{provider.businessAddress || 'Location not specified'}</span>
                    </div>
                    {provider.businessPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone style={{ fontSize: 16, color: '#025bae' }} />
                        <span className="text-sm text-gray-900">{provider.businessPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Services and Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {provider.averageRating || 4.8}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({provider.totalReviews || 0})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Business style={{ fontSize: 16, color: '#025bae' }} />
                        <span className="text-sm text-gray-900">{provider.serviceCount || 0} services</span>
                      </div>
                      <Button onClick={() => handleViewProvider(provider._id)} size="sm" style={{backgroundColor: '#025bae'}} className="hover:opacity-90">
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {provider.subcategory && (
                        <Badge variant="outline" className="text-xs">
                          {provider.subcategory}
                        </Badge>
                      )}
                      {provider.website && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Website
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {providers.length > 0 && pagination && pagination.currentPage < pagination.totalPages && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Providers
            </Button>
          </div>
        )}

        {/* No Results */}
        {providers.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Providers;