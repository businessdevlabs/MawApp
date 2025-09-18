import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Navigation } from "lucide-react";

/// <reference types="google.maps" />

// Google Maps types
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

interface ProviderMapProps {
  address?: string;
  businessName?: string;
  coordinates?: { lat: number; lng: number } | null;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  isEditing?: boolean;
  height?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const ProviderMap: React.FC<ProviderMapProps> = ({
  address,
  businessName,
  coordinates,
  onAddressSelect,
  isEditing = false,
  height = "300px"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(address || '');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Default center (New York City) - memoized to prevent re-renders
  const defaultCenter = React.useMemo(() => ({ lat: 33.8963, lng: 35.5087 }), []);
  
  const defaultZoom = 13;

  // Load Google Maps API
  const loadGoogleMapsAPI = useCallback(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script is already loading
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          setIsLoaded(true);
          setIsLoading(false);
        }
      }, 100);
      return;
    }

    const API_KEY = "AIzaSyD-BhJgZM8dru-G3CHAU7Y0rMk65ixgK-U";


    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
  }, []);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback((coordinates: Coordinates) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: coordinates },
      (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results[0]) {
          const newAddress = results[0].formatted_address;
          setSearchValue(newAddress);
          if (onAddressSelect) {
            onAddressSelect(newAddress, coordinates);
          }
        }
      }
    );
  }, [onAddressSelect]);

  // Update marker position
  const updateMarkerPosition = useCallback((coordinates: Coordinates) => {
    if (!googleMapRef.current || !window.google) {
      console.log('Cannot update marker: map not ready');
      return;
    }

    console.log('Updating marker position to:', coordinates);

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // Create new marker (suppressing deprecation warning for now as it still works)
    try {
      markerRef.current = new (window.google.maps.Marker as any)({
        position: coordinates,
        map: googleMapRef.current,
        title: businessName || 'Business Location',
        draggable: isEditing,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          scale: 10,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP
      });

      console.log('Marker created successfully');

      // Add drag listener for editing mode
      if (isEditing && markerRef.current) {
        markerRef.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const newCoordinates = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            };
            console.log('Marker dragged to:', newCoordinates);
            reverseGeocode(newCoordinates);
          }
        });
      }

      // Center the map on the marker
      googleMapRef.current.setCenter(coordinates);
      
      // Set appropriate zoom level
      const currentZoom = googleMapRef.current.getZoom();
      if (!currentZoom || currentZoom < 10) {
        googleMapRef.current.setZoom(15);
      }

    } catch (error) {
      console.error('Error creating marker:', error);
    }
  }, [businessName, isEditing, reverseGeocode]);

  // Initialize map
  const initializeMap = useCallback((center: Coordinates = defaultCenter) => {
    if (!mapRef.current || !window.google) return;

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom: defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

    // Add click listener for editing mode
    if (isEditing) {
      googleMapRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const coordinates = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          updateMarkerPosition(coordinates);
          reverseGeocode(coordinates);
        }
      });
    }
  }, [isEditing, updateMarkerPosition, reverseGeocode, defaultCenter]);

  // Initialize autocomplete for search input
  const initializeAutocomplete = useCallback(() => {
    if (!searchInputRef.current || !window.google || !isEditing) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ['establishment', 'geocode'],
        fields: ['formatted_address', 'geometry', 'name']
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        const address = place.formatted_address || place.name || '';
        
        setSearchValue(address);
        updateMarkerPosition(coordinates);
        
        if (onAddressSelect) {
          onAddressSelect(address, coordinates);
        }
      }
    });
  }, [isEditing, onAddressSelect, updateMarkerPosition]);

  // Geocode address to coordinates
  const geocodeAddress = useCallback((addressToGeocode: string) => {
    if (!window.google || !addressToGeocode.trim()) {
      console.log('Geocoding skipped: no google maps or empty address');
      return;
    }

    console.log('Starting geocoding for:', addressToGeocode);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode(
      { address: addressToGeocode },
      (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        console.log('Geocoding result:', { status, resultsLength: results?.length });
        
        if (status === 'OK' && results && results.length > 0 && results[0].geometry) {
          const location = results[0].geometry.location;
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          console.log('Geocoding successful:', coordinates);
          console.log('Formatted address:', results[0].formatted_address);
          
          // Update the map and marker
          updateMarkerPosition(coordinates);
          
          // Update search input with formatted address if different
          const formattedAddress = results[0].formatted_address;
          if (formattedAddress !== searchValue) {
            setSearchValue(formattedAddress);
          }
          
          // Call the onAddressSelect callback if provided
          if (onAddressSelect) {
            onAddressSelect(formattedAddress, coordinates);
          }
        } else {
          console.warn('Geocoding failed:', status);
          console.warn('Results:', results);
          
          // Show user-friendly error
          if (status === 'ZERO_RESULTS') {
            console.error('No results found for address:', addressToGeocode);
          } else if (status === 'OVER_QUERY_LIMIT') {
            console.error('Google Maps query limit exceeded');
          } else if (status === 'REQUEST_DENIED') {
            console.error('Geocoding request denied - check API key');
          } else {
            console.error('Geocoding error:', status);
          }
        }
      }
    );
  }, [updateMarkerPosition, onAddressSelect, searchValue]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        updateMarkerPosition(coordinates);
        reverseGeocode(coordinates);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [updateMarkerPosition, reverseGeocode]);

  // Load Google Maps API on component mount
  useEffect(() => {
    loadGoogleMapsAPI();
  }, [loadGoogleMapsAPI]);

  // Initialize map when API is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && window.google) {
      console.log('Initializing map with:', { coordinates, address });
      
      // Add a small delay to ensure everything is ready
      setTimeout(() => {
        // First check if we have coordinates from props (for existing providers)
        if (coordinates && coordinates.lat && coordinates.lng && !isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
          console.log('Using existing coordinates:', coordinates);
          initializeMap(coordinates);
          setTimeout(() => updateMarkerPosition(coordinates), 100);
        } else if (address && address.trim()) {
          console.log('Geocoding address:', address);
          initializeMap(); // Initialize with default center first
          setTimeout(() => geocodeAddress(address), 500); // Small delay to ensure map is ready
        } else {
          console.log('Using default map initialization');
          initializeMap();
        }
      }, 100);
    }
  }, [isLoaded, address, coordinates, geocodeAddress, initializeMap, updateMarkerPosition]);

  // Initialize autocomplete when map is ready and in editing mode
  useEffect(() => {
    if (isLoaded && isEditing) {
      initializeAutocomplete();
    }
  }, [isLoaded, isEditing, initializeAutocomplete]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      geocodeAddress(searchValue.trim());
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          {/* <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Business Location
          </CardTitle> */}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-testid="provider-map">
      <CardContent className="space-y-4 p-0">
        {isEditing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {/* Search Icon Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {/* {showSearchInput ? 'Hide Search' : 'Search'} */}
              </Button>

              {/* OR Separator */}
              {/* <span className="text-sm text-gray-500">OR</span> */}

              {/* Use Current Location Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Use Current Location
              </Button>
            </div>

            {/* Search Input - Shows when search icon is clicked */}
            {showSearchInput && (
              <form onSubmit={handleSearchSubmit} className="w-4/5">
                <Input
                  id="address-search"
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Search for business address..."
                  className="w-full"
                  autoFocus
                />
              </form>
            )}

            <p className="text-sm text-gray-600">
              Click on the map or drag the marker to set your exact location
            </p>
          </div>
        )}

        {/* Only show map when provider has valid coordinates OR in editing mode */}
        {(isEditing || (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined && !(coordinates.lat === 0 && coordinates.lng === 0))) && (
          <div 
            className="relative rounded-lg overflow-hidden border"
            style={{ height }}
          >
            {!isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
                  <Skeleton className="w-24 h-4" />
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: '200px' }}
              />
            )}
          </div>
        )}

        {/* Show message when no coordinates are available and not editing */}
        {(!coordinates || coordinates.lat === undefined || coordinates.lng === undefined || (coordinates.lat === 0 && coordinates.lng === 0)) && !isEditing && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Location not set</p>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs mt-2 text-gray-400">
                Debug: coordinates = {JSON.stringify(coordinates)}
              </div>
            )}
          </div>
        )}

        {!isEditing && address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default ProviderMap;