# Research CMS — Prezentare Conferință

## Slide 1 — Titlu

**Research CMS**  
Platformă CMS open-source, self-hosted, pentru agenții digitale și utilizatori non-tehnici  
*Server-Driven UI · Constructor de Scheme · Multi-Client Management*

> [Screenshot: logo + titlu proiect]

---

## Slide 2 — Piața Actuală

| Soluție | Tip | Cost | Self-Hosted |
|---------|-----|------|-------------|
| WordPress | Monolithic | Free / Pluginuri plătite | ✅ |
| Strapi | Headless CMS | Gratuit / Cloud plătit | ✅ |
| Contentful | Headless CMS | $300+/lună | ❌ |
| Sanity | Headless CMS | $15+/lună | ❌ |
| Ghost | Newsletter CMS | $9+/lună | ✅ |
| Directus | Headless CMS | Gratuit / Cloud plătit | ✅ |

**Problema:** CMS-urile dezvoltatorilor necesită cunoștințe tehnice. CMS-urile user-friendly (WordPress) nu livreză pe multiple canale. Soluțiile comerciale sunt scumpe.

> [Screenshot: tabel comparativ]

---

## Slide 3 — Competiție

| Funcție | WordPress | Strapi | Contentful | **Research CMS** |
|---------|-----------|--------|------------|------------------|
| Tipuri de conținut vizuale | Limitativ | ✅ | ✅ | **✅ 17 tipuri câmp** |
| Fără cod | ❌ | ⚠️ | ⚠️ | **✅ Da** |
| Multi-canal | ⚠️ REST API | ✅ | ✅ | **✅ Web + Mobile SDUI** |
| Self-hosted | ✅ | ✅ | ❌ | **✅ Da** |
| Preț | Gratuit / Pluginuri | Gratuit | $300+/lună | **Gratuit** |
| Multi-client dintr-o instanță | ❌ | ❌ | ❌ | **✅ Da** |

> [Screenshot: tabel competiție evidențiind Research CMS]

---

## Slide 4 — Problema și Soluția

**Problema:**  
Agențiile digitale mici gestionează 5–15 proiecte. Nu își permit $300+/lună/client pentru Contentful sau developeri pentru Strapi.

**Soluția:**  
Platformă modulară unde utilizatorii non-tehnici își definesc singuri tipurile de conținut — articole, produse, evenimente — direct din interfață grafică, fără cod.

> [Screenshot: admin dashboard — lista scheme]

---

## Slide 5 — Constructor Dinamic de Scheme

- **17 tipuri de câmpuri:** text, textarea, richtext, email, url, number, date, boolean, media, select, tags, references, blocks
- Ordonează câmpurile drag-and-drop
- Configurare per câmp: required, valori implicite, opțiuni, referințe
- Toggle features: drafturi, revizii, search, SEO, slug
- Schimbări propagate instant către toate aplicațiile client

**Rezultat:** Un utilizator non-tehnic creează o schemă "Produs" cu 6 câmpuri în sub 3 minute.

> [Screenshot: schema builder — formular creare cu câmpuri]

---

## Slide 6 — Server-Driven UI (SDUI)

- Conținutul și layout-ul se configurează în admin
- Aplicațiile mobile/web fetch-uiesc layout-ul la runtime
- Schimbări de layout, ordine câmpuri, vizibilitate — **imediat reflectate**
- Fără app store review-uri, fără redeploy-uri, fără coordonare cu developeri

**Cum funcționează:**  
Admin construiește pagină cu blocuri → API servește layout + conținut → Clientul render-ează cu BlockRenderer

**Platforme suportate:** Web (React/Vite) + Mobile (Expo/React Native)

> [Screenshot: diagramă arhitectură SDUI — Admin → API → Web + Mobile]

---

## Slide 7 — Block & Page Builder

- **12 tipuri de blocuri** în 3 categorii:
  - *Static:* Heading, Text, Divider, Spacer, Image, Button
  - *Content:* Field, Archive (listă dinamică), Entry (individual)
  - *Layout:* Row (coloane), Column, Card
- Drag-and-drop din paletă, reordonare vizuală
- Configurare per bloc în sidebar (autogenerată din schema blocului)
- Vizibilitate per dispozitiv (mobile/tabletă/desktop)

**Caz de uz:** Manager de client construiește o pagină landing cu hero, heading, carduri și arhivă produse — tot din admin, fără developer.

> [Screenshot: block editor — paletă + zonă editare + sidebar configurare]

---

## Slide 8 — Multi-Client Management

