export { AuthService } from './authService';
export { ProviderService } from './providerService';
export { ServiceService } from './serviceService';
export { BookingService } from './bookingService';
export { ReviewService } from './reviewService';

export type { AuthResponse, LoginCredentials, RegisterData } from './authService';
export type { CreateProviderData } from './providerService';
export type { CreateServiceData } from './serviceService';
export type { CreateBookingData } from './bookingService';
export type { CreateReviewData } from './reviewService';

// Re-export types from models for convenience
export type { IUser } from '../models/User';
export type { IServiceProvider } from '../models/ServiceProvider';
export type { IService } from '../models/Service';
export type { IBooking } from '../models/Booking';