import { ServiceProvider, type IServiceProvider } from '../models/ServiceProvider';
import { User, type IUser } from '../models/User';

export interface CreateProviderData {
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  latitude?: number;
  longitude?: number;
}

export class ProviderService {
  static async createProvider(data: CreateProviderData): Promise<IServiceProvider> {
    const existingProvider = await ServiceProvider.findOne({ userId: data.userId });
    if (existingProvider) {
      throw new Error('Provider profile already exists for this user');
    }

    const provider = new ServiceProvider(data);
    await provider.save();
    return provider;
  }

  static async getProviderByUserId(userId: string): Promise<IServiceProvider | null> {
    return ServiceProvider.findOne({ userId });
  }

  static async getProviderById(providerId: string): Promise<IServiceProvider | null> {
    return ServiceProvider.findById(providerId);
  }

  static async updateProvider(
    providerId: string, 
    updates: Partial<IServiceProvider>
  ): Promise<IServiceProvider | null> {
    return ServiceProvider.findByIdAndUpdate(providerId, updates, { new: true });
  }

  static async getAllProviders(
    filters: { status?: string; search?: string } = {}
  ): Promise<IServiceProvider[]> {
    const query: any = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return ServiceProvider.find(query).sort({ createdAt: -1 });
  }

  static async updateProviderRating(providerId: string): Promise<void> {
    // This would typically involve aggregating reviews
    // For now, we'll implement a placeholder
    const provider = await ServiceProvider.findById(providerId);
    if (provider) {
      // TODO: Calculate actual rating from reviews
      // This is a placeholder implementation
      await ServiceProvider.findByIdAndUpdate(providerId, {
        $inc: { totalReviews: 1 }
      });
    }
  }

  static async getAllProvidersWithUserData(): Promise<Array<IServiceProvider & { user: IUser | null }>> {
    const providers = await ServiceProvider.find().sort({ createdAt: -1 });
    const providersWithUsers = await Promise.all(
      providers.map(async (provider) => {
        const user = await User.findById(provider.userId);
        return {
          ...provider.toObject(),
          user
        };
      })
    );
    return providersWithUsers;
  }

  static async getProvidersByStatusWithUserData(
    status: 'pending' | 'approved' | 'rejected' | 'suspended'
  ): Promise<Array<IServiceProvider & { user: IUser | null }>> {
    const providers = await ServiceProvider.find({ status }).sort({ createdAt: -1 });
    const providersWithUsers = await Promise.all(
      providers.map(async (provider) => {
        const user = await User.findById(provider.userId);
        return {
          ...provider.toObject(),
          user
        };
      })
    );
    return providersWithUsers;
  }
}