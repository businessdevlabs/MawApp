import { Service, type IService } from '../models/Service';
import { ServiceCategory, type IServiceCategory } from '../models/ServiceCategory';

export interface CreateServiceData {
  providerId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export class ServiceService {
  static async createService(data: CreateServiceData): Promise<IService> {
    const service = new Service(data);
    await service.save();
    return service;
  }

  static async getServiceById(serviceId: string): Promise<IService | null> {
    return Service.findById(serviceId);
  }

  static async getServicesByProvider(providerId: string): Promise<IService[]> {
    return Service.find({ providerId, isActive: true }).sort({ createdAt: -1 });
  }

  static async getAllServices(filters: {
    categoryId?: string;
    search?: string;
    providerId?: string;
  } = {}): Promise<IService[]> {
    const query: any = { isActive: true };
    
    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }
    
    if (filters.providerId) {
      query.providerId = filters.providerId;
    }
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return Service.find(query).sort({ createdAt: -1 });
  }

  static async updateService(
    serviceId: string, 
    updates: Partial<IService>
  ): Promise<IService | null> {
    return Service.findByIdAndUpdate(serviceId, updates, { new: true });
  }

  static async deleteService(serviceId: string): Promise<boolean> {
    const result = await Service.findByIdAndUpdate(
      serviceId, 
      { isActive: false }, 
      { new: true }
    );
    return !!result;
  }

  // Service Categories
  static async createCategory(data: {
    name: string;
    description?: string;
    iconUrl?: string;
  }): Promise<IServiceCategory> {
    const category = new ServiceCategory(data);
    await category.save();
    return category;
  }

  static async getAllCategories(): Promise<IServiceCategory[]> {
    return ServiceCategory.find().sort({ name: 1 });
  }

  static async getCategoryById(categoryId: string): Promise<IServiceCategory | null> {
    return ServiceCategory.findById(categoryId);
  }

  static async updateCategory(
    categoryId: string, 
    updates: Partial<IServiceCategory>
  ): Promise<IServiceCategory | null> {
    return ServiceCategory.findByIdAndUpdate(categoryId, updates, { new: true });
  }
}