- Creează API clienți cu template-uri (none / mobile / web)
- Control acces per-client la scheme
- Layout-uri per-client per-schemă
- Teme per-client (culori, border-radius, typografie)
- Urmărire utilizare și analytics per API key
- Pagini specifice clientului cu block-based layouts

**Un singur server Research CMS poate alimenta 10+ proiecte client.**

> [Screenshot: listă clienți în admin + pagină detaliu client]

---

## Slide 9 — Open Source & Self-Hosted

- **Licență MIT** — fără taxe de licențiere
- **Self-hosted** — datele rămân pe infrastructura ta
- **Fără preț per client** — clienți nelimitați, intrări nelimitate
- **Un singur server:** API, admin, web și mobile pornesc de pe un Node.js + MongoDB

| Soluție (10 clienți) | Cost lunar |
|----------------------|------------|
| Contentful | $3,000+ |
| Sanity | $150+ |
| Strapi Cloud | $500+ |
| **Research CMS (self-hosted)** | **~$20 (server)** |

> [Screenshot: grafic/iconiță cost — Research CMS vs. competiție]

---

## Slide 10 — Concluzie

- ✅ Constructor dinamic de tipuri de conținut — fără cod
- ✅ Server-Driven UI — schimbări instant pe web + mobile
- ✅ Drag-and-drop page editor — pentru utilizatori non-tehnici
- ✅ Multi-client — un dashboard pentru toate proiectele
- ✅ Self-hosted, open-source — control total, cost zero

**Gândește-te:**  
Blocajul în headless CMS nu e crearea de conținut — e coordonarea cu developerii de fiecare dată când se schimbă modelul de date. Research CMS elimină acest blocaj.

**Încearcă:** github.com/f0lder/research-cms

> [Screenshot: aplicația în funcțiune — admin + web + mobile]

---

---

# Research CMS — Headless CMS Dissertation Project

## Project Overview

**Type:** Master's/PhD Dissertation Project  
**Timeline:** March 2025 - Mid June 2025 (14 weeks, part-time)  
**Developer:** Solo developer working full-time job + weekends  
**Constraint:** Must have working implementation + evaluation + written dissertation by mid-June

### Research Contribution

**Core Hypothesis:** Dynamic schema definitions that automatically propagate to client applications without developer intervention eliminates deployment bottlenecks in headless CMS architectures.

**Key Innovation:** Admin-defined content types (schemas) automatically generate:
- Data validation rules in the backend
- Dynamic forms in the admin interface  
- Native mobile UI components via Server-Driven UI (SDUI)

**Differentiation from existing solutions (WordPress, Strapi, Contentful):**
- Zero developer involvement for new content types
- Real-time schema changes propagate to all clients
- Simplified architecture optimized for small teams/solo developers

---

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Monorepo | Nx Workspace | Orchestration, shared libraries, build optimization |
| Backend API | NestJS + MongoDB | Schema storage, content validation, REST endpoints |
| Admin Dashboard | Next.js 14 (App Router) | Schema builder, content management |
| Mobile App | Expo (React Native) | Cross-platform content consumption |
| Shared Types | TypeScript Library | Type safety across entire stack |
| Database | MongoDB Atlas | Document-oriented storage for flexible schemas |

### System Components

```
research-cms/
├── api/                  # NestJS backend
├── admin/                # Next.js admin dashboard
├── mobile/               # Expo mobile app
├── shared-types/         # Shared TypeScript definitions
├── api-e2e/              # End-to-end tests for the API
├── nx.json
└── package.json
```

### Data Flow

```
Admin creates "Product" schema
  ↓
API stores schema definition in MongoDB
  ↓
Admin generates form dynamically from schema
  ↓
User creates content entry (validated against schema)
  ↓
Mobile app fetches schema + content, renders via SDUI
```

---

## Current Implementation Status

### ✅ Week 1–2 Complete: Schema System

**Backend (API):**
- MongoDB connection configured
- ContentType schema (stores schema definitions)
- Schema CRUD endpoints: POST, GET, PUT, DELETE
- Field type validation (`text`, `number`, `boolean`, `image`)
- Slug-based schema retrieval

**Admin Dashboard:**
- Schema creation form with dynamic field builder
- Schema listing page
- Schema editing with delete functionality
- Reusable `SchemaForm` component
- Reusable `FieldInput` component
- Utility functions for API requests, slug generation, validation

**Key Files:**
```
api/src/app/
├── schema/
│   ├── schemas/content-type.schema.ts
│   ├── schema.service.ts
│   ├── schema.controller.ts
│   └── schema.module.ts

admin/src/
├── app/
│   └── schemas/
│       ├── page.tsx              # List all schemas
│       ├── create/page.tsx       # Create schema
│       └── edit/[slug]/page.tsx  # Edit schema
├── components/
│   └── schemas/
│       ├── SchemaForm.tsx        # Reusable form component
│       └── FieldInput.tsx        # Field definition input
└── lib/
    └── utils.ts                  # API helpers, validation, formatters
```

### ✅ Refactoring Complete

- Centralized API request logic in `utils.ts`
- Component extraction for reusability
- Auto-slug generation from schema name
- Slug validation with helpful error messages
- Loading states and error handling
- TypeScript strict mode throughout

---

## Next Implementation Steps

### 🔄 Week 3–4: Content Entry Storage (Current Priority)

**Backend:**
- [ ] ContentEntry schema (stores actual content with schemaId reference)
- [ ] Dynamic validation service (validates data against schema definition)
- [ ] Content CRUD endpoints per schema: `/content/:schemaSlug`
- [ ] Type checking for TEXT, NUMBER, BOOLEAN, IMAGE fields
- [ ] Required field validation
- [ ] Reject unexpected fields

**Admin Dashboard:**
- [ ] Schema detail page showing content entries
- [ ] Dynamic content entry form generator
  - Reads schema fields
  - Renders appropriate input types (text, number, checkbox, url)
  - Client-side validation
- [ ] Content entry list with edit/delete
- [ ] Reusable `ContentForm` component
- [ ] Reusable `DynamicFieldInput` component

**Files to Create:**
```
api/src/app/content/
├── schemas/content-entry.schema.ts
├── content.service.ts
├── content.controller.ts
└── content.module.ts

admin/src/app/schemas/[slug]/
├── page.tsx                    # Schema detail + content list
└── content/
    ├── create/page.tsx        # Create content entry
    └── edit/[id]/page.tsx     # Edit content entry

admin/src/components/content/
├── ContentForm.tsx
└── DynamicFieldInput.tsx
```

### 📱 Week 5–6: Mobile App (SDUI Implementation)

**Expo App:**
- [ ] Basic app structure and navigation
- [ ] Fetch schemas from API on launch
- [ ] Fetch content entries per schema
- [ ] Hardcoded SDUI templates:
  - List view (card layout)
  - Detail view (hero + vertical fields)
- [ ] Field type to component mapping
  - TEXT → Text component
  - NUMBER → Text component
  - BOOLEAN → Show/hide or Yes/No
  - IMAGE → Image component with URL
- [ ] Local caching with AsyncStorage
- [ ] Pull-to-refresh functionality

**Files to Create:**
```
mobile/src/
├── screens/
│   ├── SchemaListScreen.tsx
│   ├── ContentListScreen.tsx
│   └── ContentDetailScreen.tsx
├── components/
│   └── DynamicContent.tsx
└── services/
    └── api.ts
```

### 🔧 Week 7: Integration & Polish

- [ ] End-to-end testing: Create schema → Add content → View on mobile
- [ ] Error handling improvements
- [ ] Loading states and skeletons
- [ ] Empty states with helpful messages
- [ ] Basic styling with shadcn/ui (admin only)
- [ ] Demo video recording

### 📊 Week 8–9: Evaluation

**Primary Evaluation (Required):**
- [ ] Time comparison: WordPress custom post type vs. your system
- [ ] User study with 5-8 participants (non-technical users)
- [ ] Task: "Create a Product catalog with 3 fields"
- [ ] Metrics: completion time, errors, satisfaction survey

**Optional Enhancements (Week 8+ only if ahead of schedule):**
- [ ] Schema versioning (backward compatibility)
- [ ] Authentication (JWT with Passport)
- [ ] Image upload to cloud storage (vs. URL only)
- [ ] Rich text editor for TEXT fields
- [ ] Search/filter on content lists
- [ ] Bulk operations (delete multiple entries)

### 📝 Week 10-14: Dissertation Writing

Focus shifts to writing while maintaining functional system.

---

## Features Deliberately Excluded (Out of Scope)

**Will NOT implement due to time constraints:**
- ❌ Multi-tenant architecture
- ❌ Role-based access control (RBAC)
- ❌ Real-time collaboration
- ❌ Content versioning/revision history
- ❌ Advanced SDUI layouts (only list + detail)
- ❌ Complex relationships between content types
- ❌ Workflow/approval systems
- ❌ SEO optimization features
- ❌ Analytics/usage tracking
- ❌ Internationalization (i18n)
- ❌ Advanced caching strategies
- ❌ Rate limiting
- ❌ Comprehensive test suite (only manual testing)

These are documented as "future work" in dissertation.

---

## Setup Instructions

### Prerequisites

```bash
node --version   # v18 or higher
npm --version    # v9 or higher
```

