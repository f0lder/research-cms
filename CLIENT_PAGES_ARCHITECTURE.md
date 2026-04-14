# Client Pages Architecture

## Overview

The **Client Pages system** is a server-driven UI (SDUI) architecture that allows admins to create custom pages for client apps (mobile + web). Each **Client** (formerly "API Key") can have its own set of **Pages** with custom block layouts.

Pages are composed of **Blocks** — reusable UI components that can display:
- Single fields from content entries
- Static headings and text
- Archives (collections of entries with auto-applied schema layouts)

---

## Core Concepts

### Three-Layer Architecture

```
Admin (Next.js 14)
     ↓
API (NestJS + Mongoose)
     ↓
Mobile App (Expo) / Web Client
```

### Key Models

#### **Client** (`@research-cms/shared-types`)
```typescript
interface Client {
  _id?: string;
  name: string;                    // Display name (e.g., "iOS App")
  key: string;                     // API key for authentication
  hits: number;                    // API call count (metrics)
  lastUsedAt?: string | null;      // Last API usage timestamp
  active: boolean;                 // Enable/disable access
  allowedSchemas: string[];        // Empty = all schemas (whitelist)
  layouts: ClientLayout[];         // Per-schema block overrides
  homePage?: string | null;        // Landing page modal._id
  createdAt?: string;
}
```

#### **ClientPage** (`@research-cms/shared-types`)
```typescript
type PageStatus = 'draft' | 'published';

interface ClientPage {
  _id?: string;
  clientId: string;                // Reference to parent Client
  title: string;                   // Display title ("About Us")
  slug: string;                    // URL slug ("about-us") — unique per client
  status: PageStatus;              // Draft/Published state
  blocks: Block[];                 // Page content as array of blocks
  parentId?: string | null;        // For hierarchical navigation (parent page ID)
  isHome?: boolean;                // Injected by API: true if this is client's home page
  createdAt?: string;
  updatedAt?: string;
}
```

#### **Block Taxonomy** (Complete Hierarchy)

The block system is organized by **data fetching pattern** and supports three categories:

```
Blocks
├── Static blocks (no data fetching)
├── Content blocks (fetch from CMS)
└── Layout blocks (contain other blocks)
```

**BaseBlock** — All blocks inherit these properties:

```typescript
export interface BaseBlock {
  id: string;                        // uuid — stable for drag/drop
  type: string;                      // Discriminant
  visible: boolean;
  order: number;

  // Spacing
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  margin?: { top?: number; right?: number; bottom?: number; left?: number };

  // Styling
  backgroundColor?: string;
  borderRadius?: number;
  border?: { width?: number; color?: string; style?: 'solid' | 'dashed' | 'dotted' };

  // Responsive
  hideOn?: ('mobile' | 'tablet' | 'desktop')[];

  // Animation
  animation?: 'none' | 'fadeIn' | 'slideUp' | 'slideIn';

  // Metadata
  meta?: Record<string, unknown>;
}
```

**Static Blocks** (no external data fetching):

```typescript
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level?: 1 | 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'semibold';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  color?: string;
  thickness?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: number;  // px
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  width?: number | 'full';
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  linkUrl?: string;
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  label: string;
  action: ButtonAction;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  align?: 'left' | 'center' | 'right' | 'full';
  icon?: string;
}

export type ButtonAction =
  | { type: 'navigate'; pageSlug: string }
  | { type: 'url'; url: string }
  | { type: 'schema'; schemaSlug: string }
  | { type: 'entry'; schemaSlug: string; entryId: string };
```

**Content Blocks** (fetch data from CMS):

```typescript
export interface FieldBlock extends BaseBlock {
  type: 'field';
  fieldName: string;
  label: string;
  fieldType: FieldType;
  value: ResolvedFieldValue;       // Resolved server-side
  showLabel?: boolean;
  labelPosition?: 'above' | 'inline' | 'hidden';
}

export interface ArchiveBlock extends BaseBlock {
  type: 'archive';
  schemaSlug: string;
  title?: string;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filter?: { field: string; operator: 'eq' | 'contains' | 'gt' | 'lt'; value: unknown }[];
  layout?: 'list' | 'grid' | 'carousel';
  columns?: 1 | 2 | 3;
  items?: ResolvedEntry[];          // Resolved server-side
  emptyMessage?: string;
}

export interface EntryBlock extends BaseBlock {
  type: 'entry';
  schemaSlug: string;
  entryId: string;
  showFields?: string[];
  entry?: ResolvedEntry;            // Resolved server-side
}
```

**Layout Blocks** (contain other blocks):

```typescript
export interface RowBlock extends BaseBlock {
  type: 'row';
  columns: ColumnBlock[];
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
}

export interface ColumnBlock extends BaseBlock {
  type: 'column';
  width?: number | 'auto';
  blocks: Block[];
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  blocks: Block[];
  elevation?: number;
  pressAction?: ButtonAction;
}
```

**Block Union** (exhaustiveness checking):

```typescript
export type Block =
  // Static
  | HeadingBlock
  | TextBlock
  | DividerBlock
  | SpacerBlock
  | ImageBlock
  | ButtonBlock
  // Content
  | ArchiveBlock
  | EntryBlock
  | FieldBlock
  // Layout
  | RowBlock
  | ColumnBlock
  | CardBlock;

export type BlockType = Block['type'];
```

#### **ClientLayout** (Schema-specific template blocks)

