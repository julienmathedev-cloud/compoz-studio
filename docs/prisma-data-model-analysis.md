# Prisma Data Model Analysis

Purpose: prepare a future migration from KV storage to Prisma/PostgreSQL without changing current behavior.

This document maps the persisted data model, KV key layout, domain/DTO boundaries, and practical Prisma boundaries visible in the current codebase. It intentionally does not propose relational tables for builder blocks, rows, columns, or cells because the current system treats them as nested page JSON and no inspected flow requires querying them independently.

## Files Inspected

- `packages/infra/src/pages/kv-pages-repository.ts`
- `packages/infra/src/site/kv-site-repository.ts`
- `packages/infra/src/site/kv-site-status-snapshot.ts`
- `packages/infra/src/users/kv-users-repository.ts`
- `packages/infra/src/demo/kv-demo-sandbox-repository.ts`
- `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts`
- `packages/infra/src/media/storage/media-storage.ts`
- `packages/infra/src/media/storage/blob-media-storage.ts`
- `packages/infra/src/media/storage/local-media-storage.ts`
- `apps/studio/src/app/api/pages/route.ts`
- `apps/studio/src/app/api/pages/[pageId]/route.ts`
- `apps/studio/src/app/api/pages/[pageId]/blocks/route.ts`
- `apps/studio/src/app/api/pages/[pageId]/blocks/[blockId]/route.ts`
- `apps/studio/src/app/api/settings/bundle/route.ts`
- `apps/studio/src/app/api/settings/identity/route.ts`
- `apps/studio/src/app/api/site/publish/route.ts`
- `apps/studio/src/app/api/media/upload/image/prepare/route.ts`
- `apps/studio/src/app/api/media/upload/image/finalize/route.ts`
- `apps/studio/src/app/api/media/upload/svg/route.ts`
- `apps/studio/src/app/api/admin/tenant/active/route.ts`
- `apps/studio/src/auth/auth.ts`
- `apps/studio/src/auth/require-session.ts`
- `apps/studio/src/features/settings/hooks/useSettingsResource.ts`
- `apps/studio/src/features/settings/identity/useIdentitySettings.ts`
- `apps/studio/src/features/settings/mappers/identity-form.ts`
- `apps/studio/src/features/pages/hooks/useUpdatePage.ts`
- `apps/studio/src/features/pages/mappers/pages-form.ts`
- `apps/site/src/lib/tenant/resolve-site-tenant.ts`
- `apps/site/src/lib/pages/published-page-loaders.ts`
- `apps/site/src/app/uploads/[...path]/route.ts`
- `packages/core/src/constants/common/content-state.ts`
- `packages/core/src/domain/pages/entities/page.ts`
- `packages/core/src/domain/pages/entities/block.ts`
- `packages/core/src/domain/pages/ports/pages-repository.ts`
- `packages/core/src/domain/pages/dto.ts`
- `packages/core/src/domain/pages/use-cases/blocks/update-section-block.ts`
- `packages/core/src/domain/site/entities/site-index.ts`
- `packages/core/src/domain/site/entities/site-settings.ts`
- `packages/core/src/domain/site/ports/site-repository.ts`
- `packages/core/src/domain/site/dto.ts`
- `packages/core/src/domain/site/use-cases/publish/publish-site.ts`
- `packages/core/src/domain/site/use-cases/publish/helpers.ts`
- `packages/core/src/domain/users/entities/user.ts`
- `packages/core/src/domain/assets/entities/image.ts`
- `packages/core/src/domain/assets/validators/image.ts`
- `packages/validation/src/pages/page.ts`
- `packages/validation/src/pages/blocks/block.ts`
- `packages/validation/src/site/settings/identity/identity.ts`
- `packages/validation/src/site/settings/seo/seo.ts`
- `packages/validation/src/site/publish/publish.ts`
- `packages/validation/src/users/user.ts`

## 1. Current Persisted Entities

### Tenants

There is no standalone persisted tenant entity in the inspected code.

Tenant identity is currently implicit:

- Tenant IDs scope KV keys, for example `compoz:<tenant>:draft:site:settings`.
- Studio users store RBAC tenant access as `rbac.tenantIds` and `rbac.defaultTenantId`.
- The active Studio tenant is selected from session data and an httpOnly cookie named `compoz_active_tenant`.
- Public site tenant resolution is host/env based, not DB based.

Implication for Prisma: introduce a `Tenant` table if PostgreSQL becomes the source of truth, but migrate it from existing tenant IDs discovered in KV keys, user RBAC, and configured host mappings. There is no current tenant profile payload to migrate.

### Pages

Pages are persisted as whole page documents, scoped by tenant and content state.

Domain shape:

- `Page.id`
- `Page.parentId`
- `Page.slug`
- `Page.name`
- `Page.seoTitle`
- `Page.seoDescription`
- `Page.blocks`
- `Page.meta.createdAt`
- `Page.meta.updatedAt`
- `Page.sitemap`
- `Page.paginationEnabled`

The full page document includes nested builder content in `blocks`. Blocks contain rows, columns, and cells. Current repositories persist and load the complete page JSON rather than separate block/cell records.

### Page Index / Site Index

The site index is a separate persisted aggregate:

- `SiteIndex.pages`: ordered list of page summaries.
- `SiteIndex.updatedAt`: ISO timestamp.

Each index page summary contains:

- `id`
- `slug`
- `name`
- `parentId`

The Studio pages list treats the draft site index as source of truth. Page create/update/delete routes patch the index directly instead of scanning all pages.

### Site Settings

Site settings are persisted as one aggregate per tenant and content state:

- `header`
- `footer`
- `primaryMenu`
- `legalMenu`
- `social`
- `identity`
- `seo`
- `theme`

Settings are read as one bundle in Studio, then edited slice by slice through PATCH routes and use-cases. The KV repository merges persisted partial data with domain defaults on read.

### Draft vs Published Data

The persisted content state is `draft | published`.

Current rules:

- Studio writes are draft-only for pages, blocks, and settings.
- Public site reads use `published` only.
- Publish copies data from `draft` to `published`.
- Draft and published have separate page documents, slug indexes, page slug refs, site indexes, and site settings.

Publish flow:

1. Read draft site index and draft site settings.
2. Read draft pages referenced by the draft index.
3. Validate publish invariants.
4. Copy referenced pages to published.
5. Delete published orphan pages based on the previous published index.
6. Copy settings to published.
7. Write a new published index derived from pages actually copied.
8. Revalidate public routes when publishing to `published`.

### Domains / Host Resolution

There is no persisted domain entity in the inspected code.

Public tenant resolution supports:

- Explicit host mapping from `COMPOZ_TENANT_BY_HOST_JSON`.
- Dev subdomains like `{tenant}.lvh.me`.
- Fallback from `COMPOZ_DEFAULT_TENANT_ID` or `"default"`.
- `/t/:tenantId` routes for explicit tenant routing.

Implication for Prisma: domains can become relational later, but this migration should not invent a fully managed domain lifecycle unless product requirements exist. A minimal `TenantDomain` table can mirror env host mappings if needed for operational migration.

### Media Assets

There is no media asset repository or persisted media metadata index in the inspected code.

Media persistence is object storage only:

- Vercel Blob in production-like storage.
- Local filesystem under `public/uploads` in local storage.
- Stored URLs are returned to the UI.
- Image references are embedded in page block JSON and site settings fields such as identity logo/favicon and SEO Open Graph image URL.

Media object keys are tenant-scoped:

- Final media: `tenants/<tenantId>/<yyyy>/<mm>/<filename>`
- Temp raster media: `tenants/<tenantId>/_tmp/media/<yyyy>/<mm>/<filename>`

### Users / Auth / Roles

Users are persisted globally under the Studio users namespace, not tenant-scoped keys.

Persisted user data:

- User document JSON.
- Email-to-user ID index.
- Password hash by user ID.

Auth.js uses Credentials with JWT sessions. There is no Auth.js DB adapter. The Studio users repository is the single source of truth for login and admin CRUD.

User domain fields:

- `id`
- `email`
- `name`
- `status`: `active | disabled`
- `rbac.role`: `admin | editor`
- `rbac.tenantIds`: list of tenant IDs, or `*`
- `rbac.defaultTenantId`
- `meta.createdAt`
- `meta.updatedAt`
- `meta.lastLoginAt?`
- `demo?`: demo metadata for temporary demo users

## 2. Current KV Storage Model

### Page Documents

Key:

