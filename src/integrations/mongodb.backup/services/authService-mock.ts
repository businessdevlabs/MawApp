// Mock auth service for client-side demo
export interface MockAuthResponse {
  user: any;
  token: string;
}

export interface MockLoginCredentials {
  email: string;
  password: string;
}

export interface MockRegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'client' | 'provider' | 'admin';
  phone?: string;
}

export class MockAuthService {
  static async register(data: MockRegisterData): Promise<MockAuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate registration
    const user = {
      _id: `user_${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      phone: data.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = `mock_token_${Date.now()}`;

    console.log('Mock registration successful:', user);
    return { user, token };
  }

  static async login(credentials: MockLoginCredentials): Promise<MockAuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = {
      _id: 'user_mock_login',
      email: credentials.email,
      fullName: 'Test User',
      role: 'client',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const token = `mock_token_${Date.now()}`;

    return { user, token };
  }

  static async verifyToken(token: string): Promise<any> {
    if (token.startsWith('mock_token_')) {
      return {
        _id: 'user_from_token',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'client',
      };
    }
    throw new Error('Invalid token');
  }

  static async getUserById(userId: string): Promise<any | null> {
    return {
      _id: userId,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'client',
    };
  }

  static async updateUser(userId: string, updates: any): Promise<any | null> {
    return {
      _id: userId,
      ...updates,
    };
  }
}