```typescript
// Template blocks without resolved data (used in ClientLayout definitions)
export type LayoutBlock =
  | Omit<FieldBlock, 'value'>
  | Omit<ArchiveBlock, 'items'>
  | Omit<EntryBlock, 'entry'>;

export interface ClientLayout {
  schemaSlug: string;              // e.g., "blog-post"
  blocks: LayoutBlock[];           // Template with no resolved values
}
```

**Key distinction**: 
- **Block**: Contains fully resolved data (values, fetched entries, etc.). Used in API responses.
- **LayoutBlock**: Template without resolved data. Used to define schema rendering templates.

---

## Admin Interface

### Locations
- **List clients**: `/clients`
- **Client details**: `/clients/[id]`
- **Create/read/update pages**: `/clients/[id]/pages`
- **Edit page blocks**: `/clients/[id]/pages/[pageId]`

### User Flow

1. **Admin creates a new Client**
   - Name: "iOS App"
   - Auto-generated API key for that app to authenticate
   - Optionally restrict `allowedSchemas` list
   - Set `homePage` to direct users to a specific page

2. **Admin creates Pages for that Client**
   - Title: "About Us"
   - Slug: "about-us" (must be unique within client)
   - Status: Draft (can save and iterate)
   - Build blocks by selecting:
     - **FieldBlock**: Pick a specific field from an entry
     - **HeadingBlock**: Add a heading
     - **TextBlock**: Add static text
     - **ArchiveBlock**: Embed a collection of entries from a schema

3. **Admin customizes layout for each schema** (optional)
   - Under `layouts`, define how entries from "blog-post" schema render
   - This layout applies to all ArchiveBlocks that reference that schema

4. **Admin publishes the page**
   - Status changes to "published"
   - Mobile app can now fetch and display it

---

## API Endpoints

### Client Pages (Admin-only)

```
GET    /clients/:clientId/pages              # List all pages (drafts + published)
GET    /clients/:clientId/pages/:pageId      # Get single page
POST   /clients/:clientId/pages              # Create page
PUT    /clients/:clientId/pages/:pageId      # Update page
DELETE /clients/:clientId/pages/:pageId      # Delete page
```

**Payload** (Create/Update):
```json
{
  "title": "About Us",
  "slug": "about-us",
  "status": "draft",
  "blocks": [
    { "type": "heading", "text": "About Our Company", "level": 1 },
    { "type": "text", "content": "Founded in 2020..." },
    { "type": "archive", "schemaSlug": "blog-post", "limit": 5 }
  ],
  "parentId": null
}
```

### Public API (For Client Apps)

```
GET /public/pages/:slug              # Fetch published page by slug (client-isolated via API key)
GET /public/entries/:schemaSlug/:id  # Fetch full entry with resolved blocks
GET /public/entries/:schemaSlug      # List entries with pagination
```

**Client Isolation**: Public page endpoint derives `clientId` from API key in auth guard:
```typescript
// pages.controller.ts (public endpoint)
@Get('pages/:slug')
@UseGuards(ApiKeyGuard)  // Extracts clientId from API key
publicPage(
  @CurrentUser() user: { clientId: string },
  @Param('slug') slug: string
) {
  // Returns page for THAT CLIENT with THAT SLUG
  // prevents page slug collisions between clients
  return this.pagesService.findBySlug(user.clientId, slug);
}
```

### Server-Driven UI Resolution

When a page is requested:

1. **Fetch page document** → Returns page with blocks
2. **For each ArchiveBlock**:
   - Fetch entries from specified schema
   - Apply the client's layout for that schema
   - Replace block data with rendered entries
3. **For each FieldBlock**:
   - Data is pre-resolved on the server
   - References are populated from database
4. **Return fully structured page** → Client renders with BlockRenderer

---

## Mobile Implementation

### Routes

#### **List Schema Entries** → `GET /[slug]`
- Displays paginated list of entries from a schema
- Each entry is a card with title, subtitle, date
- Tapping an entry navigates to detail view

```tsx
// mobile/src/app/[slug].tsx
- Loads entries for schema (e.g., "blog-posts")
- Shows title (resolved from first string field)
- Shows subtitle (resolved from first additional string)
- Supports pagination ("Load more")
```

#### **Single Entry Detail** → `GET /[slug]/[id]`
- Displays full entry with all blocks
- Blocks are rendered using `<BlockRenderer />`
- ArchiveBlocks show inline collections

```tsx
// mobile/src/app/[slug]/[id].tsx
- Fetches PublicEntryResponse (entry + blocks)
- ScrollView with BlockRenderer for each block
- ArchiveBlocks automatically render related entries
```

#### **Custom Page** → `GET /pages/[slug]`
- Fetches a ClientPage by slug
- Blocks are already fully resolved server-side
- Rendered with `<BlockRenderer />`

```tsx
// mobile/src/app/pages/[slug].tsx
- Fetches ClientPage by slug
- Displays blocks in ScrollView
- Used for custom pages like "About", "Contact", etc.
```

### BlockRenderer Component

Located at `mobile/components/BlockRenderer.tsx`, renders:
- **FieldBlock**: Displays formatted field data (text, image, etc.)
- **HeadingBlock**: Renders native `<Text>` heading
- **TextBlock**: Renders static text block
- **ArchiveBlock**: Fetches and displays inline entry list

---

## Page Rendering Pipeline

### Complete Request-to-Display Flow

#### 1. Mobile App Requests Page
```typescript
// mobile/src/app/pages/[slug].tsx
const [page, setPage] = useState<ClientPage | null>(null);

useEffect(() => {
  getPage(slug)  // Calls: GET /public/pages/:slug
    .then(setPage)
    .catch(err => setError(err.message));
}, [slug]);
```