```text
compoz:<tenant>:<state>:pages:<pageId>
```

Stores:

- Full `Page` JSON document.
- Includes nested `blocks` JSON.

Scope:

- Tenant-scoped.
- Draft or published.
- Canonical persisted page document for that state.

Current code:

- Built by `pageKey()` in `packages/infra/src/pages/kv-pages-repository.ts`.

### Page Slug Index

Key:

```text
compoz:<tenant>:<state>:pagesBySlug:<slug>
```

Stores:

- `pageId` string.

Scope:

- Tenant-scoped.
- Draft or published.
- Derived secondary index.

Purpose:

- Avoid scanning pages for `readBySlug()` and slug existence checks.

Current code:

- Built by `pageSlugIndexKey()` in `packages/infra/src/pages/kv-pages-repository.ts`.

### Page Slug Reverse Reference

Key:

```text
compoz:<tenant>:<state>:pageSlugById:<pageId>
```

Stores:

- Current slug string for a page ID.

Scope:

- Tenant-scoped.
- Draft or published.
- Derived secondary index.

Purpose:

- Maintain slug index during slug changes without rereading the whole page only to find the old slug.

Current code:

- Built by `pageSlugRefKey()` in `packages/infra/src/pages/kv-pages-repository.ts`.

### Site Index

Key:

```text
compoz:<tenant>:<state>:site:index
```

Stores:

- `SiteIndex` JSON: ordered `pages[]` and `updatedAt`.

Scope:

- Tenant-scoped.
- Draft or published.
- Canonical ordered site/page index for that state.

Current code:

- Built by `indexKey()` in `packages/infra/src/site/kv-site-repository.ts`.

### Site Settings

Key:

```text
compoz:<tenant>:<state>:site:settings
```

Stores:

- `SiteSettings` JSON aggregate.

Scope:

- Tenant-scoped.
- Draft or published.
- Canonical settings aggregate for that state.

Current code:

- Built by `settingsKey()` in `packages/infra/src/site/kv-site-repository.ts`.

### Site Status Snapshot

Key:

```text
compoz:<tenant>:status:snapshot
```

Stores:

- `SiteStatus` JSON snapshot.

Scope:

- Tenant-scoped.
- Derived cache.
- Not draft/published directly, but computed from comparisons/status use-cases.

Current code:

- Built by `statusSnapshotKey()` in `packages/infra/src/site/kv-site-status-snapshot.ts`.

### Site Status Details Version

Key:

```text
compoz:<tenant>:statusDetails:version
```

Stores:

- Numeric version token.

Scope:

- Tenant-scoped.
- Derived cache invalidation token.

Purpose:

- `INCR` invalidates all status details snapshots without scanning/deleting parameterized keys.

Current code:

- Built by `statusDetailsVersionKey()` in `packages/infra/src/site/kv-site-status-snapshot.ts`.

### Site Status Details Snapshot

Key:

```text
compoz:<tenant>:statusDetails:snapshot:v<version>:<scope>:<includeBlocks>:page:<pageId|all>
```

Examples:

```text
compoz:default:statusDetails:snapshot:v3:dirty:1:page:all
compoz:default:statusDetails:snapshot:v3:all:0:page:home-page-id
```

Stores:

- `SiteStatusDetails` JSON.

Scope:

- Tenant-scoped.
- Derived cache.
- Parameterized by query.
- TTL-backed.

Current code:

- Built by `statusDetailsSnapshotKey()` in `packages/infra/src/site/kv-site-status-snapshot.ts`.

### Studio User Document

Key:

```text
compoz:studio:users:user:<userId>
```

Stores:

- `User` JSON.

Scope:

- Global Studio namespace.
- Not tenant-scoped by key.
- User document contains tenant access in `rbac`.

Current code:

- Built by `userKey()` in `packages/infra/src/users/kv-users-repository.ts`.

### Studio User Email Index

Key:

```text
compoz:studio:users:userByEmail:<emailLower>
```

Stores:

- `userId` string.

Scope:

- Global Studio namespace.
- Derived secondary index.

Purpose:

- Login and user lookup by email.

Current code:

- Built by `emailIndexKey()` in `packages/infra/src/users/kv-users-repository.ts`.

### Studio User Password Hash

Key:

```text
compoz:studio:users:pwd:<userId>
```

Stores:

