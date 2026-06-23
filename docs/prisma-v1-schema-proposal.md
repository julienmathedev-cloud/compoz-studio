# Prisma V1 Schema Proposal

This document proposes a V1 Prisma/PostgreSQL schema for Compoz based on the
current KV model, tenant/domain resolution analysis, domain entities, and
repository ports.

Scope constraints:

- Do not create tables for blocks, rows, columns, or cells.
- Keep `Page.blocks` as JSON.
- Keep site settings as section-based JSON.
- `Tenant` and `TenantDomain` are required for V1.
- Keep user RBAC as JSON for V1.
- Do not create `MediaUsage` yet.
- Do not introduce billing, plans, subscriptions, or other product features not
  present in the current codebase.

This is a human-review proposal, not a `schema.prisma` implementation.

## Proposed Enums

```prisma
enum ContentState {
  draft
  published
}

enum TenantKind {
  standard
  demo_seed
  demo_sandbox
}

enum UserStatus {
  active
  disabled
}

enum UserRole {
  admin
  editor
}

enum MediaAssetKind {
  content
  og
  logo
  favicon
}

enum MediaStorageProvider {
  vercel_blob
  local
}
```

### Enum Notes

`ContentState` maps directly to `packages/core/src/constants/common/content-state.ts`
and current KV states `draft` and `published`.

`TenantKind` is proposed because current code distinguishes normal tenants,
the demo seed tenant (`demo`), and generated demo sandbox tenants (`demo-*`).
The current runtime mostly derives this from tenant ids; V1 can store it
explicitly to make cleanup and safety checks less string-prefix dependent.

`UserStatus` and `UserRole` mirror `packages/core/src/domain/users/entities/user.ts`.
Even though RBAC is kept as JSON for V1, storing `role` as a scalar can preserve
current list/filter ergonomics without normalizing tenant memberships.

`MediaAssetKind` mirrors `UploadImageKind` in
`packages/infra/src/http/studio/media.types.ts`.

## Proposed Models

The following Prisma-like block is a compact sketch of the proposed model
surface. The detailed rationale for each model follows.

```prisma
model Tenant {
  id        String     @id
  kind      TenantKind @default(standard)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  domains      TenantDomain[]
  pages        Page[]
  siteIndexes  SiteIndex[]
  siteSettings SiteSettings[]
  mediaAssets  MediaAsset[]
  demoSandbox  DemoSandbox?

  @@index([kind])
}

model TenantDomain {
  id        String   @id @default(cuid())
  tenantId  String
  host      String
  rawHost   String?
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([host])
  @@index([tenantId])
  @@index([tenantId, isPrimary])
}

model Page {
  id                String       @default(cuid())
  tenantId          String
  state             ContentState
  pageId            String
  parentPageId      String?
  slug              String
  name              String
  seoTitle          String?
  seoDescription    String?
  blocks            Json
  sitemap           Json?
  paginationEnabled Boolean      @default(false)
  createdAt         DateTime
  updatedAt         DateTime

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, state, pageId])
  @@unique([tenantId, state, slug])
  @@index([tenantId, state])
  @@index([tenantId, state, parentPageId])
}

model SiteIndex {
  id        String       @id @default(cuid())
  tenantId  String
  state     ContentState
  pages     Json
  updatedAt DateTime

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, state])
}

model SiteSettings {
  id          String       @id @default(cuid())
  tenantId    String
  state       ContentState
  header      Json
  footer      Json
  primaryMenu Json
  legalMenu   Json
  social      Json
  identity    Json
  seo         Json
  theme       Json
  updatedAt   DateTime    @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, state])
}

model User {
  id           String     @id
  email        String
  name         String
  status       UserStatus
  role         UserRole
  rbac         Json
  passwordHash String?
  demo         Json?
  createdAt    DateTime
  updatedAt    DateTime
  lastLoginAt  DateTime?

  demoSandboxes DemoSandbox[]

  @@unique([email])
  @@index([status])
  @@index([role])
}

model DemoSandbox {
  demoInstanceId String   @id
  userId         String
  tenantId       String   @unique
  expiresAt      DateTime
  createdAt      DateTime

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
  @@index([userId])
}

model MediaAsset {
  id              String               @id @default(cuid())
  tenantId        String
  kind            MediaAssetKind
  provider        MediaStorageProvider
  key             String
  url             String
  filename        String
  contentType     String
  size            Int
  width           Int?
  height          Int?
  originalSize    Int?
  optimizedSize   Int?
  wasResized      Boolean?
  wasCompressed   Boolean?
  createdAt       DateTime             @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([provider, key])
  @@index([tenantId, createdAt])
  @@index([tenantId, kind])
}
```