#### 2. API Request with Authentication
```typescript
// Request
GET /public/pages/about
Headers: {
  'X-API-Key': 'sk_xxxxxxxx'
}

// ApiKeyGuard middleware extracts:
// - clientId (from client document)
// - homePageId (for isHome flag)
// - apiKeyAllowedSchemas (for schema access control)
// - clientLayouts (map of schema slug → LayoutBlock[])
```

#### 3. Server Resolves Page

**PagesService.findBySlug(clientId, slug)**:
```typescript
// Scoped query — prevents slug collisions between clients
const page = await this.model.findOne({
  clientId,        // ← client isolation
  slug,
  status: 'published'  // ← only published pages
}).exec();

// Returns: ClientPageDocument with blocks
{
  _id: "page123",
  clientId: "client456",
  title: "About Us",
  slug: "about-us",
  status: "published",
  blocks: [
    { type: 'heading', text: 'Our Mission' },
    { type: 'text', content: 'Founded in...' },
    { type: 'archive', schemaSlug: 'team-member', limit: 10 }
  ]
}
```

#### 4. Server Resolves Archive Blocks (Depth Guard)

For each `ArchiveBlock` in the page:

```typescript
// pages.service.resolveBlocksWithDepthGuard(page.blocks, depth = 0)

if (page.blocks.some(b => b.type === 'archive')) {
  // Fetch entries for the schema
  const entries = await this.contentService.findBySchema(
    schemaSlug: 'team-member',
    limit: 10
  );
  
  // Apply client's layout for team-member schema
  const layout = clientLayouts.get('team-member') ?? [];
  
  // Resolve each entry's blocks using the layout
  const resolvedItems = entries.map(entry => 
    resolveBlocksWithDepthGuard(
      layoutBlocksToBlocks(entry.data, layout),
      depth + 1  // ← increment depth
    )
  );
  
  // If depth > MAX_ARCHIVE_DEPTH (2), return items unresolved
  // Prevents infinite recursion on nested archives
}
```

#### 5. Server Injects `isHome` Flag

```typescript
// In public.controller.ts
const page = await this.pagesService.findBySlug(req.clientId, slug);

return {
  ...page.toObject(),
  isHome: req.homePageId ? String(page._id) === req.homePageId : false
  //      ↑ injected server-side based on Client.homePage
};
```

#### 6. API Response to Mobile

```json
{
  "_id": "page123",
  "clientId": "client456",
  "title": "About Us",
  "slug": "about-us",
  "status": "published",
  "isHome": false,
  "blocks": [
    {
      "type": "heading",
      "text": "Our Mission",
      "level": 1
    },
    {
      "type": "text",
      "content": "Founded in 2020..."
    },
    {
      "type": "archive",
      "schemaSlug": "team-member",
      "title": "Our Team",
      "limit": 10,
      "items": [
        {
          "_id": "member1",
          "blocks": [
            {
              "type": "field",
              "fieldName": "name",
              "label": "Name",
              "fieldType": "text",
              "value": "Alice Chen",
              "visible": true,
              "order": 0
            },
            {
              "type": "field",
              "fieldName": "photo",
              "label": "Photo",
              "fieldType": "media",
              "value": { "url": "...", "mimeType": "image/jpeg" },
              "visible": true,
              "order": 1
            }
          ]
        },
        // ... 9 more team members
      ]
    }
  ]
}
```

#### 7. Mobile Renders Blocks

```typescript
// mobile/src/app/pages/[slug].tsx
<ScrollView contentContainerStyle={s.container}>
  {page.blocks.map((block, i) => (
    <BlockRenderer key={i} block={block} />
  ))}
</ScrollView>

// BlockRenderer.tsx — switch by block.type
function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    
    case 'heading':
      return (
        <Text style={[s.heading, block.level === 1 && s.h1]}>
          {(block as HeadingBlock).text}
        </Text>
      );

    case 'text':
      return (
        <Text style={s.text}>
          {(block as TextBlock).content}
        </Text>
      );

    case 'field':
      const field = block as FieldBlock;
      return <FieldRenderer block={field} />;

    case 'archive':
      const archive = block as ArchiveBlock;
      return (
        <View style={s.archiveBlock}>
          {archive.title && <Text style={s.archiveTitle}>{archive.title}</Text>}
          {archive.items?.map((item, i) => (
            <View key={i} style={s.archiveItem}>
              {item.blocks.map((b, j) => (
                <BlockRenderer key={j} block={b} />
              ))}
            </View>
          ))}
        </View>
      );

    default:
      const _exhaustive: never = block;
      throw new Error(`Unhandled block type: ${_exhaustive}`);
  }
}
```

#### 8. Render Individual Field Blocks

```typescript
// FieldRenderer.tsx
function FieldRenderer({ block }: { block: FieldBlock }) {
  const { fieldType, value, label } = block;

  if (fieldType === 'text') {
    return <Text style={s.text}>{String(value)}</Text>;
  }

  if (fieldType === 'media') {
    const media = value as MediaEntry;
    return <Image source={{ uri: media.url }} style={s.image} />;
  }

  if (fieldType === 'reference') {
    const ref = value as ContentEntry;
    return (
      <TouchableOpacity onPress={() => navigateToEntry(ref)}>
        <Text style={s.link}>{getEntryTitle(ref)}</Text>
      </TouchableOpacity>
    );
  }

  if (fieldType === 'references') {
    const refs = value as ContentEntry[];
    return (
      <View>
        {refs.map(ref => (
          <TouchableOpacity key={ref._id}>
            <Text style={s.link}>{getEntryTitle(ref)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return <Text style={s.text}>— (no renderer for {fieldType})</Text>;
}
```