- Bcrypt password hash string.

Scope:

- Global Studio namespace.
- Infra-only auth secret data.

Current code:

- Built by `pwdKey()` in `packages/infra/src/users/kv-users-repository.ts`.

### Demo Sandbox

Key:

```text
compoz:studio:demo:sandbox:<demoInstanceId>
```

Stores:

- `DemoSandbox` JSON: `demoInstanceId`, `userId`, `tenantId`, `expiresAt`, `createdAt`.

Scope:

- Global Studio demo namespace.
- References a tenant and user.

Current code:

- Built by `sandboxKey()` in `packages/infra/src/demo/kv-demo-sandbox-repository.ts`.

### Demo Tenant Cleanup Pattern

Pattern:

```text
compoz:<tenantId>:*
```

Stores:

- Not a single entity. This pattern matches all tenant-scoped page, site, and status keys.

Scope:

- Tenant-scoped.
- Cleanup-only.
- Guarded to `tenantId` values starting with `demo-`.

Current code:

- Built by `tenantKeyPattern()` in `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts`.

### Media Object Storage Keys

Final media key:

```text
tenants/<tenantId>/<yyyy>/<mm>/<filename>
```

Temp raster upload key:

```text
tenants/<tenantId>/_tmp/media/<yyyy>/<mm>/<filename>
```

Stores:

- Binary object in Vercel Blob or local filesystem, not Redis KV.

Scope:

- Tenant-scoped object path.
- Final objects are referenced by returned URLs embedded in settings/page JSON.
- Temp objects are transient upload intermediates.

Current code:

- Built in `apps/studio/src/app/api/media/upload/image/prepare/route.ts`.
- Built in `apps/studio/src/app/api/media/upload/image/finalize/route.ts`.
- Built in `apps/studio/src/app/api/media/upload/svg/route.ts`.

### Local UI Storage

Key:

```text
compoz.studio.theme
```

Stores:

- Browser localStorage theme preference.

Scope:

- Client-only.
- Not part of server data migration.

Current code:

- `apps/studio/src/features/theme/StudioThemeProvider.tsx`.

## 3. Domain Entities and DTOs

### Main Domain Entities

Pages:

- `Page`
- `PageMeta`
- `PageSitemap`
- `PageSummary`
- `InternalPageOption`
- `Block`
- `SectionBlock`
- `BlockRow`
- `BlockColumn`
- `Cell` union and cell item types

Site:

- `SiteIndex`
- `SiteSettings`
- `HeaderSettings`
- `FooterSettings`
- `PrimaryMenuSettings`
- `LegalMenuSettings`
- `SocialSettings`
- `IdentitySettings`
- `SeoSettings`
- `ThemeSettings`
- `SiteStatus`
- `SiteStatusDetails`

Users:

- `User`
- `UserSummary`
- `UserRbac`
- `UserMeta`
- `UserDemoMeta`

Demo:

- `DemoSandbox`

Assets:

- `Image`

### DTOs / Validation Schemas

Pages:

- DTOs: `PageDTO`, `PageSummaryDTO`, `InternalPageOptionDTO`, `BlockDTO`, `CellDTO`.
- Storage/API schema: `PageSchema`.
- Render schema: `PageRenderSchema`.
- Form schema: `PageFormSchema`.
- Intent schemas: `CreatePageIntentSchema`, `UpdatePageIntentSchema`.
- Block schemas: `BlockSchema`, `SectionBlockSchema`, `BlockRowSchema`, `BlockColumnSchema`.
- Block intent schemas: `CreateSectionBlockIntentSchema`, `UpdateSectionBlockIntentSchema`.

Site:

- DTOs: `SiteSettingsDTO`, `WriteSiteSettingsDTO`, `SiteIndexDTO`, per-section settings DTOs, `PublishSiteResultDTO`.
- Settings schemas include `HeaderSettingsSchema`, `FooterSettingsSchema`, `PrimaryMenuSettingsSchema`, `LegalMenuSettingsSchema`, `SocialSettingsSchema`, `IdentitySettingsSchema`, `SeoSettingsSchema`, `ThemeSettingsSchema`.
- Form schemas include per-section RHF schemas such as `IdentityFormSchema`, `SeoFormSchema`, `PrimaryMenuFormSchema`, `LegalMenuFormSchema`.
- Intent schemas include `UpdateIdentitySettingsIntentSchema`, `UpdateSeoSettingsIntentSchema`, and equivalent per-section settings update schemas.
- Publish schema: `PublishSiteResultSchema`.

