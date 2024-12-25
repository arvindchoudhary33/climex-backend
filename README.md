# CLIMEX Backend - Climate Risk Analysis API

## Overview

Backend service for the CLIMEX Climate Risk Analysis Dashboard, providing data integration with World Bank, NOAA, and other climate data sources.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based user management
- 🌡️ NOAA climate data integration
- 📚 World Bank document analysis
- 🔄 Real-time data streaming
- 🗄️ MongoDB database integration

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **API Integration**: Axios
- **Error Handling**: Custom middleware

## Prerequisites

- Node.js version 18 or higher
- MongoDB instance
- NOAA API key
- World Bank API access

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development            # Application environment
PORT=8000                      # Server port
API_PREFIX=/api/v1             # API route prefix
MONGODB_URI=your_mongodb_uri   # MongoDB connection string
MONGODB_DB_NAME=climex         # Database name
JWT_SECRET=your_jwt_secret     # JWT signing secret
NCDC_API_KEY=your_noaa_key    # NOAA Climate Data API key
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/climex-backend.git
cd climex-backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Project Structure

```
climex-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── utils/         # Utility functions
├── tests/            # Test files
└── .env             # Environment variables
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

### User Management

- `GET /api/v1/users` - Get all users (Super Admin only)
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Climate Data

- `GET /api/v1/climate/temperature` - Get temperature data
- `GET /api/v1/climate/documents` - Get World Bank documents
- `GET /api/v1/climate/overview` - Get climate data overview

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript code
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Database Models

### User Model

```typescript
{
  email: string;
  password: string;
  name: string;
  role: "user" | "super_admin";
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

The API uses a centralized error handling middleware that provides consistent error responses:

```typescript
{
  status: "error",
  message: string,
  details?: any
}
```

## Authentication

- JWT-based authentication
- Token expiration: 24 hours
- Role-based access control (RBAC)
- Protected routes using auth middleware

## Data Integration

The backend integrates with multiple external APIs:

- NOAA Climate Data API
- World Bank Open Data API
- World Air Quality Index API

## Security Measures

- Helmet.js for security headers
- Rate limiting
- CORS configuration
- Password hashing with bcrypt
- JWT token validation

## Deployment

1. Build the TypeScript code:

```bash
npm run build
```

2. Set production environment variables

3. Start the server:

```bash
npm start
```