## Model Details

### Tenant

**Purpose**

`Tenant` becomes the canonical tenant registry. Current tenant identity is
implicit in KV key prefixes, user RBAC arrays, host mapping env vars, demo
sandbox records, tenant-specific UI constants, and media paths. Prisma needs a
single tenant root to anchor domains, pages, settings, media metadata, and demo
sandboxes.

**Fields**

- `id`: stable lower-case tenant id used today in KV keys and routes.
- `kind`: `standard`, `demo_seed`, or `demo_sandbox`.
- `createdAt`, `updatedAt`: operational timestamps.

**Relations**

- Has many `TenantDomain`.
- Has many `Page`.
- Has many `SiteIndex`.
- Has many `SiteSettings`.
- Has many `MediaAsset`.
- Has optional `DemoSandbox` for generated demo tenants.

**Indexes**

- `@@index([kind])` supports demo cleanup and audits.

**Unique Constraints**

- Primary key on `id`.

**Why Needed**

Tenant is required for V1 because the current system has many tenant ids but no
single source of truth. Without this model, host resolution, access validation,
content ownership, and cleanup remain string-prefix conventions spread across
repositories and env vars.

**Replaces Current KV Keys or Code Paths**

- Does not directly replace one KV key.
- Centralizes tenant ids currently discovered from:
  - `compoz:<tenant>:...` KV prefixes.
  - `User.rbac.tenantIds`.
  - `COMPOZ_TENANT_BY_HOST_JSON`.
  - `compoz:studio:demo:sandbox:<demoInstanceId>` values.
  - `tenants/<tenantId>/...` object keys.

### TenantDomain

**Purpose**

`TenantDomain` stores production host-to-tenant resolution data currently held
in `COMPOZ_TENANT_BY_HOST_JSON`.

**Fields**

- `id`: generated row id.
- `tenantId`: owning tenant.
- `host`: normalized lookup host, lower-case, no port, no leading `www.`.
- `rawHost`: optional original/display host if the admin UI later needs it.
- `isPrimary`: optional V1 field for choosing the preferred tenant domain. This
  is not required by current runtime, so it needs human validation before schema
  creation.
- `createdAt`, `updatedAt`.

**Relations**

- Belongs to `Tenant`.

**Indexes**

- `@@index([tenantId])`.
- `@@index([tenantId, isPrimary])` only if `isPrimary` is accepted.

**Unique Constraints**

- `@@unique([host])`, because a host can resolve to only one tenant.

**Why Needed**

Tenant and `TenantDomain` are required for V1. The public site currently parses
host mapping from env on every host-based route, sitemap, and robots request.
Moving host mappings into Prisma makes domains operational data rather than
deployment config.

**Replaces Current KV Keys or Code Paths**

- Replaces `COMPOZ_TENANT_BY_HOST_JSON` as the production source of truth.
- Used by code paths currently calling `resolveTenantFromHost`:
  - `apps/site/src/lib/pages/published-page-loaders.ts`
  - `apps/site/src/app/sitemap.ts`
  - `apps/site/src/app/robots.ts`

Dev-only `{tenant}.lvh.me` behavior and final fallback
`COMPOZ_DEFAULT_TENANT_ID` can remain outside Prisma.

### Page

**Purpose**