Users:

- DTOs: `User` is exposed through domain and `packages/core/src/domain/users/dto.ts`.
- Storage/API schema: `UserSchema`.
- Summary schema: `UserSummarySchema`.
- Form schema: `UserFormSchema`.
- Intent schemas: `CreateUserIntentSchema`, `UpdateUserIntentSchema`, `ListUsersIntentSchema`.

Assets:

- Domain validator: `assertImage`.
- Shared validation schema: `ImageSchema` from `packages/validation/src/common/image.ts` is used by settings/page shapes.

### Storage to Domain to DTO to UI to Save

Page read flow:

1. API route resolves session and active tenant.
2. API creates tenant-aware `PagesRepository`.
3. Repository reads `compoz:<tenant>:<state>:pages:<pageId>`.
4. Repository parses Redis JSON.
5. Repository normalizes legacy page/block shapes.
6. Repository validates with `PageSchema`.
7. Repository maps `PageShape` to domain `Page`.
8. API returns `PageDTO`.
9. UI maps DTO to `PageFormValues` with page mappers.

Page save flow:

1. RHF form is the UI source of truth.
2. UI computes a shallow diff against baseline.
3. UI maps changed form fields to `UpdatePageIntentDTO`.
4. API validates with `UpdatePageIntentSchema`.
5. API adapter maps intent DTO to domain input.
6. Domain use-case reads draft page, applies patch, validates invariants, and writes through `pages.put(draft, page)`.
7. API patches draft `SiteIndex` when page summary fields change.
8. API invalidates status snapshots.
9. UI updates React Query caches.

Block save flow:

1. UI sends block intent DTO.
2. API validates params and payload.
3. Domain block use-case reads the draft page.
4. Use-case updates nested `page.blocks`.
5. Use-case validates blocks.
6. Repository writes the full draft page document.
7. Status snapshots are invalidated.

Settings read flow:

1. UI loads the settings bundle through React Query.
2. API reads `SiteSettings` for requested state.
3. KV repository reads `compoz:<tenant>:<state>:site:settings`.
4. Repository merges missing sections with defaults and normalizes legacy SEO/theme shapes.
5. API returns `SiteSettingsDTO`.
6. UI per-section hooks map DTO slices to RHF form values.

Settings save flow:

1. RHF form is the UI source of truth.
2. `useSettingsResource` computes a minimal patch against baseline.
3. Section mapper converts form values to update intent DTO.
4. PATCH route validates the intent DTO.
5. API adapter maps the intent to domain patch input.
6. Domain use-case reads draft settings, merges the section patch, validates, and writes the full draft settings aggregate.
7. Status snapshot cache is invalidated.
8. UI patches the cached settings bundle slice and invalidates status queries.

Publish flow:

1. API invokes `publishSite`.
2. Domain use-case copies draft pages/settings/index into published state using repository ports.
3. Published index is derived from pages successfully copied.
4. Public loaders read only published settings/index/pages.

Auth flow:

1. Credentials provider validates email/password input.
2. `KvUsersRepository.readByEmail()` resolves email index then user doc.
3. `KvUsersRepository.verifyPassword()` checks bcrypt hash.
4. JWT session stores `userId`, role, tenant IDs, default tenant, and demo metadata.
5. API/page helpers resolve active tenant from JWT plus optional admin cookie.

## 4. Relationships Between Data

### Tenant to Pages

Current relationship:

- Encoded by tenant-scoped KV keys.
- No persisted tenant row exists.
- A tenant has separate draft and published pages.

Prisma implication:

- `Page` should belong to `Tenant`.
- State should be part of the uniqueness boundary: `(tenantId, state, id)` and `(tenantId, state, slug)`.

### Tenant to Settings

Current relationship:

- Encoded by tenant-scoped KV settings key.
- One settings aggregate per tenant and state.

Prisma implication:

- `SiteSettings` should belong to `Tenant`.
- Add unique `(tenantId, state)`.
- Keep section payloads as JSON or keep one aggregate JSON column initially.

### Tenant to Domains

Current relationship:

- Not persisted.
- Host mapping comes from environment JSON or dev host convention.

