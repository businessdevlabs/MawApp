// Client-side API service - makes HTTP requests to backend server

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'client' | 'provider' | 'admin';
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'client' | 'provider' | 'admin';
  phone?: string;
}

export interface ServiceCategory {
  _id: string;
  name: string;
  description: string;
  icon: string;
  commonServices: CommonService[];
  isActive: boolean;
}

export interface CommonService {
  _id: string;
  name: string;
  description: string;
  averagePrice: number;
  averageDuration: number;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  providerId: ServiceProvider;
  price: number;
  duration: number;
  maxBookingsPerDay: number;
  requirements: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProvider {
  _id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  category?: ServiceCategory;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  services: Service[];
  averageRating?: number;
  totalReviews?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

export interface ProviderSchedule {
  _id: string;
  providerId: string;
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseUrl = 'http://localhost:3001/api';
  
  // Helper method to make HTTP requests
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('Registering user with backend API:', data.email);
    
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('Registration successful:', response.user.email);
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    console.log('Logging in user with backend API:', data.email);
    
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log('Login successful:', response.user.email);
    return response;
  }

  async verifyToken(token: string): Promise<User> {
    const response = await this.makeRequest('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.user;
  }

  async logout(): Promise<void> {
    await this.makeRequest('/auth/logout', {
      method: 'POST',
    });
    console.log('User logged out');
  }

  // User management
  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest('/auth/me');
    return response.user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.makeRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    return response.user;
  }

  // Service Categories
  async getServiceCategories(): Promise<ServiceCategory[]> {
    const response = await this.makeRequest('/categories');
    return response.categories;
  }

  async getServiceCategory(categoryId: string): Promise<ServiceCategory> {
    const response = await this.makeRequest(`/categories/${categoryId}`);
    return response.category;
  }

  async getCategoryCommonServices(categoryId: string): Promise<{ categoryName: string; commonServices: CommonService[] }> {
    return await this.makeRequest(`/categories/${categoryId}/services`);
  }

  // Provider Profile
  async getProviderProfile(): Promise<ServiceProvider> {
    const response = await this.makeRequest('/provider/profile');
    return response.provider;
  }

  async updateProviderProfile(profileData: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response = await this.makeRequest('/provider/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.provider;
  }

  // Provider Services
  async getProviderServices(): Promise<Service[]> {
    const response = await this.makeRequest('/provider/services');
    return response.services;
  }

  async createService(serviceData: {
    name: string;
    description: string;
    category: string;
    price: number;
    duration: number;
    maxBookingsPerDay?: number;
    requirements?: string[];
    tags?: string[];
  }): Promise<Service> {
    const response = await this.makeRequest('/provider/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
    return response.service;
  }

  async updateService(serviceId: string, updates: Partial<Service>): Promise<Service> {
    const response = await this.makeRequest(`/provider/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.service;
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.makeRequest(`/provider/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Public Services (for client browsing)
  async getAllServices(params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    services: Service[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.location) queryParams.append('location', params.location);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/services${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async getServiceById(serviceId: string): Promise<Service> {
    const response = await this.makeRequest(`/services/${serviceId}`);
    return response.service;
  }

  async getServicesByCategory(categoryId: string, params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    services: Service[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/services/category/${categoryId}${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  // Provider Schedule
  async getProviderSchedule(): Promise<ProviderSchedule[]> {
    const response = await this.makeRequest('/provider/schedule');
    return response.schedules;
  }

  async updateProviderSchedule(schedules: {
    dayOfWeek: number;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
  }[]): Promise<ProviderSchedule[]> {
    const response = await this.makeRequest('/provider/schedule', {
      method: 'POST',
      body: JSON.stringify({ schedules }),
    });
    return response.schedules;
  }

  async deleteScheduleDay(dayOfWeek: number): Promise<void> {
    await this.makeRequest(`/provider/schedule/${dayOfWeek}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;