`Page` stores one persisted page document for one tenant and one content state.
It preserves the current repository contract where draft and published pages are
separate persisted documents.

**Fields**

- `id`: Prisma row id.
- `tenantId`: owning tenant.
- `state`: `draft` or `published`.
- `pageId`: current domain `Page.id`, stable across draft/published copies.
- `parentPageId`: current domain `Page.parentId`.
- `slug`, `name`.
- `seoTitle`, `seoDescription`.
- `blocks`: JSON array of current `Block` payloads.
- `sitemap`: JSON representation of `PageSitemap`.
- `paginationEnabled`.
- `createdAt`, `updatedAt`: from `Page.meta`.

**Relations**

- Belongs to `Tenant`.

No self-relation is proposed for `parentPageId` in V1. The current domain treats
the parent as a page id string, and parent validity is enforced by use-cases and
site index behavior rather than database foreign keys.

**Indexes**

- `@@index([tenantId, state])` for listing/batch reads.
- `@@index([tenantId, state, parentPageId])` for parent/children operations if
  repository or use-case optimizations need it.

**Unique Constraints**

- `@@unique([tenantId, state, pageId])` replaces page document key uniqueness.
- `@@unique([tenantId, state, slug])` replaces slug index uniqueness.

**Why Needed**

The `PagesRepository` port requires reads by id, reads by slug, batch reads by
id, upsert, batch upsert, delete, and existence checks per content state. A
relational `Page` table directly supports that contract and replaces the KV page
document plus derived slug indexes.

**Replaces Current KV Keys or Code Paths**

- `compoz:<tenant>:<state>:pages:<pageId>`
- `compoz:<tenant>:<state>:pagesBySlug:<slug>`
- `compoz:<tenant>:<state>:pageSlugById:<pageId>`
- Repository implementation behind
  `packages/core/src/domain/pages/ports/pages-repository.ts`.

### SiteIndex

**Purpose**

`SiteIndex` stores the ordered page summary list for one tenant and content
state. It preserves the current aggregate instead of deriving every list from
the `Page` table.

**Fields**

- `id`: generated row id.
- `tenantId`.
- `state`.
- `pages`: JSON array of current `PageSummary` items.
- `updatedAt`: timestamp from current `SiteIndex.updatedAt`.

**Relations**

- Belongs to `Tenant`.

**Indexes**

- Unique lookup by tenant and state is sufficient for current repository reads.

**Unique Constraints**

- `@@unique([tenantId, state])`.

**Why Needed**

The current `SiteRepository` port has explicit `readIndex` and `putIndex`
methods. The Studio pages list and page ordering flows treat the index as the
source of truth for page order. Preserving it as JSON avoids changing page-list,
reorder, publish, and orphan-cleanup semantics during the first database
migration.

**Replaces Current KV Keys or Code Paths**

- `compoz:<tenant>:<state>:site:index`
- `SiteRepository.readIndex`
- `SiteRepository.putIndex`

### SiteSettings

**Purpose**

`SiteSettings` stores the site settings aggregate for one tenant and content
state, with each section stored as JSON.

**Fields**

- `id`: generated row id.
- `tenantId`.
- `state`.
- `header`, `footer`, `primaryMenu`, `legalMenu`, `social`, `identity`, `seo`,
  `theme`: section JSON.
- `updatedAt`: row update timestamp.

**Relations**

- Belongs to `Tenant`.

**Indexes**

- Unique lookup by tenant and state is sufficient for current repository reads.

**Unique Constraints**

- `@@unique([tenantId, state])`.

**Why Needed**

The current `SiteRepository` port has explicit `readSettings` and `putSettings`
methods. Studio routes edit settings section by section, but the repository
returns a complete `SiteSettings` aggregate and merges persisted values with
defaults. Section JSON fields preserve that boundary and keep Zod validation at
the existing DTO/domain layer.

**Replaces Current KV Keys or Code Paths**

