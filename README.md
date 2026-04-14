# Ecommerce Backend (Starter)

Production-ready backend starter architecture for an ecommerce platform with:

- Public storefront APIs (no user auth planned at this stage)
- Admin-controlled dashboard and content management
- Scalable module-first code organization

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- ESLint + Prettier
- Zod for environment validation

## Project Structure

```text
src/
  app.ts
  server.ts
  lib/
    prisma.ts
  config/
    env.ts
  core/
    errors/
      ApiError.ts
      globalErrorHandler.ts
      notFoundHandler.ts
  modules/
    health/
      health.route.ts
  routes/
    index.ts
  utils/
    catchAsync.ts
prisma/
  schema.prisma
```

## Scripts

- `npm run dev` -> start development server with hot reload
- `npm run build` -> compile TypeScript to `dist/`
- `npm run start` -> run compiled production build
- `npm run typecheck` -> run TypeScript checks
- `npm run lint` -> run ESLint
- `npm run lint:fix` -> auto-fix lint issues
- `npm run format` -> format files using Prettier
- `npm run prisma:generate` -> generate Prisma client
- `npm run prisma:migrate:dev` -> create/apply migration in development
- `npm run prisma:migrate:deploy` -> apply migrations in production
- `npm run prisma:db:push` -> sync schema without migration (quick prototyping)
- `npm run prisma:studio` -> open Prisma Studio

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start development server:

```bash
npm run dev
```

## Database Setup (PostgreSQL + Prisma)

1. Ensure PostgreSQL is running locally.

2. Update `DATABASE_URL` inside `.env`.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create and apply your first migration when models change:

```bash
npm run prisma:migrate:dev -- --name init
```

## Health Endpoint

- `GET /api/v1/health`

## Next Steps

- Build admin auth module
- Add product, order, inventory, and CMS modules
- Add validation, logging, and testing framework per module