Prisma implication:

- Optional later table: `TenantDomain`.
- For migration parity, env mapping can remain outside DB until domain management is a product requirement.

### Page to Blocks JSON

Current relationship:

- `Page.blocks` is nested JSON.
- Block routes read/write the full page document.
- No repository exists for blocks independent of pages.

Prisma implication:

- Store `blocks` as `Json`.
- Do not create `Block`, `BlockRow`, `BlockColumn`, or `Cell` tables yet.

### Page Draft/Published Relationship

Current relationship:

- Same logical page ID may exist in both states.
- Draft and published copies are independent documents.
- Publish overwrites published page documents from draft pages referenced by the draft index.

Prisma implication:

- Model content state explicitly.
- Either one `Page` row per `(tenantId, state, pageId)` or a logical page table plus version/state rows.
- The minimal migration-compatible model is one row per state:
  - `tenantId`
  - `state`
  - `pageId`
  - `slug`
  - page metadata
  - `blocks Json`

### Settings Draft/Published Relationship

Current relationship:

- Draft and published settings are separate aggregates.
- Publish copies the whole settings aggregate from draft to published.

Prisma implication:

- One settings row per `(tenantId, state)`.
- Keep publish as an explicit copy operation.

### Media Usage

Current relationship:

- Media files are stored outside KV/Postgres.
- URL references are embedded in:
  - `identity.logo`
  - `identity.faviconUrl`
  - `seo.openGraph.defaultImageUrl`
  - page block/cell JSON image fields
- There is no media usage index.

Prisma implication:

- Do not block the KV-to-Prisma migration on a full media asset model.
- Optional later table: `MediaAsset` for upload audit/cleanup, but references should remain embedded until usage tracking is required.

### Users to Tenants

Current relationship:

- User document contains `rbac.tenantIds` array and `defaultTenantId`.
- `tenantIds` can contain `*`.

Prisma implication:

- Minimal migration-compatible model can keep RBAC as JSON on `User`.
- Better relational boundary: `User`, `UserTenantAccess`, plus `defaultTenantId`.
- Preserve wildcard support deliberately, for example with an `isSuperAdmin` boolean or a special access row.

## 5. Recommended Prisma Boundaries

### Tables to Introduce

#### `Tenant`

Reason:

- KV tenant scoping becomes an explicit relational parent.
- Required for foreign keys from pages/settings/domains.

Suggested fields:

- `id`
- `createdAt`
- `updatedAt`

Do not invent profile fields unless needed.

#### `Page`

Reason:

- Page lookup by tenant/state/id and tenant/state/slug is core behavior.
- Slug uniqueness is currently enforced by secondary KV indexes.

Suggested fields:

- `tenantId`
- `state`
- `pageId`
- `parentPageId`
- `slug`
- `name`
- `seoTitle`
- `seoDescription`
- `blocks Json`
- `sitemap Json?`
- `paginationEnabled`
- `createdAt`
- `updatedAt`

Indexes:

- Unique `(tenantId, state, pageId)`.
- Unique `(tenantId, state, slug)`.
- Index `(tenantId, state, parentPageId)`.

Keep `blocks` JSON.

#### `SiteIndex`

Reason:

- The ordered page index is a current source of truth.
- It should not be reconstructed implicitly during migration because current behavior preserves explicit order.

Suggested fields:

- `tenantId`
- `state`
- `pages Json`
- `updatedAt`

Alternative:

- If normalized later, page order can move onto `Page.sortOrder`.
- For first migration, keep index JSON to preserve behavior and reduce risk.

#### `SiteSettings`

Reason:

- Settings are read and written as one aggregate with section-level patch use-cases.

Suggested fields:

- `tenantId`
- `state`
- `settings Json`
- `updatedAt`

Alternative:

- JSON columns per section: `header`, `footer`, `primaryMenu`, `legalMenu`, `social`, `identity`, `seo`, `theme`.
- This can make partial updates cleaner while preserving current section boundaries.

Recommended first step:

- Use per-section JSON columns if convenient.
- Avoid fully normalizing menus/social/theme tokens at first.

#### `User`

Reason:

- Users and auth are persisted global business data.
- Email uniqueness and password hash should become relational constraints.

Suggested fields:

