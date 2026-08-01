# Compoz

Compoz is a private Next.js, React, and TypeScript monorepo for building and rendering configurable websites.

The repository contains two main applications:

- `apps/studio`: administration and site builder interface.
- `apps/site`: public rendering application for published sites.

It also contains shared packages for domain rules, validation, UI, infrastructure, and HTTP helpers.

## Project overview

Compoz demonstrates a structured approach to building a small website platform with a clear separation between editing, validation, persistence, and public rendering.

The studio application is used to manage site content and settings. The public site application renders the published version of that content through the Next.js App Router.

The project is intentionally organized as a monorepo so that domain types, validation schemas, UI rendering primitives, and infrastructure adapters can be shared without duplicating business logic across applications.

## Why this project exists

This project was built to explore and demonstrate production-oriented architecture in a TypeScript web application.

The main focus is not on adding a large number of features. The focus is on code organization, type safety, validation boundaries, draft and published workflows, and maintainable separation between domain, infrastructure, and UI layers.

The repository is private and intended to be shared for technical review on request.

## Main features

- Studio application for managing website content and settings.
- Public rendering application for published websites.
- Draft and published content workflow.
- Page editing based on sections, rows, columns, and cells.
- Site settings for identity, SEO, theme, header, footer, menus, and social links.
- Multi-site public rendering.
- Zod validation schemas shared across application boundaries.
- React Hook Form based form flows in the studio application.
- Prisma and PostgreSQL persistence layer.
- Prisma and PostgreSQL persistence for websites and pages, with key-value storage used for operational caches and status snapshots.
- Shared renderer and design system components.

## Tech stack

- Next.js App Router
- React
- TypeScript
- pnpm workspaces
- Prisma
- PostgreSQL
- Zod
- React Hook Form
- TanStack Query
- Tailwind CSS
- Radix UI
- NextAuth
- Vercel Blob integration for media storage
- Upstash Redis integration for operational caches and site status snapshots
- Resend integration for contact handling

## Architecture

Compoz follows a layered architecture with explicit package boundaries:

- `@compoz/core` contains domain constants, business rules, and domain use cases.
- `@compoz/validation` contains Zod schemas and validation contracts.
- `@compoz/infra` contains persistence, Prisma access, repositories, media handling, and external integrations.
- `@compoz/ui` contains shared UI components, site rendering primitives, and styling utilities.
- `@compoz/http` contains HTTP envelopes and error helpers.

The applications depend on the shared packages instead of duplicating cross-cutting logic locally.

The domain layer avoids direct runtime dependencies such as environment variables. Runtime values are injected by the application or infrastructure layers when needed.

Forms in the studio application follow an RHF-first approach. Feature areas are organized around page components, sections, forms, hooks, mappers, validation, and cache helpers.

## Repository structure

```txt
apps/
  site/       Public site renderer
  studio/     Administration and builder interface

packages/
  core/       Domain model, constants, and business rules
  validation/ Zod schemas and validation boundaries
  ui/         Shared design system and rendering components
  infra/      Prisma, repositories, storage, and integrations
  http/       HTTP helpers, envelopes, and errors

scripts/      Maintenance and validation scripts
```

## Local development

The project uses Node.js `>=22` and `pnpm@10.14.0`.

Install dependencies:

```sh
pnpm install
```

Generate the Prisma client:

```sh
pnpm db:generate
```

Run both applications:

```sh
pnpm dev
```

Run only the studio application:

```sh
pnpm dev:studio
```

Run only the public site application:

```sh
pnpm dev:site
```

Build both applications:

```sh
pnpm build
```

Run the full project check:

```sh
pnpm check
```

The studio application runs on port `3000`. The public site application runs on port `3001`.

## Environment variables

Environment variables are loaded by the applications and infrastructure package depending on the feature being used.

Core local development generally requires:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `AUTH_SECRET`: secret used by the studio authentication flow.
- `NEXT_PUBLIC_SITE_ORIGIN`: public site origin used by studio publishing and preview flows.
- `NEXT_PUBLIC_SITE_URL`: base URL used by the public site for metadata, robots, and sitemap generation.

Optional variables are used for integrations and operational behavior:

- `BLOB_READ_WRITE_TOKEN`: required for media operations; Vercel Blob is the only supported media backend.
- `MAX_IMAGE_UPLOAD_BYTES` and `NEXT_PUBLIC_MAX_IMAGE_UPLOAD_BYTES`: image upload size limits.
- `COMPOZ_REVALIDATE_SECRET`: protects public site revalidation routes.
- `CRON_SECRET`: protects internal cleanup routes.
- `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`: contact form email delivery.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN`: preferred complete Upstash Redis REST credential pair.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: alternative complete Upstash Redis REST credential pair.
- `NEXT_PUBLIC_LOG_LEVEL`: logging verbosity.

Additional environment variables exist for demo, telemetry, and site verification flows. They should be configured only when those flows are needed.

Redis currently stores the reconstructible cache of Studio site statuses. When both Redis credential families are configured, the `KV_REST_API_*` pair takes priority. A credential pair must be complete and values from the two families are never mixed.

## Code quality

The repository uses strict TypeScript checks and package-level linting.

Common quality commands:

```sh
pnpm lint
pnpm lint:strict
pnpm typecheck
pnpm check
```

Prisma validation is available through:

```sh
pnpm db:validate
```

The root `pnpm check` command runs strict linting, type checking, the i18n guard, the Studio build, and the Site build.

## Project status

Compoz is an active private project used to demonstrate architecture, implementation quality, and technical decision-making.

The codebase is not presented as an open-source product or a reusable public platform. It should be reviewed as a focused technical project with a working studio, public rendering app, shared validation, and a typed infrastructure layer.

## Usage notice

This repository is private and proprietary.

It is shared for technical review only. No permission is granted to copy, redistribute, publish, sublicense, or reuse the code outside the scope of an explicitly authorized review.
