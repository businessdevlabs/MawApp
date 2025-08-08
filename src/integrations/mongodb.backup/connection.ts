import mongoose from 'mongoose';
import { MONGODB_CONFIG } from './config';

class MongoConnection {
  private static instance: MongoConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(MONGODB_CONFIG.uri, MONGODB_CONFIG.options);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }
}

export const mongoConnection = MongoConnection.getInstance();