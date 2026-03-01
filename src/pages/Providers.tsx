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
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '@/lib/leaflet-icons';
import {
  Search,
  Star,
  LocationOn,
  Groups,
  Tune,
  UnfoldMore,
  Close,
  Build,
  Palette,
  ElectricBolt,
  DonutLarge,
  AcUnit,
  Settings,
  Verified,
  Phone,
  Language,
  ArrowUpward,
  ArrowDownward,
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
      id: category._id,
      name: category.name,
      icon: getIconForCategory(category.name)
    }))
  ];

  function getIconForCategory(categoryName: string) {
    switch (categoryName) {
      case 'Engine & Mechanical':      return Build;
      case 'Body & Paint':             return Palette;
      case 'Electrical & Diagnostics': return ElectricBolt;
      case 'Tyres & Wheels':           return DonutLarge;
      case 'Air Conditioning':         return AcUnit;
      case 'Servicing & MOT':          return Settings;
      default:                         return Build;
    }
  }

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

  const activeFiltersCount = [
    searchTerm,
    selectedCategory !== 'all' ? selectedCategory : null,
    location,
    minRating[0] > 0 ? minRating : null,
    maxRating[0] < 5 ? maxRating : null,
    hasWebsite !== undefined ? hasWebsite : null,
    hasPhone !== undefined ? hasPhone : null,
  ].filter(Boolean).length;

  // Map data (computed outside JSX for cleaner render)
  const mappable = providers.filter(p => p.coordinates?.lat && p.coordinates?.lng);
  const unmappable = providers.length - mappable.length;
  const mapCenter: [number, number] = mappable.length > 0
    ? [
        mappable.reduce((s, p) => s + p.coordinates!.lat, 0) / mappable.length,
        mappable.reduce((s, p) => s + p.coordinates!.lng, 0) / mappable.length,
      ]
    : [54.5, -3.5];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-28 w-full" />
                <CardContent className="p-4">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Service Providers</h1>
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
            <div className="md:col-span-3 flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 flex-1">
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
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                title={sortOrder === 'desc' ? 'Sort ascending' : 'Sort descending'}
              >
                {sortOrder === 'desc' ? (
                  <ArrowDownward className="w-4 h-4" />
                ) : (
                  <ArrowUpward className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {displayCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                size="sm"
                className={selectedCategory === category.id ? "flex items-center space-x-2 bg-primary hover:bg-primary/90" : "flex items-center space-x-2"}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                  <div className="space-y-4">
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
                    <div className="space-y-3">
                      <Label>Maximum Rating</Label>
                      <div className="px-2">
                        <Slider
                          value={maxRating}
                          onValueChange={setMaxRating}
                          max={5}
                          min={0}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0 stars</span>
                          <span className="font-medium">{maxRating[0]} stars</span>
                          <span>5 stars</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

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

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={clearAllFilters}>
                      <Close className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="bg-primary hover:bg-primary/90">
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
        </div>

        {/* Map — always visible above the list */}
        <div className="mb-8">
          {unmappable > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              {unmappable} provider{unmappable !== 1 ? 's are' : ' is'} not shown on the map because their location is not set.
            </p>
          )}
          <MapContainer
            center={mapCenter}
            zoom={mappable.length > 0 ? 10 : 6}
            className="h-[350px] w-full rounded-lg z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappable.map((provider) => (
              <Marker
                key={provider._id}
                position={[provider.coordinates!.lat, provider.coordinates!.lng]}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1">
                    <p className="font-semibold text-sm">{provider.businessName}</p>
                    {provider.category && (
                      <p className="text-xs text-gray-500">{provider.category}</p>
                    )}
                    {(provider.totalReviews ?? 0) > 0 ? (
                      <p className="text-xs">⭐ {(provider.averageRating ?? 0).toFixed(1)} ({provider.totalReviews} reviews)</p>
                    ) : (
                      <p className="text-xs text-blue-600">New</p>
                    )}
                    <button
                      onClick={() => handleViewProvider(provider._id)}
                      className="mt-1 text-xs text-blue-600 underline block"
                    >
                      View Profile
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <Card key={provider._id} className="shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 overflow-hidden">
              {/* Compact header */}
              <div className="px-3 py-2 text-white bg-primary">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {/* PROV-002: businessImage → profilePhoto → initial fallback */}
                    {provider.businessImage || provider.profilePhoto ? (
                      <img
                        src={provider.businessImage || provider.profilePhoto}
                        alt={provider.businessName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                        <span className="text-white font-semibold text-sm">
                          {provider.businessName?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* PROV-003: business name is clickable */}
                    <h3 className="text-sm font-semibold truncate flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewProvider(provider._id)}
                        className="hover:underline cursor-pointer truncate text-left"
                      >
                        {provider.businessName || 'Business Name'}
                      </button>
                      {(provider as { isVerified?: boolean }).isVerified === true && (
                        <Verified className="w-4 h-4 text-white/90 flex-shrink-0" />
                      )}
                    </h3>
                    <p className="text-white/80 text-xs truncate">
                      {provider.category || 'General Services'}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-3 space-y-2">
                {/* Description */}
                {provider.businessDescription && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-1">
                    {provider.businessDescription}
                  </p>
                )}

                {/* Location */}
                <div className="flex items-center space-x-2">
                  <LocationOn className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate">{provider.businessAddress || 'Location not specified'}</span>
                </div>

                {/* Rating + View Profile */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    {(provider.totalReviews ?? 0) > 0 ? (
                      <>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {provider.averageRating}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({provider.totalReviews})
                        </span>
                      </>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">New</Badge>
                    )}
                  </div>
                  <Button onClick={() => handleViewProvider(provider._id)} size="sm" className="bg-primary hover:bg-primary/90">
                    View Profile
                  </Button>
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
