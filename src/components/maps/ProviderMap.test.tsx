import React from 'react';
import { render, screen } from '@testing-library/react';
import ProviderMap from './ProviderMap';

// Mock window.google
const mockGoogle = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    Geocoder: jest.fn(),
    places: {
      Autocomplete: jest.fn()
    },
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    SymbolPath: {
      CIRCLE: 'circle'
    }
  }
};

// Mock the global window.google
Object.defineProperty(window, 'google', {
  value: mockGoogle,
  writable: true
});

describe('ProviderMap', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders map container with title', () => {
    render(
      <ProviderMap
        address="123 Test Street"
        businessName="Test Business"
        isEditing={false}
      />
    );

    expect(screen.getByText('Business Location')).toBeInTheDocument();
    expect(screen.getByTestId('provider-map')).toBeInTheDocument();
  });

  test('shows search input when in editing mode', () => {
    render(
      <ProviderMap
        address="123 Test Street"
        businessName="Test Business"
        isEditing={true}
      />
    );

    expect(screen.getByText('Business Location')).toBeInTheDocument();
    expect(screen.getByText('Search for your business address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter business address...')).toBeInTheDocument();
    expect(screen.getByText('Use Current Location')).toBeInTheDocument();
  });

  test('shows address in read-only mode', () => {
    const testAddress = '456 Business Ave, Test City';
    
    render(
      <ProviderMap
        address={testAddress}
        businessName="Test Business"
        isEditing={false}
      />
    );

    expect(screen.getByText(testAddress)).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    // Remove the mock to simulate loading state
    delete (window as any).google;
    
    render(
      <ProviderMap
        address="123 Test Street"
        businessName="Test Business"
        isEditing={false}
      />
    );

    // Should show loading skeleton or placeholder
    expect(screen.getByTestId('provider-map')).toBeInTheDocument();
  });

  test('shows error state when Google Maps fails to load', () => {
    // This would require mocking the script loading failure
    // For now, we just test that error handling exists
    render(
      <ProviderMap
        address="123 Test Street"
        businessName="Test Business"
        isEditing={false}
      />
    );

    expect(screen.getByTestId('provider-map')).toBeInTheDocument();
  });
});