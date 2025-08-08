# Zenith - Service Booking Platform

A comprehensive service booking platform that connects clients with service providers through an intuitive web application.

## Overview

Zenith is a full-stack web application built to streamline the process of booking and managing services. The platform supports multiple user roles including clients, service providers, and administrators, each with tailored dashboards and functionalities.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **API**: RESTful architecture

### Third-Party Integrations
- **Google Maps API**: Location services and mapping
- **Google Places API**: Address autocomplete and geocoding

## Key Features

### User Management
- Multi-role authentication system (Client, Provider, Admin)
- Secure registration and login
- Profile management
- Role-based access control

### Service Booking
- Browse available services by category
- View service details and provider information
- Book appointments with real-time availability
- Booking confirmation and management
- Booking history and tracking

### Provider Dashboard
- Complete provider profile setup
- Service creation and management
- Schedule and availability management
- Interactive location mapping with Google Maps
- Booking management and client communication
- Business information management

### Administrative Panel
- User management and role assignment
- Service category management
- System settings and configuration
- Platform oversight and analytics

### Location Services
- Interactive Google Maps integration
- Address search and autocomplete
- Drag-and-drop marker positioning
- Current location detection
- Geocoding and reverse geocoding

## Database Schema

### Core Models
- **User**: Authentication, profile, and role information
- **ServiceProvider**: Provider business details and settings
- **Service**: Service offerings, pricing, and descriptions
- **Booking**: Appointment scheduling and status tracking
- **ServiceCategory**: Service categorization and organization
- **ProviderSchedule**: Availability and time slot management

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── booking/         # Booking-related components
│   │   ├── maps/            # Google Maps components
│   │   ├── provider/        # Provider-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts for state management
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Route components
│   │   ├── admin/           # Admin dashboard pages
│   │   └── provider/        # Provider dashboard pages
│   ├── services/            # API service functions
│   └── lib/                 # Utility functions
├── server/                  # Backend Express.js application
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   └── middleware/          # Custom middleware functions
└── tests/                   # Playwright E2E tests
```

## Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB database
- Google Maps API key

### Installation
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### Environment Configuration
Create `.env` files with required variables:
- MongoDB connection string
- JWT secret
- Google Maps API key
- Server port configuration

### Running the Application
```bash
# Start frontend development server
npm run dev

# Start backend server
cd server && npm start
```

## Testing

The project includes comprehensive E2E testing with Playwright:
- Authentication flow testing
- Booking process validation
- Provider functionality testing
- API endpoint verification

## Current Status

The project is actively under development with recent migrations from Supabase to MongoDB. Key areas of ongoing work include:
- API integration refinement
- UI/UX improvements
- Testing coverage expansion
- Performance optimization

## Technology Stack Summary

**Frontend**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query
**Backend**: Express.js, MongoDB, Mongoose, JWT
**Testing**: Playwright
**Deployment**: Configured for development with Lovable platform integration
**Maps**: Google Maps API with Places integration

## Contributing

The project follows modern development practices with:
- TypeScript for type safety
- ESLint for code linting
- Component-based architecture
- RESTful API design
- Comprehensive testing strategy