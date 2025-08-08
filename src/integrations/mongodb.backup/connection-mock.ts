// Mock MongoDB connection for client-side demo
class MockMongoConnection {
  private static instance: MockMongoConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MockMongoConnection {
    if (!MockMongoConnection.instance) {
      MockMongoConnection.instance = new MockMongoConnection();
    }
    return MockMongoConnection.instance;
  }

  public async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isConnected = true;
    console.log('Mock MongoDB connection established');
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Mock MongoDB disconnected');
  }

  public getConnection() {
    return { readyState: this.isConnected ? 1 : 0 };
  }
}

export const mongoConnection = MockMongoConnection.getInstance();