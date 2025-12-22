# Ekoru Marketplace API

A NestJS GraphQL Federation subgraph that powers the Ekoru marketplace platform. This service manages products, categories, departments, environmental impact data, and seller information.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Database Management](#database-management)
- [Testing](#testing)
- [Docker](#docker)
- [GraphQL API](#graphql-api)
- [Code Quality](#code-quality)
- [Contributing](#contributing)

## Overview

This is a GraphQL Federation subgraph built with:

- **NestJS** (v11) - Progressive Node.js framework
- **Apollo Server** (v5) - GraphQL server implementation
- **Prisma** (v5.22) - Next-generation ORM
- **PostgreSQL** - Primary database
- **TypeScript** (v5.7) - Type-safe development
- **GraphQL Code First** approach

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 22.14.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 14
- **Docker** and **Docker Compose** (optional, for containerized development)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ekoru-marketplace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Set Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run start:dev
```

The GraphQL API will be available at `http://localhost:4002/graphql`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Application
PORT=4002
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ekoru_marketplace?schema=public"

# (Add other environment variables as needed)
```

### Required Environment Variables

| Variable       | Description                               | Default       |
| -------------- | ----------------------------------------- | ------------- |
| `DATABASE_URL` | PostgreSQL connection string              | -             |
| `PORT`         | Application port                          | `4002`        |
| `NODE_ENV`     | Environment (development/production/test) | `development` |

## Running the Application

### Development Mode

```bash
npm run start:dev
```

Runs with hot-reload enabled. Changes to source files will automatically restart the server.

### Debug Mode

```bash
npm run start:debug
```

Starts the application in debug mode with inspector enabled.

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## Project Structure

```
ekoru-marketplace/
├── prisma/
│   └── schema.prisma          # Database schema and models
├── src/
│   ├── app.module.ts          # Root application module
│   ├── main.ts                # Application entry point
│   ├── catalog/               # Product catalog module
│   │   ├── catalog.module.ts
│   │   ├── catalog.resolver.ts
│   │   ├── catalog.service.ts
│   │   └── entities/          # GraphQL entities
│   ├── marketplace/           # Marketplace module
│   │   ├── marketplace.module.ts
│   │   ├── marketplace.resolver.ts
│   │   └── marketplace.service.ts
│   ├── products/              # Products management module
│   │   ├── products.module.ts
│   │   ├── products.resolver.ts
│   │   ├── products.service.ts
│   │   └── dto/               # Data transfer objects
│   ├── impact/                # Environmental impact module
│   │   ├── impact.module.ts
│   │   ├── impact.resolver.ts
│   │   └── entities/
│   ├── common/                # Shared utilities
│   │   ├── decorators/
│   │   ├── exceptions/
│   │   └── utils/
│   ├── config/                # Configuration files
│   │   └── configuration.ts
│   ├── graphql/               # GraphQL scalars & enums
│   ├── prisma/                # Prisma module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── health/                # Health check endpoint
├── test/                      # E2E tests
├── Dockerfile                 # Production Docker image
├── compose.prod.yml           # Production Docker Compose
├── compose.qa.yml             # QA Docker Compose
└── package.json
```

## Available Scripts

### Development

```bash
npm run start          # Start in standard mode
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start in debug mode
```

### Building

```bash
npm run build          # Compile TypeScript to JavaScript
```

### Testing

```bash
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage report
npm run test:debug     # Run tests in debug mode
npm run test:e2e       # Run end-to-end tests
```

### Code Quality

```bash
npm run lint           # Run ESLint and auto-fix issues
npm run format         # Format code with Prettier
```

### Database

```bash
npx prisma generate    # Generate Prisma Client
npx prisma migrate dev # Create and apply migrations
npx prisma studio      # Open Prisma Studio (database GUI)
npx prisma db push     # Push schema changes (dev only)
npx prisma db seed     # Seed the database
```

## Database Management

### Prisma Studio

Launch a visual database editor:

```bash
npx prisma studio
```

Prisma Studio will open at `http://localhost:5555`

### Creating Migrations

When you modify `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name <migration-name>
```

Example:

```bash
npx prisma migrate dev --name add-product-reviews
```

### Resetting the Database

⚠️ **Warning**: This will delete all data!

```bash
npx prisma migrate reset
```

## Testing

### Unit Tests

```bash
npm test
```

Tests are located alongside the source files with `.spec.ts` extension.

### E2E Tests

```bash
npm run test:e2e
```

E2E tests are located in the `test/` directory.

### Coverage Report

```bash
npm run test:cov
```

Coverage reports are generated in the `coverage/` directory.

## Docker

### Development with Docker Compose

```bash
# Start services (QA environment)
docker-compose -f compose.qa.yml up

# Start services (Production environment)
docker-compose -f compose.prod.yml up
```

### Building Docker Image

```bash
docker build -t ekoru-marketplace:latest .
```

### Running Container

```bash
docker run -p 4002:4002 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  ekoru-marketplace:latest
```

## GraphQL API

### Accessing the GraphQL Playground

Once the server is running, access the GraphQL Playground at:

```
http://localhost:4002/graphql
```

### Available Modules

- **Catalog**: Browse departments, categories, and products
- **Products**: Manage product listings and details
- **Marketplace**: Seller and marketplace operations
- **Impact**: Environmental impact data and calculations
- **Health**: Service health checks

### Example Queries

#### Get Products

```graphql
query GetProducts {
  products(first: 10) {
    edges {
      node {
        id
        name
        description
        price
      }
    }
  }
}
```

#### Get Departments

```graphql
query GetDepartments {
  departments {
    id
    name
    categories {
      id
      name
    }
  }
}
```

### Federation

This service is designed as an Apollo Federation subgraph. It can be composed with other subgraphs using Apollo Gateway or Apollo Router.

## Code Quality

### Linting

```bash
npm run lint
```

Project uses ESLint with TypeScript support.

### Formatting

```bash
npm run format
```

Code is formatted using Prettier with project-specific rules.

### Pre-commit Hooks

Consider setting up Husky for pre-commit hooks to ensure code quality:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

## Contributing

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks

### Commit Messages

Follow conventional commits:

```
feat: add product search functionality
fix: resolve pagination issue in catalog
docs: update README with new endpoints
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass: `npm test`
5. Run linting: `npm run lint`
6. Create a pull request with a clear description
7. Request code review
8. Merge after approval

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
# Test connection
psql $DATABASE_URL
```

### Prisma Client Not Found

Regenerate the Prisma Client:

```bash
npx prisma generate
```

### Port Already in Use

Change the port in `.env` or kill the process using port 4002:

```bash
# Find process
lsof -i :4002

# Kill process (replace PID)
kill -9 <PID>
```

### Module Resolution Errors

Clear cache and reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Apollo GraphQL Documentation](https://www.apollographql.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GraphQL Federation](https://www.apollographql.com/docs/federation)

## Support

For questions or issues, please contact:

- **Author**: Ignacio Rodríguez Rulas (EKORU CTO)
- **Project**: Ekoru Marketplace

---

**License**: UNLICENSED (Private)
