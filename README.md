# Booking Platform

A comprehensive booking and appointment management platform designed to connect service-based businesses with their clients. Built for appointment-driven businesses including hair salons, barbershops, beauty spas, medical clinics, fitness studios, and similar service providers.

## Overview

This platform enables service businesses to efficiently manage appointments, staff, and resources through a unified, modern interface. It supports both multi-tenant SaaS architecture and single-tenant deployments, providing flexibility for different business models.

### Key Features

- **Appointment Management**: Real-time booking with intelligent conflict prevention
- **Staff Scheduling**: Flexible availability management with automated scheduling
- **Client Management**: Comprehensive client profiles with appointment history
- **Payment Processing**: Integrated Stripe payments with deposit support
- **Calendar Views**: Day, week, and month views with staff filtering
- **Multi-tenant Support**: Isolated data and customizable branding per tenant
- **Real-time Updates**: WebSocket-based calendar synchronization
- **Offline Support**: Progressive Web App (PWA) with offline capabilities
- **Notifications**: Email and SMS notifications for appointments and reminders

### Future Enhancements

- AI-powered smart scheduling with no-show prediction
- Dynamic pricing and demand-based recommendations
- Advanced analytics and business intelligence
- Calendar integrations (Google Calendar, Outlook)
- Multi-location franchise support
- White-label customization options

## Tech Stack

### Backend

- **Framework**: NestJS 10.0 with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis with BullMQ for job processing
- **Authentication**: JWT with refresh tokens, OAuth (Google)
- **Payments**: Stripe
- **Email**: SendGrid
- **SMS**: Twilio
- **API Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS
- **State Management**: Zustand + React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Calendar**: FullCalendar

### Infrastructure

- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston with structured logging
- **Testing**: Jest (backend), Vitest (frontend), Playwright (E2E)

## Project Structure

```
imamChas-booking/
├── backend/              # NestJS backend application
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, appointments, etc.)
│   │   ├── common/       # Shared utilities and decorators
│   │   ├── config/       # Configuration management
│   │   └── database/     # TypeORM entities and migrations
│   └── test/             # Backend tests
│
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client services
│   │   └── stores/       # State management stores
│   └── tests/            # Frontend tests
│
├── infrastructure/       # Docker, CI/CD, and deployment configs
│   ├── docker/          # Docker configurations
│   ├── kubernetes/      # K8s manifests (if applicable)
│   └── terraform/       # Infrastructure as Code
│
├── tests/               # End-to-end tests
│   └── e2e/            # Playwright E2E tests
│
└── docs/               # Project documentation
    ├── SPEC.md         # Technical specification
    ├── PLAN.md         # Implementation plan
    ├── CONTRACTS.md    # API contracts
    └── TASKS/          # Detailed task breakdown
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Docker and Docker Compose (optional, recommended)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd imamChas-booking
```

2. **Backend Setup**

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run migration:run

# Seed initial data (optional)
npm run seed

# Start development server
npm run start:dev
```

3. **Frontend Setup**

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

4. **Using Docker Compose (Recommended)**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development URLs

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd frontend
npm run test
npm run test:ui

# E2E tests
cd tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Environment Variables

### Backend (.env)

See `backend/.env.example` for all available configuration options including:
- Database connection
- Redis configuration
- JWT secrets
- OAuth credentials (Google)
- Payment provider (Stripe)
- Email service (SendGrid)
- SMS service (Twilio)

### Frontend (.env)

See `frontend/.env.example` for configuration including:
- API URL
- WebSocket URL
- Feature flags
- OAuth client ID
- Stripe public key

## Documentation

- [Technical Specification](docs/SPEC.md) - Detailed requirements and architecture
- [Implementation Plan](docs/PLAN.md) - Development roadmap and MVP scope
- [API Contracts](docs/CONTRACTS.md) - REST API documentation
- [Task Breakdown](docs/TASKS/) - Detailed implementation tasks

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved
