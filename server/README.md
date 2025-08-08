# Appoint Zenith Backend Server

Express.js backend with MongoDB for the Appoint Zenith Network application.

## Prerequisites

1. **Node.js** (v18+ required)
2. **MongoDB** - You need MongoDB running locally or a connection string to a MongoDB instance

## MongoDB Setup Options

### Option 1: Local MongoDB (Recommended for development)
```bash
# Install MongoDB (macOS with Homebrew)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# MongoDB will be available at: mongodb://localhost:27017
```

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at https://cloud.mongodb.com
2. Create a new cluster
3. Update the `MONGODB_URI` in `.env` file with your connection string

## Installation & Setup

1. **Install dependencies:**
```bash
cd server
npm install
```

2. **Configure environment:**
   - Copy `.env` file and update if needed
   - Default MongoDB URI: `mongodb://localhost:27017/appoint-zenith`
   - Default port: `3001`

3. **Start the server:**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Health Check
- `GET /api/health` - Server health status

## Testing the API

Once the server is running on `http://localhost:3001`, you can test it:

```bash
# Test server health
curl http://localhost:3001/api/health

# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "client"
  }'
```

## Frontend Integration

The frontend (React app) should be configured to make API calls to `http://localhost:3001/api`.

Run both servers simultaneously:
1. Backend: `cd server && npm run dev` (port 3001)
2. Frontend: `npm run dev` (port 8080)

## Database Schema

### Users Collection
- `email` (unique)
- `password` (hashed)
- `fullName`
- `role` (client, provider, admin)
- `phone` (optional)
- Timestamps (createdAt, updatedAt)

### ServiceProviders Collection (for provider users)
- `userId` (ref to User)
- `businessName`
- `businessDescription`
- `status` (pending, approved, rejected, suspended)
- Business details and hours