### Type Safety & Exhaustiveness

The block rendering uses TypeScript discriminated unions for exhaustiveness checking:

```typescript
// ✅ Good — compiler catches missing cases
switch (block.type) {
  case 'heading':
  case 'text':
  case 'field':
  case 'archive':
    // handle all cases
  default:
    const _exhaustive: never = block; // ← error if case missing
}

// ❌ Bad — missing case won't error
switch (block.type) {
  case 'heading':
  case 'text':
  // forgot 'field' — no compile error
}
```

### Depth Guard Prevents Recursion

For nested archives, the depth counter prevents infinite loops:

```
Archive at depth 0 (page level)
  └─ Archive at depth 1 (inside resolved entry)
      └─ Archive at depth 2 (inside nested entry)
          └─ Archive BLOCKED (depth > MAX_ARCHIVE_DEPTH)
             Returns { items: [] } instead of resolving
```

Example malformed schema that would cause recursion:
```
Blog Post schema has reference to Blog Post
→ Entry A references Entry B
→ Entry B references Entry A (cycle)
→ Archive would recurse infinitely without depth guard
```

With depth guard: Returns empty items at depth 3, preventing stack overflow.

### Error Handling

If page fetch fails or blocks can't be resolved:

```typescript
// mobile/src/app/pages/[slug].tsx
if (loading) return <ActivityIndicator />;
if (error || !page) return (
  <Text style={s.errorText}>
    {error || 'Page not found'}
  </Text>
);

// Should never happen if server resolves correctly
// But graceful fallback for malformed blocks
```

---

## Data Flow (Complete Example)

### Scenario: "Blog Post" Schema with Custom Home Page

#### Setup Phase (Admin)

1. **Create Client "iOS App"**
   ```json
   {
     "name": "iOS App",
     "allowedSchemas": ["blog-post", "author"],
     "layouts": [
       {
         "schemaSlug": "blog-post",
         "blocks": [
           { "type": "field", "fieldName": "title" },
           { "type": "field", "fieldName": "featured_image" },
           { "type": "field", "fieldName": "content" }
         ]
       }
     ]
   }
   ```

2. **Create Page "Home"**
   ```json
   {
     "title": "Home",
     "slug": "home",
     "status": "published",
     "blocks": [
       { "type": "heading", "text": "Welcome", "level": 1 },
       { "type": "archive", "schemaSlug": "blog-post", "limit": 3 }
     ]
   }
   ```

3. **Set as home page**
   ```
   Client.homePage = "home" (store page slug)
   ```

#### Client Usage (Mobile App)

1. **App Loads**
   - Authenticate with API key
   - Fetch `/public/pages/home`

2. **Server Returns**
   ```json
   {
     "_id": "abc123",
     "clientId": "ios-app",
     "title": "Home",
     "slug": "home",
     "status": "published",
     "blocks": [
       { "type": "heading", "text": "Welcome" },
       {
         "type": "archive",
         "schemaSlug": "blog-post",
         "items": [
           {
             "_id": "post1",
             "blocks": [
               { "type": "field", "fieldName": "title", "value": "My First Post" },
               { "type": "field", "fieldName": "featured_image", "value": {...image} },
               { "type": "field", "fieldName": "content", "value": "..." }
             ]
           },
           // 2 more items
         ]
       }
     ]
   }
   ```

3. **Mobile Renders**
   - BlockRenderer processes each block
   - ArchiveBlock items render with client's schema layout
   - User sees: heading "Welcome" + 3 blog posts

#### Single Post Then Navigating to Detail

1. **User taps a post in the archive** → Navigate to `/[slug]/[id]`
   - Fetch `/public/entries/blog-post/post1`

2. **Server Returns Full Entry**
   ```json
   {
     "_id": "post1",
     "schemaSlug": "blog-post",
     "blocks": [
       { "type": "field", "fieldName": "title", "value": "My First Post" },
       { "type": "field", "fieldName": "featured_image", "value": {...image} },
       { "type": "field", "fieldName": "content", "value": "Full article content..." },
       { "type": "archive", "schemaSlug": "author", "items": [...] }
     ]
   }
   ```

3. **Mobile Renders Detail Screen**
   - ScrollView with all blocks
   - Any ArchiveBlocks show related entries

---

## How Single Posts Connect to Archives

### Key Pattern

**Archives don't duplicate data** — they embed references:

```typescript
// In ArchiveBlock
{
  type: "archive",
  schemaSlug: "blog-post",
  limit: 5
}

// Server fetches:
//   1. Get 5 entries from blog-post schema
//   2. Apply client's ClientLayout for blog-post
//   3. Resolve each entry's blocks
//   4. Return { items: [resolved_entry1, resolved_entry2, ...] }
```

### Benefits

1. **Reusable Layouts**: Define once in `Client.layouts`, use everywhere
2. **Consistent Rendering**: Archive items look identical to detail pages
3. **Server-Driven UI**: All resolution happens server-side
4. **Flexible**: Can override entire layout per-client

---

## Hierarchy & Nesting

### Page Hierarchy
- Pages can have `parentId` pointing to another page
- Mobile can build breadcrumb navigation
- Deleting a parent unparsents children (promotes to top-level)

Example hierarchy:
```
About (top-level, parentId: null)
  └ Team (parentId: "about")
  └ History (parentId: "about")
Contact (top-level)
```

### Archive Nesting
- ArchiveBlocks can appear on pages or inside other entries' ArchiveBlocks
- Can nest up to 5+ levels deep (no hard limit)
- Depth limited by mobile rendering performance, not schema