MongoDB Atlas account with connection string.

### Installation

```bash
# Clone and install
git clone <repository-url>
cd research-cms
npm install

# Configure API environment
echo 'MONGO_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/cms' > api/.env

# Start development servers
# Terminal 1 - API
npx nx serve api

# Terminal 2 - Admin
npx nx serve admin
```

**Access:**
- API: http://localhost:3000
- Admin: http://localhost:4200

### Quick Test

1. Open http://localhost:4200
2. Create schema: Name="Product", Slug="product"
3. Add fields: `title` (text, required), `price` (number, required)
4. Submit → Should see schema in list

---

## Key Design Decisions

### Why MongoDB over PostgreSQL?
Dynamic schemas with unpredictable structures fit document databases better than rigid SQL tables. No migrations required for schema changes.

### Why Nx Monorepo?
Single repository for API, admin, and mobile ensures type safety across boundaries. Shared types library prevents API/frontend drift.

### Why Next.js App Router?
Server-side rendering for admin dashboard improves initial load. React Server Components reduce client bundle size.

### Why Expo over React Native CLI?
Faster development, built-in tooling, easier cross-platform deployment. Universal app (web + iOS + Android) from single codebase.

### Why No Tests?
Time constraint prioritizes working implementation over test coverage. Manual testing sufficient for dissertation scope.

### Why Simple SDUI (List + Detail only)?
Complex layout algorithms would consume 40+ hours. Hardcoded templates prove concept while remaining achievable.

---

## Common Issues & Solutions

### CORS Errors
Ensure `api/src/main.ts` has CORS enabled for localhost:4200 and localhost:19006.

### Module Format Errors (shared-types)
Check `libs/shared-types/package.json` has `"type": "module"` and rebuild with `npx nx build shared-types`.

### MongoDB Connection Fails
Verify IP whitelist in MongoDB Atlas. Check connection string in `api/.env`.

### Admin Pages 404
Check folder structure uses `[slug]` with brackets for dynamic routes.

---

## Performance Targets

**API Response Times:**
- Schema CRUD: <100ms
- Content validation: <50ms per entry
- Bulk content fetch: <200ms for 100 entries

**Admin Dashboard:**
- Schema list load: <500ms
- Dynamic form generation: <100ms
- Schema save: <300ms total

**Mobile App:**
- Schema fetch on launch: <1s
- Content list render: <500ms
- SDUI layout generation: <50ms per screen

---

## Dissertation Evaluation Plan

### Quantitative Metrics
1. **Deployment Time:** WordPress custom post type (30 min) vs. Your system (3 min)
2. **Schema Change Propagation:** Immediate vs. code deployment required
3. **Developer Coordination:** 3 people (backend/frontend/mobile) vs. 1 person (admin user)

### Qualitative Metrics
1. **User Study (n=8):** Task completion rate, error frequency, SUS scores
2. **Comparison Table:** Feature parity analysis vs. existing solutions
3. **Architecture Analysis:** Complexity reduction, maintenance burden

### Expected Contribution Statement
"We demonstrate that runtime schema definition with automatic client propagation reduces content type deployment time by 90% compared to traditional CMS architectures (WordPress), validated through user testing with non-technical administrators (n=8, mean task completion 3.2 minutes vs. 28 minutes)."

---

## Current Blockers / Risks

**None currently.** Week 1–2 complete on schedule.

**Potential Future Risks:**
- Week 3-4: Dynamic form validation complexity
- Week 5-6: SDUI component mapping edge cases
- Week 8-9: User study recruitment delays
- Week 12-14: Writing time underestimated

**Mitigation:** Aggressive scope cutting if any week exceeds time budget. Mobile app becomes "proof of concept" with 2 screens if needed.

---

## Contact & Handoff Notes

**For AI Assistant Continuation:**
- All existing code follows TypeScript strict mode
- API uses NestJS decorators pattern
- Admin uses React functional components with hooks
- No class components anywhere
- Error handling: service throws, controller returns 400/404
- All dates use ISO 8601 strings
- MongoDB ObjectIds stored as strings in TypeScript

**Coding Conventions:**
- 2-space indentation
- Single quotes for strings
- No semicolons (except where required)
- Inline styles for rapid prototyping (no CSS modules yet)
- Comments only for complex logic, not obvious code

**Next Steps:**
Continue Week 3–4 implementation: create the `ContentEntry` backend with dynamic validation, then build dynamic content forms in the admin dashboard. Start with `content.service.ts` validation logic.

---

## License

MIT (Academic Use)

---

**Last Updated:** February 2026  
**Project Status:** Week 2 complete, Week 3 in progress  
**Estimated Completion:** On track for June deadline