- `compoz:<tenant>:<state>:site:settings`
- `SiteRepository.readSettings`
- `SiteRepository.putSettings`
- Studio settings route persistence behind:
  - `apps/studio/src/app/api/settings/header/route.ts`
  - `apps/studio/src/app/api/settings/footer/route.ts`
  - `apps/studio/src/app/api/settings/identity/route.ts`
  - `apps/studio/src/app/api/settings/primary-menu/route.ts`
  - `apps/studio/src/app/api/settings/legal-menu/route.ts`
  - `apps/studio/src/app/api/settings/social/route.ts`
  - `apps/studio/src/app/api/settings/seo/route.ts`
  - `apps/studio/src/app/api/settings/theme/route.ts`

### User

**Purpose**

`User` stores Studio users, credentials, status, and RBAC.

**Fields**

- `id`: current domain user id.
- `email`: lower-case canonical email.
- `name`.
- `status`: `active` or `disabled`.
- `role`: scalar mirror of `rbac.role`.
- `rbac`: JSON preserving current `UserRbac`, including `tenantIds`,
  `defaultTenantId`, and wildcard `"*"`.
- `passwordHash`: current infra-only password hash. Nullable only if a future
  auth adapter splits credentials into another table.
- `demo`: JSON preserving current optional `UserDemoMeta`.
- `createdAt`, `updatedAt`, `lastLoginAt`.

**Relations**

- Has many `DemoSandbox`.

No `UserTenant` membership table is proposed for V1 because the user explicitly
requested RBAC remain JSON and current code validates access from session RBAC.

**Indexes**

- `@@index([status])`.
- `@@index([role])`.

**Unique Constraints**

- Primary key on `id`.
- `@@unique([email])`, replacing the KV email index.

**Why Needed**

The `UsersRepository` port currently persists users globally in KV and supports
email lookup, list, create, update, password update, delete, and batch reads.
Moving users into Prisma keeps auth and admin users within the same migration
boundary while preserving the current JSON RBAC contract.

**Replaces Current KV Keys or Code Paths**

- `compoz:studio:users:user:<userId>`
- `compoz:studio:users:userByEmail:<emailLower>`
- `compoz:studio:users:pwd:<userId>`
- Repository implementation behind
  `packages/core/src/domain/users/ports/users-repository.ts`.
- Auth lookup in `apps/studio/src/auth/auth.ts`.

### DemoSandbox

**Purpose**

`DemoSandbox` stores temporary demo sandbox records keyed by
`demoInstanceId`. It links a demo user to a generated demo tenant and expiry.

**Fields**

- `demoInstanceId`: primary id from current demo cookie/session flow.
- `userId`: demo user.
- `tenantId`: generated sandbox tenant, currently `demo-<demoInstanceId>`.
- `expiresAt`.
- `createdAt`.

**Relations**

- Belongs to `User`.
- Belongs to `Tenant`.

**Indexes**

- `@@index([expiresAt])` for cleanup.
- `@@index([userId])`.

**Unique Constraints**

- Primary key on `demoInstanceId`.
- `tenantId` unique, because one sandbox record owns one generated tenant.

**Why Needed**

The demo sandbox repository is a current domain port. Cleanup and sandbox reuse
need efficient lookup by demo instance id and expiry. Storing this in Prisma
also gives cleanup a relational path to delete demo tenant content safely.

**Replaces Current KV Keys or Code Paths**

- `compoz:studio:demo:sandbox:<demoInstanceId>`
- Repository implementation behind
  `packages/core/src/domain/demo/ports/demo-sandbox-repository.ts`.
- Demo cleanup flow in `apps/studio/src/app/api/internal/demo/cleanup/route.ts`.

### MediaAsset

**Purpose**

`MediaAsset` is justified for V1 only as object storage metadata. It should not
be used as a media usage graph, and it should not move files out of Vercel Blob
or local object storage.

**Fields**

- `id`: generated metadata id.
- `tenantId`: owner tenant.
- `kind`: `content`, `og`, `logo`, or `favicon`.
- `provider`: `vercel_blob` or `local`.
- `key`: object storage key, such as `tenants/<tenantId>/<yyyy>/<mm>/<filename>`.
- `url`: public URL returned to the UI.
- `filename`, `contentType`, `size`.
- `width`, `height`.
- `originalSize`, `optimizedSize`, `wasResized`, `wasCompressed` where
  available from the image finalize response.