---

## Admin Routes Summary

| Route | Purpose |
|-------|---------|
| `/clients` | List all clients, create new |
| `/clients/[id]` | Client details, API key, metrics |
| `/clients/[id]/pages` | List pages for this client |
| `POST /clients/:id/pages` | Create page |
| `PUT /clients/:id/pages/:pageId` | Update page (change blocks, status, etc.) |
| `DELETE /clients/:id/pages/:pageId` | Delete page |

---

## Critical Issues to Fix Before Production

### 1. ⚠️ Infinite Recursion on Nested Archives (HIGH PRIORITY)

**Problem**: `ArchiveBlock` can contain entries with `ArchiveBlock`s recursively, with no depth guard.

**Fix**: Add depth limit in `resolveBlocks()`:
```typescript
// pages.service.ts
private async resolveBlocks(
  schemaSlug: string,
  data: Record<string, unknown>,
  depth = 0,
  maxDepth = 2
): Promise<Block[]> {
  if (depth > maxDepth) {
    // Return ArchiveBlocks unresolved to prevent recursion
    return blocks.map(b => 
      b.type === 'archive' ? { ...b, items: [] } : b
    );
  }
  // Resolve normally, increment depth for recursive calls
}
```

### 2. ⚠️ Public Pages Endpoint — No Client Isolation (SECURITY)

**Problem**: `GET /public/pages/:slug` doesn't scope to the requesting client's key.

**Status**: ✅ **Fixed in API section above** — Uses `ApiKeyGuard` to derive `clientId` and fetch page for that client only.

### 3. ⚠️ LayoutBlock vs Block Type Distinction (TYPE SAFETY)

**Problem**: `ClientLayout.blocks` uses `Block[]` which includes `value: ResolvedFieldValue`. But layouts are templates without values.

**Status**: ✅ **Fixed in model above** — Use `LayoutBlock[]` for templates (no `value`), `Block[]` for resolved responses.

---

## Important But Non-Blocking Improvements

### 4. ClientLayout Stored Separately (SCALABILITY)

**Current**: Embedded `layouts: ClientLayout[]` in `Client` document

**Issue**: Document grows unbounded; updating one layout requires fetch-modify-write of entire client (race condition risk)

**Consider**: Separate `ClientLayout` collection with index on `(clientId, schemaSlug)`:
```typescript
interface ClientLayout {
  _id?: string;
  clientId: string;
  schemaSlug: string;
  blocks: LayoutBlock[];
  createdAt?: string;
  updatedAt?: string;
}

// Compound unique index
db.clientlayouts.createIndex({ clientId: 1, schemaSlug: 1 }, { unique: true })
```

### 5. ArchiveBlock Ordering/Filtering (FUNCTIONALITY)

**Missing**: How are archive items ordered? Configurable sort?

**Enhance**:
```typescript
interface ArchiveBlock {
  type: 'archive';
  schemaSlug: string;
  title?: string;
  limit?: number;
  orderBy?: string;           // field name to sort by (default: createdAt)
  orderDir?: 'asc' | 'desc';  // sort direction (default: desc)
  filter?: Record<string, unknown>; // basic field filters (optional)
}
```

### 6. Page Versioning (GOOD-TO-HAVE)

**Current**: Pages don't support versioning (entries do via `ContentVersionModel`)

**Apply same pattern**:
```typescript
interface PageVersion {
  _id?: string;
  pageId: string;              // Reference to published page
  clientId: string;
  versionNumber: number;
  title: string;
  blocks: Block[];
  status: 'draft' | 'published';
  createdBy: string;           // User ID
  createdAt?: string;
}
```

Scheduled publishing would store versions with `publishAt` timestamp.

### 7. `homePage` Should Store ID, Not Slug (DATA INTEGRITY)

**Current**:
```typescript
homePage?: string | null;  // described as "slug"
```

**Fix**:
```typescript
homePage?: string | null;  // MongoDB _id of home page, not slug
```

Reason: Slugs can change; IDs are immutable. Use ID for resolution, slug for display.

### 8. Block Exhaustiveness Check (TYPE SAFETY)

**Issue**: `BlockRenderer` switch on `block.type` may miss new block types

**Add exhaustiveness check**:
```typescript
function renderBlock(block: Block) {
  switch (block.type) {
    case 'field': return <FieldRenderer block={block} />;
    case 'heading': return <HeadingRenderer block={block} />;
    case 'text': return <TextRenderer block={block} />;
    case 'archive': return <ArchiveRenderer block={block} />;
    default:
      const _exhaustive: never = block;
      throw new Error(`Unhandled block type: ${_exhaustive}`);
  }
}
```

---

## Current Limitations / TODOs

1. **No page builder UI yet** — Pages created only via API or future form
2. **No drag-drop block builder** — Must submit JSON directly
3. **Block preview** — No live preview in admin
4. **Page status enforcement** — Public API only returns `published` pages ✅ (see `findBySlug`)
5. **SEO** — No meta tags, sitemap for pages

---

## Example API Integration (Admin)

```typescript
// lib/utils.ts - Get all pages for a client
export async function getPages(clientId: string) {
  return apiRequest(`/clients/${clientId}/pages`);
}

// Create page with blocks
export async function createPage(clientId: string, data: PageData) {
  return apiRequest(`/clients/${clientId}/pages`, {
    method: 'POST',
    body: data
  });
}

// Update page blocks
export async function updatePage(clientId: string, pageId: string, data: Partial<PageData>) {
  return apiRequest(`/clients/${clientId}/pages/${pageId}`, {
    method: 'PUT',
    body: data
  });
}

// Delete page
export async function deletePage(clientId: string, pageId: string) {
  return apiRequest(`/clients/${clientId}/pages/${pageId}`, {
    method: 'DELETE'
  });
}
```

