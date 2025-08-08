import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/User';
import { JWT_CONFIG } from '../config';

export interface AuthResponse {
  user: IUser;
  token: string;
}

export interface LoginCredentials {
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

export class AuthService {
  static async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = new User({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      phone: data.phone,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn }
    );

    return { user, token };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = await User.findOne({ email: credentials.email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn }
    );

    return { user, token };
  }

  static async verifyToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.secret) as any;
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  static async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updates, { new: true });
  }

  static async getAllUsers(): Promise<IUser[]> {
    return User.find().sort({ createdAt: -1 });
  }

  static async getUsersByRole(role: 'client' | 'provider' | 'admin'): Promise<IUser[]> {
    return User.find({ role }).sort({ createdAt: -1 });
  }
}