- `createdAt`.

**Relations**

- Belongs to `Tenant`.

**Indexes**

- `@@index([tenantId, createdAt])` for listing recent assets if needed.
- `@@index([tenantId, kind])` for operational filtering.

**Unique Constraints**

- `@@unique([provider, key])`, because object keys should be unique within a
  storage provider.

**Why Needed**

Current media uploads write files to object storage and return URLs, but there
is no canonical media registry. A `MediaAsset` table is justified if V1 needs
tenant-scoped asset listing, cleanup after tenant deletion, or auditability.
It is not required for public rendering because page/settings JSON already
contains the URLs used by the UI and site.

**Replaces Current KV Keys or Code Paths**

- Does not replace a KV key.
- Adds metadata around object paths created by:
  - `apps/studio/src/app/api/media/upload/image/prepare/route.ts`
  - `apps/studio/src/app/api/media/upload/image/client/route.ts`
  - `apps/studio/src/app/api/media/upload/image/finalize/route.ts`
  - `apps/studio/src/app/api/media/upload/svg/route.ts`
- Tracks final `tenants/<tenantId>/<yyyy>/<mm>/<filename>` objects.
- Does not track temp `tenants/<tenantId>/_tmp/media/...` objects as durable
  assets.

## JSON Boundaries

### Page JSON

`Page.blocks` remains JSON. Blocks contain rows, columns, and cells, and the
current domain treats them as nested builder content. Current use-cases read the
page aggregate, mutate nested block structures, validate through Zod/domain
schemas, and write the full page back through `PagesRepository`.

V1 should not create tables for:

- blocks
- rows
- columns
- cells

Reasons:

- Current repository ports do not expose independent block/row/column/cell
  persistence.
- Current public rendering consumes the page aggregate.
- Querying individual cells is not part of current runtime behavior.
- Normalizing builder internals would expand migration scope and risk without a
  current product requirement.

### Page Sitemap JSON

`Page.sitemap` can remain JSON for V1 because it is a small nested value and is
read with the page document. If future sitemap queries need filtering by
`include`, a scalar `sitemapInclude` could be added later.

### Site Index JSON

`SiteIndex.pages` remains JSON because it is an ordered array and current code
uses that order as the source of truth. Deriving this from `Page` rows would
change behavior unless an explicit ordering field and migration contract are
introduced.

### Settings Section JSON

`SiteSettings` keeps section-based JSON fields:

- `header`
- `footer`
- `primaryMenu`
- `legalMenu`
- `social`
- `identity`
- `seo`
- `theme`

Reasons:

- Current Studio routes edit settings by section.
- Current domain has section entities and section validation schemas.
- Current repository returns a full `SiteSettings` aggregate.
- The KV repository merges persisted settings with defaults on read.
- Section JSON allows validation after Prisma reads without inventing
  relational tables for menu items, social links, theme tokens, or SEO nested
  structures.

### User RBAC JSON

`User.rbac` remains JSON for V1 and preserves:

- `role`
- `tenantIds`
- `defaultTenantId`
- wildcard `"*"` tenant access

The proposal also stores `role` as a scalar mirror for list/filter convenience.
The JSON remains the behavioral source of truth for compatibility with the
current session and validation flow.

### Demo Metadata JSON

`User.demo` remains JSON for V1 because it mirrors the current optional
`UserDemoMeta` object and is only present for demo users.

## Migration Implications

### Draft and Published Pages

Draft and published pages should map to separate `Page` rows:

- Same `tenantId`.
- Same domain `pageId` when publish copies a draft page to published.
- Different `state`.
- Independent JSON `blocks`, SEO fields, sitemap data, and timestamps.

This maps directly from:

- `compoz:<tenant>:draft:pages:<pageId>`
- `compoz:<tenant>:published:pages:<pageId>`