---

## Example Mobile Integration

```typescript
// lib/api.ts - Fetch page by slug
export async function getPage(slug: string): Promise<ClientPage> {
  const apiKey = await getApiKey(); // from secure storage
  const res = await fetch(`${API_URL}/public/pages/${slug}`, {
    headers: { 'X-API-Key': apiKey }
  });
  if (!res.ok) throw new Error('Page not found');
  return res.json();
}

// Usage in mobile/src/app/pages/[slug].tsx
const [page, setPage] = useState<ClientPage | null>(null);
useEffect(() => {
  getPage(slug).then(setPage).catch(err => setError(err.message));
}, [slug]);
```

---

## MVP Block Types for Conference Demo

Given time constraints, prioritize these blocks in this order:

### Phase 1: Core Rendering (Essential)
**Priority 1: Static blocks — foundation for layout**
- ✅ **HeadingBlock** — page titles, section headers
- ✅ **TextBlock** — body copy
- ✅ **SpacerBlock** — breathing room between sections
- ✅ **DividerBlock** — visual separation

Impact: Renders any text-based page (About Us, Contact, Terms, etc.)

### Phase 2: Interactive Content (High Value)
**Priority 2: Content + layout blocks — what makes it a CMS**
- ✅ **ArchiveBlock** (list layout only) — featured posts list
- ✅ **ButtonBlock** — navigation, CTAs
- ✅ **RowBlock + ColumnBlock** — two-column layouts
- ✅ **CardBlock** — card wrapper for touch actions

Impact: Demo a two-column homepage with featured posts in cards, CTA button

### Phase 3: Polish (Nice-to-Have for Demo)
**Priority 3: Enhanced features**
- ⏳ **ImageBlock** — hero images, static graphics
- ⏳ **ArchiveBlock** (grid layout) — product grid, screenshot gallery
- ⏳ **EntryBlock** — showcase featured single entry

### Future (After Conference)
- Carousel layout for ArchiveBlock
- Button styling variants
- Animation entrance effects
- Responsive breakpoints (hideOn)

---

## Demo Scenario Recommendation

**Homepage Layout** (implementable with Phase 1 + Phase 2):

```
HeadingBlock("Welcome to CMS")
  ↓
TextBlock("Build beautiful pages in minutes")
  ↓
SpacerBlock(32px)
  ↓
RowBlock [ 2 columns ]
  ├─ Column 1: TextBlock("What we do")
  └─ Column 2: TextBlock("Why choose us")
  ↓
DividerBlock
  ↓
HeadingBlock("Latest from blog")
  ↓
ArchiveBlock(schemaSlug: "blog-post", layout: "list", limit: 3)
  [Each item is a CardBlock with pressAction navigating to post]
  ↓
SpacerBlock(24px)
  ↓
ButtonBlock(label: "View more", action: { type: 'schema', schemaSlug: 'blog-post' })
```

**Effort estimate**:
- Shared types update: 1 hour
- Server resolver: 2 hours  
- Mobile BlockRenderer: 3 hours
- Total: ~6 hours to a working demo

**What the attendee sees**:
1. Admin creates page with blocks (via API or future form)
2. Mobile fetches page → sees fully rendered layout
3. Taps card → navigates to blog post detail
4. Taps "View more" → sees archive list
5. Architecture is extensible — adding new block types only requires updates to types + renderer

---

## Server Block Resolution

The resolver handles each block type differently based on data fetching requirements:

```typescript
private async resolveBlock(
  block: Block,
  clientLayouts: Map<string, LayoutBlock[]>,
  depth: number = 0
): Promise<Block> {
  const MAX_ARCHIVE_DEPTH = 2;

  switch (block.type) {
    
    case 'archive':
      // Depth guard prevents infinite recursion on cyclic entry references
      if (depth > MAX_ARCHIVE_DEPTH) {
        return { ...block, items: [] };
      }
      
      // Fetch entries from schema
      const entries = await this.contentService.find(block.schemaSlug, {
        limit: block.limit ?? 10,
        sort: { [block.orderBy ?? 'createdAt']: block.orderDir === 'asc' ? 1 : -1 },
        filter: block.filter ? this.buildMongoFilter(block.filter) : {}
      });
      
      // Get client's layout for this schema
      const archiveLayout = clientLayouts.get(block.schemaSlug) ?? [];
      
      // Resolve each entry's blocks with depth tracking
      const items = await Promise.all(
        entries.map(e => this.resolveEntry(e, archiveLayout, clientLayouts, depth + 1))
      );
      
      return { ...block, items };

    case 'entry':
      // Fetch specific entry by ID
      const entry = await this.contentService.findById(block.entryId);
      if (!entry) return { ...block, entry: undefined };
      
      const entryLayout = clientLayouts.get(block.schemaSlug) ?? [];
      return { 
        ...block, 
        entry: await this.resolveEntry(entry, entryLayout, clientLayouts, depth + 1) 
      };

    case 'row':
      // Recursively resolve nested column blocks
      const resolvedColumns = await Promise.all(
        block.columns.map(async (col) => ({
          ...col,
          blocks: await Promise.all(
            col.blocks.map(b => this.resolveBlock(b, clientLayouts, depth))
          )
        }))
      );
      return { ...block, columns: resolvedColumns };

    case 'card':
      // Resolve nested blocks inside card
      return {
        ...block,
        blocks: await Promise.all(
          block.blocks.map(b => this.resolveBlock(b, clientLayouts, depth))
        )
      };

    // Static blocks — no database queries needed
    case 'heading':
    case 'text':
    case 'divider':
    case 'spacer':
    case 'image':
    case 'button':
    case 'field':
      return block;

    default:
      const _exhaustive: never = block;
      throw new Error(`Unhandled block type: ${_exhaustive}`);
  }
}

private async resolveEntry(
  entry: ContentEntry,
  layout: LayoutBlock[],
  clientLayouts: Map<string, LayoutBlock[]>,
  depth: number
): Promise<ResolvedEntry> {
  // Convert layout templates to resolved blocks
  const blocks = await Promise.all(
    layout.map(async (layoutBlock) => {
      if (layoutBlock.type === 'field') {
        const value = entry.data[layoutBlock.fieldName];
        return {
          ...layoutBlock,
          value: this.resolveFieldValue(value, layoutBlock.fieldType, clientLayouts)
        } as FieldBlock;
      }
      // Handle other layout block types as needed
      return layoutBlock as Block;
    })
  );

  // Resolve nested blocks (for ArchiveBlock, RowBlock, etc.)
  const resolvedBlocks = await Promise.all(
    blocks.map(b => this.resolveBlock(b, clientLayouts, depth))
  );

  return {
    id: entry._id,
    schemaSlug: entry.schemaSlug,
    data: entry.data,
    blocks: resolvedBlocks,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  };
}

private resolveFieldValue(
  value: unknown,
  fieldType: FieldType,
  clientLayouts: Map<string, LayoutBlock[]>
): ResolvedFieldValue {
  if (fieldType === 'reference') {
    const ref = value as ContentEntry;
    return ref ? { id: ref._id, title: getEntryTitle(ref) } : null;
  }
  
  if (fieldType === 'references') {
    const refs = value as ContentEntry[];
    return refs ? refs.map(ref => ({ id: ref._id, title: getEntryTitle(ref) })) : [];
  }

  // For other field types, return value as-is (already JSON-safe)
  return value;
}
```

---

## Mobile BlockRenderer Implementation

The Expo `BlockRenderer` component exhaustively switches on block type:

```typescript
function BlockRenderer({ block, depth = 0 }: { block: Block; depth?: number }) {
  switch (block.type) {
    
    case 'heading':
      return (
        <Text style={[
          s.heading,
          block.level === 1 && s.h1,
          block.level === 2 && s.h2,
          block.level === 3 && s.h3,
          block.level === 4 && s.h4,
          block.align === 'center' && s.center,
          block.align === 'right' && s.right,
          { color: block.color ?? '#000', fontWeight: block.fontWeight ?? 'bold' }
        ]}>
          {block.text}
        </Text>
      );

    case 'text':
      return (
        <Text style={[
          s.text,
          block.align === 'center' && s.center,
          block.align === 'right' && s.right,
          block.align === 'justify' && s.justify,
          { 
            color: block.color ?? '#333', 
            fontSize: getFontSize(block.fontSize ?? 'base')
          }
        ]}>
          {block.content}
        </Text>
      );

    case 'divider':
      return (
        <View style={[
          s.divider,
          { 
            borderColor: block.color ?? '#e5e7eb',
            borderWidth: block.thickness ?? 1,
            borderStyle: block.style ?? 'solid'
          }
        ]} />
      );

    case 'spacer':
      return <View style={{ height: block.height }} />;

    case 'image':
      const imageContent = (
        <Image 
          source={{ uri: block.url }} 
          style={[
            s.image,
            block.width === 'full' && s.fullWidth,
            block.height && { height: block.height }
          ]}
          resizeMode={block.fit ?? 'cover'}
          accessibilityLabel={block.alt}
        />
      );
      return block.linkUrl ? (
        <TouchableOpacity onPress={() => Linking.openURL(block.linkUrl)}>
          {imageContent}
        </TouchableOpacity>
      ) : imageContent;

    case 'button':
      return (
        <TouchableOpacity 
          style={[s.button, getButtonVariantStyle(block.variant)]}
          onPress={() => handleButtonAction(block.action)}
        >
          <Text style={s.buttonText}>{block.label}</Text>
        </TouchableOpacity>
      );

    case 'archive':
      if (!block.items || block.items.length === 0) {
        return <Text style={s.empty}>{block.emptyMessage ?? 'No items'}</Text>;
      }
      
      return (
        <View style={[s.archive, block.padding && { padding: block.padding }]}>
          {block.title && <Text style={s.archiveTitle}>{block.title}</Text>}
          
          {block.layout === 'grid' ? (
            <FlatList
              scrollEnabled={false}
              data={block.items}
              numColumns={block.columns ?? 1}
              renderItem={({ item }) => (
                <View style={s.gridItem}>
                  {item.blocks.map((b, i) => (
                    <BlockRenderer key={i} block={b} depth={depth + 1} />
                  ))}
                </View>
              )}
              keyExtractor={(_, i) => String(i)}
            />
          ) : (
            block.items.map((item, i) => (
              <View key={i} style={s.listItem}>
                {item.blocks.map((b, j) => (
                  <BlockRenderer key={j} block={b} depth={depth + 1} />
                ))}
              </View>
            ))
          )}
        </View>
      );

    case 'entry':
      if (!block.entry) return <Text style={s.empty}>— Entry not found</Text>;
      return (
        <View>
          {block.entry.blocks.map((b, i) => (
            <BlockRenderer key={i} block={b} depth={depth + 1} />
          ))}
        </View>
      );

    case 'row':
      return (
        <View style={[
          s.row,
          {
            gap: block.gap ?? 8,
            flexDirection: 'row',
            justifyContent: block.align ?? 'flex-start'
          }
        ]}>
          {block.columns.map((col, i) => (
            <View 
              key={i} 
              style={[
                { flex: col.width === 'auto' ? 1 : undefined, width: col.width }
              ]}
            >
              {col.blocks.map((b, j) => (
                <BlockRenderer key={j} block={b} depth={depth} />
              ))}
            </View>
          ))}
        </View>
      );

    case 'card':
      const cardContent = (
        <View style={[
          s.card,
          {
            elevation: block.elevation ?? 2,
            backgroundColor: block.backgroundColor ?? '#fff'
          }
        ]}>
          {block.blocks.map((b, i) => (
            <BlockRenderer key={i} block={b} depth={depth} />
          ))}
        </View>
      );
      return block.pressAction ? (
        <TouchableOpacity onPress={() => handleBlockAction(block.pressAction)}>
          {cardContent}
        </TouchableOpacity>
      ) : cardContent;

    case 'field':
      const field = block as FieldBlock;
      return (
        <View>
          {field.showLabel && field.labelPosition !== 'hidden' && (
            <Text style={s.fieldLabel}>{field.label}</Text>
          )}
          <FieldValueRenderer field={field} />
        </View>
      );

    default:
      const _exhaustive: never = block;
      throw new Error(`Unhandled block type: ${_exhaustive}`);
  }
}

function FieldValueRenderer({ field }: { field: FieldBlock }) {
  const { fieldType, value } = field;

  if (!value) return <Text style={s.textMuted}>—</Text>;

  if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'email') {
    return <Text style={s.fieldValue}>{String(value)}</Text>;
  }

  if (fieldType === 'media') {
    const media = value as MediaEntry;
    return <Image source={{ uri: media.url }} style={s.fieldMedia} />;
  }

  if (fieldType === 'reference') {
    const ref = value as { id: string; title: string };
    return (
      <TouchableOpacity onPress={() => navigateToEntry(ref.id)}>
        <Text style={s.link}>{ref.title}</Text>
      </TouchableOpacity>
    );
  }

  if (fieldType === 'references') {
    const refs = value as { id: string; title: string }[];
    return (
      <View>
        {refs.map((ref, i) => (
          <TouchableOpacity 
            key={i} 
            onPress={() => navigateToEntry(ref.id)}
            style={i > 0 && { marginTop: 4 }}
          >
            <Text style={s.link}>{ref.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return <Text style={s.textMuted}>— (unsupported: {fieldType})</Text>;
}

function handleBlockAction(action: ButtonAction) {
  switch (action.type) {
    case 'navigate':
      navigation.navigate('Page', { slug: action.pageSlug });
      break;
    case 'url':
      Linking.openURL(action.url);
      break;
    case 'schema':
      navigation.navigate('Schema', { slug: action.schemaSlug });
      break;
    case 'entry':
      navigation.navigate('Entry', { 
        schemaSlug: action.schemaSlug, 
        entryId: action.entryId 
      });
      break;
  }
}

function getFontSize(size: 'sm' | 'base' | 'lg' | 'xl'): number {
  const sizes = { sm: 12, base: 14, lg: 16, xl: 20 };
  return sizes[size];
}

function getButtonVariantStyle(variant?: string) {
  const styles: Record<string, object> = {
    primary: s.buttonPrimary,
    secondary: s.buttonSecondary,
    outline: s.buttonOutline,
    ghost: s.buttonGhost
  };
  return styles[variant ?? 'primary'];
}
```

---

## Key Implementation Priority

**Before Conference**:
1. ✅ Implement depth guard on archive resolution (prevent recursion)
2. ✅ Ensure public pages endpoint uses `ApiKeyGuard` for client isolation
3. ✅ Update `ClientLayout` type to use `LayoutBlock[]` without values
4. ⏭️ Consider moving `ClientLayout` to separate collection (scalability)
5. ⏭️ Add configurable ordering to `ArchiveBlock`
6. ⏭️ Add page versioning (follow content versioning pattern)

---

## Key Files

### Backend (NestJS)
- `api/src/app/pages/pages.service.ts` — Business logic
  - **TODO**: Add `depth` parameter to `resolveBlocks()` for recursion guard (Issue #1)
  - **TODO**: Add `maxDepth = 2` constant and check
- `api/src/app/pages/pages.controller.ts` — Routes
  - **TODO**: Verify public endpoint uses `ApiKeyGuard` (Issue #2)
  - Public endpoint should call `findBySlug(clientId, slug)` where `clientId` comes from guard
- `api/src/app/pages/schemas/client-page.schema.ts` — Mongoose model
  - **TODO**: Add migration: `homePage` should store page._id, not slug
- `api/src/app/api-keys/*` — Client (API Key) management
  - Note: Consider renaming `api-keys` to `clients` for consistency

### Frontend (Admin)
- `admin/src/app/clients/` — Client listing
- `admin/src/app/clients/[id]/` — Client detail (FIX: pages UI needs building)
- **TODO**: Page builder form component (currently missing)

### Mobile (Expo)
- `mobile/src/app/[slug].tsx` — Archive (schema entries list)
- `mobile/src/app/[slug]/[id].tsx` — Entry detail
- `mobile/src/app/pages/[slug].tsx` — Custom pages
- `mobile/components/BlockRenderer.tsx` — Renders blocks
  - **TODO**: Add exhaustiveness check for block types (Issue #8)
