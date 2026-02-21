import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST before any other imports
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if environment variables are loaded
console.log('DEBUG: Environment loaded. OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import clientRoutes from './routes/client.js';
import providerRoutes from './routes/provider.js';
import providersRoutes from './routes/providers.js';
import categoriesRoutes from './routes/categories.js';
import subcategoriesRoutes from './routes/subcategories.js';
import servicesRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import aiBookingRoutes from './routes/ai-booking.js';
import reviewsRoutes from './routes/reviews.js';
import chatRoutes from './routes/chat.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });
});

// Make io accessible to route handlers
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app with proper MIME types and cache control
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0, // Disable caching for now to force fresh assets
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-booking', aiBookingRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Catch all handler: send back React's index.html file for SPA routing (only for non-API and non-static routes)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API route not found' });
  } else if (req.path.startsWith('/assets/') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.ico')) {
    // This shouldn't happen if static middleware works correctly, but just in case
    res.status(404).json({ error: 'Static asset not found' });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();