The slug indexes become relational uniqueness:

- `@@unique([tenantId, state, slug])`
- `@@unique([tenantId, state, pageId])`

Publish should continue copying draft rows to published rows and deleting
published orphans based on the previous published index until the publish
domain is intentionally redesigned.

### Site Index and Settings

Draft and published index/settings map to separate rows:

- `SiteIndex(tenantId, state)`
- `SiteSettings(tenantId, state)`

This preserves the current `SiteRepository` port and publish flow:

- read draft index/settings
- read draft pages referenced by index
- validate
- write published pages
- write published settings
- write published index
- revalidate public routes

### Host Resolution

Production host mappings move from `COMPOZ_TENANT_BY_HOST_JSON` to
`TenantDomain`.

Runtime lookup should preserve current normalization from
`apps/site/src/lib/tenant/resolve-site-tenant.ts`:

- trim
- lower-case
- strip port
- strip leading `www.`

Recommended lookup order:

1. Normalize incoming host.
2. Query `TenantDomain.host`.
3. If no row matches and host is `{tenant}.lvh.me`, use dev-only tenant
   extraction.
4. If no row matches and host is `*.vercel.app`, use fallback behavior.
5. Fall back to `COMPOZ_DEFAULT_TENANT_ID` or `"default"` while migration is in
   progress.

### User RBAC

User RBAC is preserved as JSON for V1:

- Existing `tenantIds` arrays migrate into `User.rbac`.
- `defaultTenantId` remains in `User.rbac`.
- Wildcard `"*"` remains supported.
- `role` is mirrored into `User.role`.

The active tenant cookie flow can continue to validate against the session RBAC
without requiring a `UserTenant` table.

Before returning users from a Prisma repository, keep the existing Zod validation
boundary from `packages/validation/src/users/user.ts`.

### Media Assets

Media files stay in Vercel Blob or local storage. Prisma stores optional
metadata only:

- final object key
- public URL
- tenant id
- kind
- dimensions and size metadata returned by upload routes

Temp upload objects under `tenants/<tenantId>/_tmp/media/...` should not be
inserted as durable `MediaAsset` rows. They can remain transient object storage.

No `MediaUsage` table is proposed. Usage remains embedded in page blocks and
settings JSON, matching current behavior.

### Data Remaining in Env Vars

These should remain env/runtime config in V1:

