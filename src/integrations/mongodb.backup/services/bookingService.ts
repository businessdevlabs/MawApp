import { Booking, type IBooking } from '../models/Booking';
import { User, type IUser } from '../models/User';
import { ServiceProvider, type IServiceProvider } from '../models/ServiceProvider';
import { Service, type IService } from '../models/Service';

export interface CreateBookingData {
  clientId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  totalPrice: number;
  notes?: string;
}

export class BookingService {
  static async createBooking(data: CreateBookingData): Promise<IBooking> {
    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      providerId: data.providerId,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingBooking) {
      throw new Error('Time slot is already booked');
    }

    const booking = new Booking(data);
    await booking.save();
    return booking;
  }

  static async getBookingById(bookingId: string): Promise<IBooking | null> {
    return Booking.findById(bookingId);
  }

  static async getBookingsByClient(clientId: string): Promise<IBooking[]> {
    return Booking.find({ clientId }).sort({ appointmentDate: -1, appointmentTime: -1 });
  }

  static async getBookingsByProvider(providerId: string): Promise<IBooking[]> {
    return Booking.find({ providerId }).sort({ appointmentDate: -1, appointmentTime: -1 });
  }

  static async getBookingsByService(serviceId: string): Promise<IBooking[]> {
    return Booking.find({ serviceId }).sort({ appointmentDate: -1, appointmentTime: -1 });
  }

  static async updateBookingStatus(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      bookingId,
      { status, updatedAt: new Date() },
      { new: true }
    );
  }

  static async updateBooking(
    bookingId: string,
    updates: Partial<IBooking>
  ): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(bookingId, updates, { new: true });
  }

  static async getAvailableTimeSlots(
    providerId: string,
    date: string
  ): Promise<string[]> {
    const bookedSlots = await Booking.find({
      providerId,
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed'] }
    }).select('appointmentTime');

    const bookedTimes = bookedSlots.map(booking => booking.appointmentTime);
    
    // Generate available time slots (this is a simplified example)
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    return allSlots.filter(slot => !bookedTimes.includes(slot));
  }

  static async getBookingsInDateRange(
    providerId: string,
    startDate: string,
    endDate: string
  ): Promise<IBooking[]> {
    return Booking.find({
      providerId,
      appointmentDate: { $gte: startDate, $lte: endDate }
    }).sort({ appointmentDate: 1, appointmentTime: 1 });
  }

  static async getAllBookings(): Promise<IBooking[]> {
    return Booking.find().sort({ createdAt: -1 });
  }

  static async getRecentBookingsWithDetails(limit: number = 5): Promise<Array<IBooking & {
    client?: IUser | null;
    provider?: IServiceProvider | null;
    service?: IService | null;
  }>> {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(limit);
    
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const [client, provider, service] = await Promise.all([
          User.findById(booking.clientId),
          ServiceProvider.findById(booking.providerId),
          Service.findById(booking.serviceId)
        ]);
        
        return {
          ...booking.toObject(),
          client,
          provider,
          service
        };
      })
    );
    
    return bookingsWithDetails;
  }

  static async getBookingStats(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    bookingsByStatus: Record<string, number>;
  }> {
    const bookings = await Booking.find();
    
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    const bookingsByStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalBookings,
      totalRevenue,
      bookingsByStatus
    };
  }
}