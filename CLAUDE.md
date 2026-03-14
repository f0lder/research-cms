<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **headless CMS with dynamic schemas** — a dissertation research project. The core concept is that schemas defined in the admin UI automatically propagate to client apps without developer intervention. The stack is an **Nx monorepo** with:

- `api/` — NestJS 11 backend (port 3000), MongoDB via Mongoose
- `admin/` — Next.js 14+ admin dashboard (port 4200, App Router)
- `mobile/` — Expo (React Native) app (port 19006)
- `shared-types/` — TypeScript type library shared across all apps

## Commands

Use `npm` as the package manager prefix for Nx commands.

```bash
# Development servers
npm exec nx serve api           # API at http://localhost:3000
npm exec nx serve admin         # Admin at http://localhost:4200

# Build
npm exec nx build api
npm exec nx build admin
npm exec nx build shared-types
npm exec nx run-many --targets=build

# Lint
npm exec nx lint api
npm exec nx lint admin
npm exec nx run-many --targets=lint

# E2E tests (minimal — manual testing is primary for this project)
npm exec nx test api-e2e
```

## Architecture

### Data flow

```
Admin defines schema → API stores in MongoDB → Admin renders dynamic form
→ User creates content entry → API validates against schema
→ Mobile fetches schema + content → renders via server-driven UI
```

### Shared types (`shared-types/src/lib/types.ts`)

The `FieldType` enum and related interfaces are the single source of truth for content modeling. Every field in a schema maps to a `FieldType`. The `FieldConfig` union type carries per-type extra config (e.g., `{ type: 'select'; options: string[] }`, `{ type: 'reference'; targetSlug: string }`).

Import path alias: `@research-cms/shared-types` (defined in `tsconfig.base.json`).

### API modules

- **SchemaModule** — CRUD for `ContentType` documents (name, slug, fields[]). `SchemaService` also handles cascade-updating content when a schema is renamed.
- **ContentModule** — CRUD for `ContentEntry` documents (schemaSlug, data). `ContentService` runs comprehensive field validation: type checks, required fields, select options, array validation for TAGS/REFERENCES, email/URL format.

CORS is configured in `api/src/main.ts` to allow `localhost:4200` and `localhost:19006` only.

### Admin routing

```
/schemas                           → list all schemas
/schemas/create                    → SchemaForm (create)
/schemas/edit/[slug]               → SchemaForm (edit)
/schemas/[slug]                    → detail + content entries list
/schemas/[slug]/content/create     → ContentForm (create)
/schemas/[slug]/content/edit/[id]  → ContentForm (edit)
```

API helpers live in `admin/src/lib/utils.ts` (functions: `apiRequest`, `getAllSchemas`, `getSchema`, `createSchema`, `getAllEntries`, `createEntry`, `updateEntry`, `deleteEntry`). The base URL is configured via `NEXT_PUBLIC_API_URL` in `admin/src/config.ts` (defaults to `http://localhost:3000`).

### Environment setup

Create `api/.env` with:
```
MONGO_URI=<your MongoDB Atlas connection string>
```

## Key design decisions

- **MongoDB over PostgreSQL** — dynamic schemas with unpredictable structure; no migrations needed.
- **Nx monorepo** — shared types enforce consistency across API/admin/mobile at compile time.
- **No comprehensive tests** — manual testing only; time-boxed dissertation scope.
- **SDUI in mobile** — server-driven UI renders content screens from schema definitions; only list+detail layouts are implemented to stay within time constraints.
