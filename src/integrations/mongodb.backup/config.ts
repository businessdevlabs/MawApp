// Note: MongoDB operations should typically happen on the server-side
// For demo purposes, we'll provide client-side configuration
export const MONGODB_CONFIG = {
  uri: import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017/appoint-zenith',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

export const JWT_CONFIG = {
  secret: import.meta.env.VITE_JWT_SECRET || 'your-jwt-secret-key',
  expiresIn: '24h',
};