# Research CMS

> A headless CMS with **dynamic schemas** — content types defined in the admin UI automatically propagate to every client app (web & mobile) with zero developer intervention.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Nx](https://img.shields.io/badge/Nx-monorepo-143055?logo=nx&logoColor=white)](https://nx.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## Overview

Research CMS lets non-technical users **define their own content structures** through a graphical schema builder — no code, no deployments. A schema (e.g. *Product*, *Article*, *Event*) is stored once and instantly drives:

- **Validation** on the API
- **Dynamic forms** in the admin dashboard
- **Server-Driven UI (SDUI)** rendering in the web and mobile clients

A single instance is **multi-client**: one server can host many projects, each with its own schemas, content, pages, menus, and theme.

> **Academic context.** This is a dissertation research project. The core hypothesis: *runtime schema definitions that automatically propagate to client applications eliminate the developer-coordination bottleneck present in traditional headless CMS architectures.*

---

## Features

- 🧩 **Visual schema builder** — 15 field types, drag-and-drop ordering, per-field config (required, defaults, options, validation).
- 📝 **Auto-generated content forms** — forms and validation are derived directly from the schema; add a field and the form updates instantly.
- 🎨 **Block-based page editor** — reusable blocks (heading, text, image, button, dynamic field/list/entry, columns, card) with device-visibility controls.
- 📱 **Server-Driven UI** — web and mobile render the same schema/page definitions from a single endpoint; content changes ship without app-store updates.
- 👥 **Multi-client** — per-client API keys, schemas, content, pages, menus, themes, and usage tracking.
- 🔐 **Auth & roles** — session-based authentication with `admin` / `editor` / `viewer` roles.
- 🔗 **References** — relationships between content types via reference fields.
- 🪝 **Webhooks** — outbound events (content/schema/media changes) with optional HMAC signing.
- 🖼️ **Media library** — file uploads with a built-in picker.
- 🗂️ **Drafts, revisions, trash & bulk actions** for content entries.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Monorepo | **Nx** | Orchestration, shared libraries, build caching |
| Backend API | **NestJS 11 + Mongoose** | Schema storage, dynamic validation, REST endpoints |
| Database | **MongoDB** | Document storage — ideal for evolving, schemaless structures |
| Admin Dashboard | **Next.js 14** (App Router) | Schema builder, content & page management |
| Web Client | **React + Vite** | Public-facing site rendered via SDUI |
| Mobile App | **Expo (React Native)** | Cross-platform content consumption via SDUI |
| Shared Types | **TypeScript library** | Single source of truth across the whole stack |

---

## Monorepo Structure

```
research-cms/
├── api/            # NestJS backend (REST API, validation, auth, webhooks)
├── admin/          # Next.js admin dashboard
├── web/            # React + Vite public web client (SDUI)
├── mobile/         # Expo / React Native app (SDUI)
├── shared-types/   # Shared TypeScript types (@research-cms/shared-types)
├── api-e2e/        # API end-to-end tests
├── uploads/        # Local media storage
└── nx.json
```

The `FieldType` union and related interfaces in [`shared-types/src/lib/types.ts`](shared-types/src/lib/types.ts) are the single source of truth for content modeling, imported everywhere via `@research-cms/shared-types`.

---

## Architecture

### Data flow

```
Admin defines a schema
        │
        ▼
API stores the schema in MongoDB
        │
        ▼
Admin renders a dynamic form from the schema
        │
        ▼
User creates a content entry  ──►  API validates it against the schema
        │
        ▼
Web & Mobile fetch schema + content  ──►  render via Server-Driven UI
```

### System diagram

```
┌──────────────────────────────────────────────────────┐
│                 ADMIN DASHBOARD (Next.js)              │
│   Schema builder · Content mgmt · Block page editor    │
└───────────────────────────┬──────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────┐
│                      API (NestJS)                      │
│   Schema · Content · Pages · Clients · Auth · Webhooks │
│                          │                             │
│                     ┌────┴────┐                        │
│                     │ MongoDB │                        │
│                     └─────────┘                        │
└───────────────┬───────────────────────┬───────────────┘
                ▼                       ▼
   ┌──────────────────────┐  ┌──────────────────────┐
   │  Web (React + Vite)  │  │   Mobile (Expo)      │
   │  SDUI rendering      │  │   SDUI rendering     │
   └──────────────────────┘  └──────────────────────┘
```

### API modules

- **SchemaModule** — CRUD for `ContentType` documents (name, slug, `fields[]`); cascade-updates content on schema rename.
- **ContentModule** — CRUD for `ContentEntry` documents; runs full validation (types, required fields, select options, array/reference/email/URL checks).
- **Auth, Clients, Pages, Menus, Media, Webhooks, Logs, Settings** modules round out the platform.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- A **MongoDB** connection string (e.g. MongoDB Atlas)

### Installation

```bash
git clone <repository-url>
cd research-cms
npm install
```

### Environment

Create `api/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/research-cms
```

The admin's API base URL is configured via `NEXT_PUBLIC_API_URL` in `admin/src/config.ts` (defaults to `http://localhost:3000`).

### Run the dev servers

```bash
npm exec nx serve api      # API     → http://localhost:3000
npm exec nx serve admin    # Admin   → http://localhost:4200
npm exec nx serve web      # Web     → http://localhost:4300
npm exec nx serve mobile   # Mobile  → Expo (http://localhost:19006)
```

### Quick test

1. Open the admin at http://localhost:4200 and register the first user (it becomes `admin`).
2. Create a schema: name **Product**, slug **product**.
3. Add fields: `title` (text, required), `price` (number, required).
4. Add a content entry — the form is generated from your schema.
5. View it rendered on the web/mobile client.

---

## Apps & Ports

| App | Command | URL |
|-----|---------|-----|
| API | `nx serve api` | http://localhost:3000 |
| Admin | `nx serve admin` | http://localhost:4200 |
| Web | `nx serve web` | http://localhost:4300 |
| Mobile | `nx serve mobile` | Expo (http://localhost:19006) |

CORS is restricted in [`api/src/main.ts`](api/src/main.ts) to the local admin, web, and mobile origins.

---

## Common Commands

All tasks run through Nx (prefix with `npm exec` to use the workspace-local CLI):

```bash
# Build
npm exec nx build api
npm exec nx run-many --targets=build

# Lint
npm exec nx lint admin
npm exec nx run-many --targets=lint

# Test (minimal — manual testing is primary for this project)
npm exec nx test api-e2e

# Inspect the workspace graph
npm exec nx graph
```

---

## Content Modeling

Schemas are lists of fields, each mapped to a `FieldType`. Supported types:

`text` · `textarea` · `richtext` · `email` · `url` · `number` · `date` · `datetime` · `boolean` · `media` · `select` · `tags` · `reference` · `references` · `blocks`

Types that need extra options carry a `FieldConfig` (e.g. `{ type: 'select', options: [...] }`, `{ type: 'reference', targetSlug: '...' }`).

---

## Key Design Decisions

- **MongoDB over PostgreSQL** — dynamic, unpredictable schema shapes fit a document database; no migrations on every schema change.
- **Nx monorepo** — shared types enforce API/client consistency at compile time.
- **Server-Driven UI** — web and mobile share one rendering contract, so content and layout changes ship without redeploying clients.
- **Manual-first testing** — comprehensive automated tests are out of scope for the time-boxed dissertation; testing is primarily manual.

---

## License

MIT — Academic use.