- `id`
- `email`
- `name`
- `status`
- `role`
- `tenantIds Json` or relational access rows
- `defaultTenantId`
- `passwordHash`
- `demo Json?`
- `createdAt`
- `updatedAt`
- `lastLoginAt`

Indexes:

- Unique `email`.

Recommended first step:

- Move password hash into the user row or a one-to-one credential table.
- Keep RBAC tenant IDs as JSON for migration parity, then normalize access later if needed.

#### `DemoSandbox`

Reason:

- Demo cleanup and reuse flows persist sandbox records and reference users/tenants.

Suggested fields:

- `demoInstanceId`
- `userId`
- `tenantId`
- `expiresAt`
- `createdAt`

Indexes:

- Unique `demoInstanceId`.
- Index `expiresAt`.
- Index `tenantId`.

#### Optional `TenantDomain`

Reason:

- Host resolution is currently env-based, not persisted.
- Add only if moving `COMPOZ_TENANT_BY_HOST_JSON` into DB is part of the migration.

Suggested fields:

- `id`
- `tenantId`
- `host`
- `createdAt`
- `updatedAt`

Indexes:

- Unique normalized `host`.

### Payloads That Should Remain JSON

Keep these as JSON in the first Prisma migration:

- `Page.blocks`
- Block rows, columns, and cells inside `Page.blocks`
- Cell items such as cards, galleries, testimonials, buttons, forms, image editors
- `Page.sitemap` unless direct querying is needed
- `SiteIndex.pages` for migration parity
- `SiteSettings` sections, especially:
  - menus
  - social links
  - theme tokens
  - SEO structured data
  - identity logo/favicon references
- User `demo` metadata if not splitting demo credentials immediately
- User RBAC tenant IDs if preserving wildcard semantics with minimal change

### Data Not Worth Normalizing Yet

Do not normalize yet:

- Blocks, rows, columns, cells.
- Menu children/items unless cross-page link reporting becomes required.
- Social links.
- Theme tokens.
- SEO structured data fields.
- Media usage references.
- Status snapshots/details caches.

Why:

- Current code reads/writes these as aggregate JSON.
- Validation is schema-driven at the boundary.
- Query patterns are by tenant/state/page/settings, not by nested builder content.
- Normalizing nested builder content would substantially increase migration risk without a current query requirement.

### Derived Data / Cache Boundaries

Do not treat these as durable relational source-of-truth tables:

- Page slug indexes.
- Page slug reverse refs.
- Site status snapshots.
- Site status details snapshots.

In PostgreSQL:

- Slug indexes become unique indexes on `Page`.
- Status snapshots can remain cache-only, be recomputed, or move to a separate cache store.
- Status details cache can be dropped during migration and rebuilt lazily.

## 6. Risks and Migration Notes

### Legacy Persisted Shapes

The KV page repository normalizes several historical shapes before `PageSchema.parse()`:

- `seoDescription` empty string to `null`.
- Image cell missing `zoomEnabled`.
- Timeline cell missing `collapsible`.
- Button variants/icons/icon positions.
- Form cell legacy `submitLabel` / `variantButton` into `submitButton`.
- Structured card item optional button.
- Carousel structured card item button.
- Row `reverseOn` defaults.

The site repository also normalizes legacy settings:

- SEO `structuredData` boolean / `structuredDataEnabled` into object form.
- Theme defaults and nested token defaults.
- Missing settings sections merged from defaults.

Migration note:

- Reuse the existing normalization path during migration export/import.
- Do not bulk-insert raw KV JSON into Prisma and assume it is canonical.
- After reading from Prisma, continue validating with Zod at repository boundaries.

### Draft/Published Synchronization

Risk:

- Draft and published are separate persisted copies.
- A page may exist in draft but not published, or published but not draft until publish cleanup.
- Published index should represent pages actually copied, not just the draft index blindly.

Migration note:

- Preserve state as a first-class dimension.
- Migrate draft and published independently.
- Preserve existing page IDs across states.
- Preserve index order exactly.

### Publish Flow

Risk:

- Publish is not a simple flag flip.
- It copies pages/settings, deletes published orphans based on the previous published index, writes a stamped published index, and may revalidate public routes.

Migration note:

- Keep `publishSite` semantics unchanged behind repository ports.
- Implement Prisma repositories to match current `PagesRepository` and `SiteRepository` contracts.
- Use DB transactions for publish if practical:
  - read draft index/settings/pages
  - upsert published pages
  - delete published orphans known from previous published index
  - upsert published settings
  - upsert published index
- Keep revalidation outside the DB transaction.

### Slug Uniqueness

Risk:

- KV uses explicit slug index keys and reverse refs.
- Prisma should not reproduce these derived key rows.

Migration note:

- Use unique DB constraints for `(tenantId, state, slug)`.
- Keep repository-level error mapping so duplicate slug behavior remains compatible.

### Site Index Consistency

Risk:

- The index is the Studio list source of truth.
- It can theoretically drift from page documents in KV.

Migration note:

- During migration, compare each `SiteIndex.pages[]` ref with the corresponding page document.
- Preserve index order even if some page docs are missing.
- Report missing docs; decide whether to skip, repair, or block per tenant.
- The publish flow already handles missing pages with warnings.

### Status Cache

Risk:

- Status snapshots are derived, versioned, and invalidated manually.

Migration note:

- Do not migrate status snapshot keys as source data.
- Clear/recompute status after migration.
- If PostgreSQL stores status caches later, keep them explicitly derived and disposable.

### Media

Risk:

- No central media table means unused media cannot be reliably detected from storage alone.
- Media URLs are embedded inside JSON payloads.

Migration note:

- Keep object storage unchanged.
- Migrate JSON references as-is.
- Optionally run a later crawler over page/settings JSON to build a media usage inventory.
- Do not require a media table for the KV-to-Prisma migration.

### Users and Passwords

Risk:

- Password hashes are separate KV keys.
- Email lookup depends on a separate index key.
- JWT sessions are stateless and may outlive migration deployment boundaries.

Migration note:

- Migrate user docs and password hashes together.
- Enforce unique lowercase email in PostgreSQL.
- Keep bcrypt hashes unchanged.
- Consider session invalidation or dual-read during rollout if login cutover must be seamless.

### Tenant Discovery

Risk:

- No canonical tenant table exists today.

Migration note:

- Build tenant IDs from:
  - `compoz:<tenant>:...` KV keys.
  - User `rbac.tenantIds`.
  - Demo sandbox `tenantId`.
  - `COMPOZ_TENANT_BY_HOST_JSON`.
  - `COMPOZ_DEFAULT_TENANT_ID`.
- Ignore wildcard `*` as a tenant row.

### Rollback Strategy

Recommended rollback approach:

1. Take a full KV backup before migration.
2. Deploy Prisma repositories behind a feature flag or repository implementation env var.
3. Run a read-only validation pass comparing KV and Prisma outputs through existing repository DTO/domain shapes.
4. During cutover, prefer dual-write for a short window if product usage allows it.
5. Keep KV read fallback available until Prisma reads are validated in production.
6. For rollback, switch repository implementation back to KV and discard Prisma writes since the last verified sync, or replay from dual-write logs if required.

### Validation After Reading from Prisma

Recommendation:

- Keep repository read boundaries defensive:
  - parse DB JSON as unknown
  - apply legacy normalization where needed
  - validate with Zod schemas such as `PageSchema`, `UserSchema`, and settings schemas
  - map parsed shapes to domain entities

Why:

- The current KV repositories already use boundary validation.
- PostgreSQL JSON columns can still contain invalid historical or manually edited data.
- Keeping Zod validation after Prisma reads prevents the migration from weakening data integrity.

## Practical First Prisma Model Boundary

A conservative first migration can use these durable tables:

- `Tenant`
- `Page`
- `SiteIndex`
- `SiteSettings`
- `User`
- `DemoSandbox`
- Optional `TenantDomain`

Keep these as JSON fields:

- `Page.blocks`
- `Page.sitemap`
- `SiteIndex.pages`
- Settings sections or full settings aggregate
- User RBAC tenant list, if not normalizing access immediately
- User demo metadata, if not using a dedicated `DemoSandbox` relationship immediately

Do not migrate these as durable tables:

- `pagesBySlug` keys
- `pageSlugById` keys
- status snapshot keys
- status details snapshot keys
- block/row/column/cell internals

This boundary preserves the current aggregate-oriented architecture, keeps RHF and domain use-cases intact, and lets Prisma replace KV behind the existing repository ports with minimal product behavior change.
