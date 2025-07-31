# Fictionalize Me - Next.js Application

A modern Next.js implementation of the Fictionalize Me application, featuring TypeScript, PostgreSQL, and a clean architecture pattern.

## Features

- Next.js 15 with TypeScript and React 19
- PostgreSQL database with Flyway migrations
- Clean architecture with Models, Repositories, and Services
- API routes implementing a RESTful interface
- Docker Compose setup for local development
- Journaling system with hierarchical task management (sub-tasks)

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd fictionalize-me-next
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the PostgreSQL database

```bash
docker compose up -d postgres
```

This will start a PostgreSQL 17 database on port 5432.

### 4. Run the migrations

```bash
docker compose up flyway
```

This will run the Flyway migrations to set up the database schema.

### 5. Set up environment variables

Copy the `.env.local.example` file to `.env.local`:

```bash
cp .env.local.example .env.local
```

### 6. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app                   # Next.js app directory (pages, layouts)
│   ├── api               # API routes (using route handlers)
│   ├── journals          # Journal pages
│   └── waitlist          # Waitlist page
├── db                    # Database files
│   └── migrations        # Flyway SQL migration files
├── lib                   # Application code
│   ├── db                # Database connection code
│   ├── models            # Type definitions for models
│   ├── repositories      # Database access layer
│   └── services          # Business logic layer
├── public                # Static files
└── docker-compose.yml    # Docker Compose configuration
```

## API Endpoints

The following API endpoints are available:

### Waitlist

- `POST /api/waitlist` - Add a new waitlist entry
- `GET /api/waitlist` - Get all waitlist entries (admin only)

### Features

- `GET /api/features` - Get all features (admin only)
- `POST /api/features` - Create a new feature (admin only)
- `POST /api/features/toggle` - Toggle a feature (admin only)

### Journals

- `GET /api/journals` - Get all journals for the authenticated user
- `POST /api/journals` - Create a new journal
- `GET /api/journals/:id` - Get a specific journal by ID
- `PUT /api/journals/:id` - Update a journal
- `DELETE /api/journals/:id` - Delete a journal

### Journal Entries (Nested under Journals)

- `GET /api/journals/:id/entries` - Get all entries for a journal
- `POST /api/journals/:id/entries` - Create a new journal entry
- `GET /api/journals/:id/entries/:entryId` - Get a specific entry
- `PUT /api/journals/:id/entries/:entryId` - Update a specific entry
- `DELETE /api/journals/:id/entries/:entryId` - Delete a specific entry

## Authentication

This application currently uses a stub authentication service that allows all operations. In a production environment, you would replace this with a real authentication system like OAuth, Auth0, NextAuth.js, or similar.

## Database Migrations

Database migrations are managed using Flyway. To create a new migration, add a new SQL file to the `db/migrations` directory following the Flyway naming convention: `V{version}__{description}.sql`, e.g., `V2__add_user_settings.sql`.