- `AUTH_SECRET`
- `DEMO_AUTH_SECRET`
- `COMPOZ_CRON_SECRET`
- `COMPOZ_REVALIDATE_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `PUBLIC_UPLOADS_DIR`
- `NEXT_PUBLIC_SITE_ORIGIN`
- `NEXT_PUBLIC_SITE_URL`
- `VERCEL_URL`
- upload size limits
- KV/Upstash env vars during migration and rollback
- temporary repository implementation flags during cutover

`COMPOZ_TENANT_BY_HOST_JSON` should become a migration/bootstrap source or
emergency override, not the primary production domain registry.

## Risks and Open Decisions

These choices need human validation before writing `schema.prisma`.

1. **Tenant id as primary key**: This proposal uses the current tenant id string
   as `Tenant.id`. Confirm whether tenant ids should remain mutable or immutable.
   If mutable display slugs are needed later, add a separate display field rather
   than changing this id.

2. **TenantKind values**: Confirm whether `standard`, `demo_seed`, and
   `demo_sandbox` are sufficient. Current code only has string conventions, so
   this is a small normalization step.

3. **`TenantDomain.isPrimary`**: Current runtime does not require primary
   domains. Keep it only if humans want a canonical domain for admin display,
   sitemap fallback, or redirects.

4. **`TenantDomain.rawHost`**: Optional display preservation may not be needed
   if all host input is normalized before storage.

5. **Page row id vs domain page id**: This proposal uses a generated Prisma row
   `id` plus current domain `pageId`. Alternatively, a composite primary key on
   `(tenantId, state, pageId)` could avoid a surrogate id. Human decision needed.

6. **Parent page relation**: This proposal keeps `parentPageId` as a string
   instead of a relational self-reference. Confirm this is acceptable for V1 to
   avoid draft/published self-relation complexity.

7. **Site index as JSON**: This proposal preserves `SiteIndex.pages` as JSON.
   Confirm no V1 query requires indexing individual page summary order.

8. **Settings section columns**: This proposal uses one JSON column per section.
   Confirm this is preferred over one `settings Json` column. Section columns
   match current settings routes better, while a single column may simplify
   repository writes.

9. **`SiteSettings.updatedAt` source**: Current settings aggregate does not
   expose a root `updatedAt`. Decide whether Prisma `updatedAt` is enough or
   whether migration should preserve any legacy timestamp if found.

10. **User `passwordHash` placement**: This proposal stores password hash on
    `User` for V1 because the current KV repository stores it by user id. Confirm
    whether credentials should instead be split into a `UserCredential` table.

11. **User `role` scalar mirror**: This duplicates `rbac.role`. Confirm whether
    the scalar mirror is worth the denormalization for list/filter convenience.

12. **RBAC JSON validation**: Confirm that Prisma repositories must parse
    `User.rbac` with existing Zod schemas after every read, preserving current
    behavior.

13. **DemoSandbox tenant relation**: This proposal makes `tenantId` unique and
    cascades demo tenant deletion. Confirm desired cleanup order for user,
    sandbox record, tenant content, and object storage.

14. **MediaAsset inclusion**: `MediaAsset` is justified for metadata and
    cleanup, but current rendering does not require it. Confirm whether V1 should
    include it now or defer until an asset library/cleanup need is explicit.

15. **Media provider enum**: Confirm whether `local` and `vercel_blob` are enough
    for current deployments.

16. **Favicon multi-file uploads**: Current favicon finalize writes several blob
    files but returns the 32px URL. Decide whether `MediaAsset` should create one
    row per generated file or one logical row with variants JSON. This proposal
    implies one row per final object key if tracked.

17. **Status snapshots**: This proposal excludes site status snapshots from
    canonical Prisma models. Confirm whether they should remain recomputed/cache
    data rather than relational tables.

18. **Legacy shape handling**: Confirm migration scripts will validate every
    Prisma-read JSON payload through existing Zod schemas and either repair or
    quarantine invalid legacy shapes.

19. **Domain fallback during cutover**: Decide whether Prisma domain lookup
    should allow env override precedence during rollout, or whether
    `TenantDomain` becomes authoritative immediately.

20. **Cascade deletes**: This proposal uses tenant cascades for domain/content
    rows. Confirm this is acceptable for permanent tenant deletion and demo
    cleanup, especially before implementing object storage deletion.

## Current Sources Referenced

- `docs/prisma-data-model-analysis.md`
- `docs/tenant-domain-resolution-analysis.md`
- `packages/core/src/constants/common/content-state.ts`
- `packages/core/src/domain/pages/entities/page.ts`
- `packages/core/src/domain/pages/ports/pages-repository.ts`
- `packages/core/src/domain/site/entities/site-index.ts`
- `packages/core/src/domain/site/entities/site-settings.ts`
- `packages/core/src/domain/site/ports/site-repository.ts`
- `packages/core/src/domain/users/entities/user.ts`
- `packages/core/src/domain/users/ports/users-repository.ts`
- `packages/core/src/domain/demo/entities/demo-sandbox.ts`
- `packages/core/src/domain/demo/ports/demo-sandbox-repository.ts`
- `packages/infra/src/http/studio/media.types.ts`
- `apps/studio/src/app/api/media/upload/image/prepare/route.ts`
- `apps/studio/src/app/api/media/upload/image/client/route.ts`
- `apps/studio/src/app/api/media/upload/image/finalize/route.ts`
- `apps/studio/src/app/api/media/upload/svg/route.ts`
- `packages/validation/src/users/user.ts`
- `packages/validation/src/demo/demo-sandbox.ts`
