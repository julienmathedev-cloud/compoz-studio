# Tenant and Domain Resolution Analysis

This document maps the current tenant-related sources of truth in Compoz Studio
and the public site. It is scoped to tenant identity, domains, host resolution,
tenant-scoped configuration, tenant-scoped storage, and the Prisma migration
boundary. It does not propose billing, plans, subscriptions, or new product
features.

Secret values from local env files are intentionally omitted. Only variable
names and code-level behavior are documented.

## Environment Variables

| Env var | Read in | Behavior depending on it | Migration note |
| --- | --- | --- | --- |
| `COMPOZ_DEFAULT_TENANT_ID` | `apps/site/src/lib/pages/published-page-loaders.ts`, `apps/site/src/app/sitemap.ts`, `apps/site/src/app/robots.ts` | Fallback tenant for host-based public site resolution when no explicit host mapping, `*.lvh.me`, or explicit `/t/[tenantId]` route applies. Defaults to `"default"` inside `resolveTenantFromHost`. | Keep as infrastructure fallback during migration. It can point to a Prisma tenant id, but should not be the canonical tenant registry. |
| `COMPOZ_TENANT_BY_HOST_JSON` | `apps/site/src/lib/pages/published-page-loaders.ts`, `apps/site/src/app/sitemap.ts`, `apps/site/src/app/robots.ts` | JSON host-to-tenant map used by the public site. Hosts are normalized by lowercasing, stripping ports, and stripping `www.`. | Should move to `TenantDomain` rows for production domains. Keep env override only for emergency/dev bootstrap if needed. |
| `NEXT_PUBLIC_SITE_URL` | `apps/site/src/lib/seo/resolveSiteBaseUrl.ts`, `apps/site/src/app/sitemap.ts`, `apps/site/src/app/robots.ts`, `apps/site/src/app/t/[tenantId]/sitemap.ts`, `apps/site/src/app/t/[tenantId]/robots.ts` | Public base URL fallback for SEO metadata, sitemap URLs, and robots sitemap URLs when settings do not provide `seo.baseUrl`. | Keep as deployment-level fallback. Tenant-specific canonical domains should come from settings or `TenantDomain`. |
| `VERCEL_URL` | `apps/site/src/lib/seo/resolveSiteBaseUrl.ts` | Vercel deployment URL fallback for SEO metadata when no settings base URL or `NEXT_PUBLIC_SITE_URL` is available. | Keep as platform infrastructure fallback. |
| `NEXT_PUBLIC_SITE_ORIGIN` | `apps/studio/src/config/siteOrigin.ts`, `apps/studio/src/app/api/site/publish/route.ts` | Studio-side public site origin. Used to build fallback `/t/[tenantId]` public URLs and to call the public site's revalidation endpoint after publish. Defaults to `http://localhost:3001` in `getSiteOrigin`. | Keep as deployment config. Do not model as tenant data. |
| `COMPOZ_REVALIDATE_SECRET` | `apps/studio/src/app/api/site/publish/route.ts`, `apps/site/src/app/api/revalidate/route.ts` | Optional shared secret for Studio-to-site publish revalidation. The revalidation payload includes `tenantId` and slugs. If configured on the site, incoming requests must provide `x-revalidate-secret`. | Keep as secret env var. |
| `GOOGLE_SITE_VERIFICATION_PORTFOLIO` | `apps/site/src/app/(hosted)/layout.tsx` | Adds Google site verification metadata only when resolved `tenantId` is `portfolio`. | This is tenant-scoped SEO config. Prefer moving the verification value into tenant/site settings or a tenant metadata JSON field, while keeping secret handling in mind. |
| `GOOGLE_SITE_VERIFICATION_DEMO` | `apps/site/src/app/(hosted)/layout.tsx` | Adds Google site verification metadata only when resolved `tenantId` is `demo`. | Same as above. |
| `ADMIN_DEFAULT_TENANT` | `apps/studio/scripts/seed-admin.ts` | Seeds or updates the default admin user's `rbac.tenantIds` and `rbac.defaultTenantId`. Falls back to `"default"`. | Seed/dev bootstrap config. Do not use as tenant registry. |
| `ADMIN_EMAIL` | `apps/studio/scripts/seed-admin.ts` | Required for admin user seeding. Indirectly affects tenant access because the seeded user receives `ADMIN_DEFAULT_TENANT`. | User/bootstrap config, not tenant config. |
| `ADMIN_PASSWORD` | `apps/studio/scripts/seed-admin.ts` | Required for admin user seeding. | Secret bootstrap config. |
| `ADMIN_NAME` | `apps/studio/scripts/seed-admin.ts` | Optional admin display name during seeding. | Bootstrap config. |
| `AUTH_SECRET` | `apps/studio/src/auth/auth.ts`, `apps/studio/src/auth/middleware.ts` | Auth.js/JWT secret. Studio sessions carry user RBAC, including `tenantIds` and `defaultTenantId`. | Keep as secret env var. |
| `NEXTAUTH_URL` | Local Auth.js runtime convention; not read directly by inspected app code | Auth.js deployment URL convention. No tenant logic in inspected source reads it directly. | Keep as auth/deployment config if needed by runtime. |
| `DEMO_AUTH_SECRET` | `apps/studio/src/auth/demo-auth.ts` | Required to generate deterministic demo user passwords from `demoInstanceId`. | Keep as secret env var. |
| `COMPOZ_CRON_SECRET` | `apps/studio/src/app/api/internal/demo/cleanup/route.ts` | Required secret for the internal demo cleanup endpoint that deletes expired demo sandbox records, users, and tenant data. | Keep as secret env var. |
| `MAX_IMAGE_UPLOAD_BYTES` | `apps/studio/src/app/api/media/upload/image/prepare/route.ts`, `apps/studio/src/app/api/media/upload/image/client/route.ts`, `apps/studio/src/app/api/media/upload/svg/route.ts` | Server-side upload limit for tenant-scoped media uploads. Defaults to `5_000_000`. | Keep as global infrastructure/config limit unless per-tenant limits become a real product feature. |
| `NEXT_PUBLIC_MAX_IMAGE_UPLOAD_BYTES` | `apps/studio/src/lib/config/uploads.ts` | Client-side upload limit used by Studio UI validation. | Keep as app config. |
| `BLOB_READ_WRITE_TOKEN` | `packages/infra/src/media/storage/index.ts` | Selects Vercel Blob storage when present; otherwise local filesystem storage is used. | Keep as infrastructure secret. |
| `PUBLIC_UPLOADS_DIR` | `packages/infra/src/media/storage/local-media-storage.ts`, `apps/site/src/app/uploads/[...path]/route.ts` | Local filesystem root for public uploads. Object keys can include `tenants/<tenantId>/...`. | Keep as infrastructure config. |
| `PAGES_REPO_IMPL` | `packages/infra/src/pages/index.ts` | Selects `kv` or `memory` pages repository. KV and memory page repositories are tenant-scoped. Defaults to `kv`. | Temporary migration switch candidate. Eventually replace with Prisma-backed implementation. |
| `SITE_REPO_IMPL` | `packages/infra/src/site/index.ts` | Selects `kv` or `memory` site repository/status cache. KV is tenant-scoped; memory site repository is effectively global. Defaults to `kv`. | Temporary migration switch candidate. Eventually replace with Prisma-backed implementation. |
| `KV_REST_API_URL` | `packages/infra/src/kv/kv-redis.ts`, settings routes debug logs, `scripts/audit-legacy-card-cells.mjs` | Upstash Redis REST URL for current KV storage. Some settings routes log whether a KV URL is present. | Keep during dual-read/backup/migration. Remove from runtime once Prisma replaces KV. |
| `UPSTASH_REDIS_REST_URL` | `packages/infra/src/kv/kv-redis.ts`, settings routes debug logs, `scripts/audit-legacy-card-cells.mjs` | Fallback Redis REST URL. | Same as above. |
| `KV_REST_API_TOKEN` | `packages/infra/src/kv/kv-redis.ts`, `scripts/audit-legacy-card-cells.mjs` | Upstash Redis REST token. | Secret migration/runtime config until KV is retired. |
| `UPSTASH_REDIS_REST_TOKEN` | `packages/infra/src/kv/kv-redis.ts`, `scripts/audit-legacy-card-cells.mjs` | Fallback Redis REST token. | Same as above. |
| `KV_SLOW_MS`, `KV_TRACE_ALLOW_PROD`, `KV_TRACE_ALLOW_BUILD`, `KV_DEBUG_ALLOW_PROD`, `KV_DEBUG_ALLOW_BUILD`, `KV_DEBUG`, `KV_TRACE` | `packages/infra/src/kv/kv-telemetry.ts` | KV observability and debug behavior. Not tenant data, but affects current tenant-scoped KV operations. | Keep only while KV remains in runtime. |
| `NODE_ENV` | `apps/site/src/app/(hosted)/layout.tsx`, `apps/site/src/app/t/[tenantId]/layout.tsx`, `apps/studio/src/app/api/admin/tenant/active/route.ts`, `apps/studio/src/app/api/site/publish/route.ts` | Production mode affects SEO noindex behavior, active tenant cookie `secure`, and publish runtime validation. | Keep as runtime config. |

## Static Files and Constants

### Host and Fallback Tenant Constants

| Source | Value/pattern | Classification | Notes |
| --- | --- | --- | --- |
| `apps/site/src/lib/tenant/resolve-site-tenant.ts` | fallback tenant defaults to `"default"` | Fallback data | Used when no host mapping resolves. |
| `apps/site/src/lib/tenant/resolve-site-tenant.ts` | `{tenant}.lvh.me` -> tenant | Dev-only resolution | Enables local host-based multi-tenant testing. |
| `apps/site/src/lib/tenant/resolve-site-tenant.ts` | `*.vercel.app` returns fallback tenant | Deployment fallback | Code comments recommend explicit `/t/[tenantId]` for real tenant access on Vercel preview/fallback domains. |
| `apps/site/src/lib/tenant/resolve-site-tenant.ts` | strips `www.` and ports from hosts | Host normalization rule | Important to preserve in Prisma-backed domain lookup. |

### Demo and Sandbox Tenant Constants

| Source | Value/pattern | Classification | Notes |
| --- | --- | --- | --- |
| `packages/core/src/constants/demo/demo.ts` | `DEMO_SEED_TENANT_ID = "demo"` | Seed/demo data | Source tenant used to clone demo sandboxes. |
| `packages/core/src/constants/demo/demo.ts` | `DEMO_INSTANCE_COOKIE_NAME = "compoz_demo_instance"` | Demo runtime data | Tracks the current demo instance in browser state. |
| `packages/core/src/constants/demo/demo.ts` | `DEMO_SANDBOX_TTL_MS = 24h` | Demo lifecycle config | Used for demo sandbox expiry. |
| `packages/core/src/domain/demo/use-cases/create-demo-sandbox-from-seed.ts` | sandbox tenant id `demo-<demoInstanceId>` | Derived demo data | Temporary tenant namespace for demo users. |
| `packages/core/src/domain/demo/use-cases/create-demo-sandbox-from-seed.ts` | demo email `demo+<demoInstanceId>@compoz.local` | Derived demo data | User identity for demo sandbox sessions. |
| `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts` | cleanup is allowed only when tenant starts with `demo-` | Safety rule | Prevents accidental deletion of non-demo tenants. |
| `packages/infra/src/scripts/migrate-default-to-demo.ts` | source `"default"`, target `"demo"` | One-off migration script data | Copies legacy default tenant data to the demo tenant. |
| `scripts/audit-legacy-card-cells.mjs` | ignores tenants starting with `demo-` | Audit script rule | Prevents demo sandboxes from polluting legacy content audit results. |

### Tenant-Specific UI and SEO Constants

| Source | Value/pattern | Classification | Notes |
| --- | --- | --- | --- |
| `packages/ui/src/site/skins/resolveSiteUi.ts` | `demo`, `lola`, `portfolio`, `renaud` map to tenant-specific UI skins | Production/static presentation data | Hardcoded tenant ids affect rendering. Demo sandboxes use the `demo` skin. |
| `packages/ui/src/site/skins/resolveSiteUi.ts` | `portfolio` -> `/site-skins/portfolio/custom.css`, `renaud` -> `/site-skins/renaud/custom.css` | Production/static presentation data | Tenant-specific CSS mapping. |
| `packages/ui/src/site/skins/resolveSiteRuntimeFeatures.ts` | tenant `lola` enables `autoHideSingleH1Block` | Production/static runtime behavior | Tenant-specific rendering feature flag. |
| `apps/site/src/app/(hosted)/layout.tsx` | Google verification entries for `portfolio` and `demo` | Tenant-specific SEO config | Currently env-backed but hardcoded tenant ids select the values. |
| `apps/site/public/site-skins/portfolio/custom.css`, `apps/site/public/site-skins/renaud/custom.css` | static public skin files | Static presentation assets | Site runtime serves these by hardcoded tenant CSS map. |
| `apps/studio/public/site-skins/portfolio/custom.css`, `apps/studio/public/site-skins/renaud/custom.css` | static Studio/preview skin files | Static presentation assets | Mirrors site-side skin assets for Studio preview. |

### Tenant ID Normalization Constants

| Source | Value/pattern | Classification | Notes |
| --- | --- | --- | --- |
| `packages/ui/src/lib/tenant-id.ts` | `toTenantId` trims/lowercases and returns `null` for empty | Runtime normalization | Used by public site and revalidation paths. |
| `packages/infra/src/lib/normalize-tenant-id.ts` | fallback default `"default"`; lower-case optional | Infra fallback | Used by repository factories and KV repositories. |
| `packages/validation/src/users/user.ts` | user tenant ids are trimmed/lowercased and may include `"*"` | RBAC validation | `defaultTenantId` must be included unless wildcard access is present. |

## Runtime Tenant Resolution

### Public Host-Based Site

The public hosted routes under `apps/site/src/app/(hosted)` resolve the current
tenant from request headers:

1. `apps/site/src/lib/pages/published-page-loaders.ts` reads
   `x-forwarded-host` first, then `host`.
2. It calls `resolveTenantFromHost` from
   `apps/site/src/lib/tenant/resolve-site-tenant.ts`.
3. `resolveTenantFromHost` normalizes the host by trimming, lowercasing,
   removing the port, and removing a leading `www.`.
4. It parses `COMPOZ_TENANT_BY_HOST_JSON` as a host-to-tenant map. Matching
   hosts resolve as `{ kind: "host", tenantId, host }`.
5. If the normalized host ends with `.lvh.me`, the first label is used as the
   tenant id for local development.
6. If the host ends with `.vercel.app`, it returns the fallback tenant with
   `{ kind: "fallback" }`.
7. Any unmatched host returns the fallback tenant from
   `COMPOZ_DEFAULT_TENANT_ID` or `"default"`.

The resolved tenant is then used to read published settings, page index, and
pages through tenant-scoped repositories. Host-based public routes render
unprefixed paths such as `/` and `/<slug>`.

Files involved:

- `apps/site/src/lib/tenant/resolve-site-tenant.ts`
- `apps/site/src/lib/pages/published-page-loaders.ts`
- `apps/site/src/app/(hosted)/layout.tsx`
- `apps/site/src/app/(hosted)/page.tsx`
- `apps/site/src/app/(hosted)/[slug]/page.tsx`
- `apps/site/src/app/manifest.ts`
- `apps/site/src/app/sitemap.ts`
- `apps/site/src/app/robots.ts`

### `/t/[tenantId]` Fallback Routes

The explicit fallback routes do not use host mapping. They take `tenantId` from
the route parameter:

- `/t/[tenantId]` renders the published home page for that tenant.
- `/t/[tenantId]/[slug]` renders the published page for that tenant and
  redirects `home` to `/t/[tenantId]`.
- `/t/[tenantId]/sitemap.xml` emits tenant-prefixed sitemap URLs.
- `/t/[tenantId]/robots.txt` disallows all fallback routes and points to the
  tenant fallback sitemap.

The fallback path is also used by Studio when it cannot rely on a production
host/domain. `getPublishedSiteUrl` returns `publishedBaseUrl` when set;
otherwise it builds `${NEXT_PUBLIC_SITE_ORIGIN}/t/<tenantId>`.

Files involved:

- `apps/site/src/app/t/[tenantId]/layout.tsx`
- `apps/site/src/app/t/[tenantId]/page.tsx`
- `apps/site/src/app/t/[tenantId]/[slug]/page.tsx`
- `apps/site/src/app/t/[tenantId]/sitemap.ts`
- `apps/site/src/app/t/[tenantId]/robots.ts`
- `apps/studio/src/config/siteOrigin.ts`

### Studio Active Tenant

Studio resolves the active tenant from the authenticated session and, for admins
only, an optional active tenant cookie:

1. `apps/studio/src/auth/auth.ts` authenticates with Credentials and stores
   user RBAC in the JWT/session: `role`, `tenantIds`, and `defaultTenantId`.
2. `apps/studio/src/auth/require-session.ts` defines
   `ACTIVE_TENANT_COOKIE = "compoz_active_tenant"`.
3. `getSessionWithTenantOrNull` normalizes `tenantIds` to lower-case.
4. Non-admin users always get `tenantId = defaultTenantId`.
5. Admin users may use the active tenant cookie if it is present and allowed by
   `tenantIds`, or if `tenantIds` contains `"*"`.
6. If the cookie is missing or not allowed, Studio falls back to
   `defaultTenantId`.
7. The dashboard layout passes the resolved tenant id into
   `StudioClientProviders`, which provides `TenantContext` to client hooks.

Files involved:

- `apps/studio/src/auth/auth.ts`
- `apps/studio/src/auth/middleware.ts`
- `apps/studio/src/auth/require-session.ts`
- `apps/studio/src/app/[locale]/(dashboard)/layout.tsx`
- `apps/studio/src/app/[locale]/StudioClientProviders.tsx`
- `apps/studio/src/features/admin/tenant/TenantContext.tsx`

### Active Tenant Cookie

Admins can switch the active Studio tenant through the admin tenant API:

1. `POST /api/admin/tenant/active` requires an admin session.
2. The requested `tenantId` is normalized.
3. The requested tenant must be present in the session `tenantIds`, unless the
   session has wildcard `"*"`.
4. The route sets `compoz_active_tenant` as an httpOnly cookie with `sameSite:
   "lax"`, `path: "/"`, and `secure` in production.
5. Client code calls this API through `tenantStudioApi.setActiveTenant` and
   `useSetActiveTenant`.

Files involved:

- `apps/studio/src/app/api/admin/tenant/active/route.ts`
- `packages/infra/src/http/studio/tenant.client.ts`
- `apps/studio/src/features/admin/tenant/useSetActiveTenant.ts`

### User RBAC and Tenant Resolution

Users are the current source of truth for Studio tenant access. There is no
separate tenant registry used by the admin UI in the inspected code:

- `User.rbac.tenantIds` lists the tenant ids a user may access.
- `User.rbac.defaultTenantId` is the fallback active tenant.
- `tenantIds` may contain `"*"` for global admin access.
- The admin users page builds tenant options from the current session
  `tenantIds`, excluding `"*"`.
- Validation requires `defaultTenantId` to be present in `tenantIds` unless
  wildcard access is present.

Files involved:

- `packages/core/src/domain/users/entities/user.ts`
- `packages/validation/src/users/user.ts`
- `packages/validation/src/users/user-form.ts`
- `packages/validation/src/users/user-intents.ts`
- `packages/infra/src/users/kv-users-repository.ts`
- `apps/studio/src/app/[locale]/(dashboard)/admin/users/page.tsx`
- `apps/studio/src/features/admin/users/sections/AdminUsersSection.tsx`
- `apps/studio/src/features/admin/users/components/forms/AdminUsersForm.tsx`

## Tenant-Scoped Storage

### KV Key Patterns with `tenantId`

| Key pattern | Source | Stores | Scope/classification | Prisma boundary |
| --- | --- | --- | --- | --- |
| `compoz:<tenant>:<state>:pages:<pageId>` | `packages/infra/src/pages/kv-pages-repository.ts` | Page document JSON for draft or published state. Includes page content such as blocks JSON. | Tenant-scoped, draft/published canonical content. | Relational `Page` table with tenant relation and draft/published payload columns or separate state rows. Keep blocks JSON. |
| `compoz:<tenant>:<state>:pagesBySlug:<slug>` | `packages/infra/src/pages/kv-pages-repository.ts` | Slug-to-pageId index. | Tenant-scoped, draft/published derived index. | Replace with unique relational index on `(tenantId, state, slug)` or equivalent. Do not migrate as separate table unless needed for compatibility. |
| `compoz:<tenant>:<state>:pageSlugById:<pageId>` | `packages/infra/src/pages/kv-pages-repository.ts` | PageId-to-slug reverse index. | Tenant-scoped, draft/published derived index. | Derived from `Page.slug`; no separate table needed. |
| `compoz:<tenant>:<state>:site:index` | `packages/infra/src/site/kv-site-repository.ts` | Site/page index for draft or published state. | Tenant-scoped, draft/published canonical/derived navigation/index data. | Store as JSON on tenant/site state or derive from pages, depending on publish semantics. Preserve initially as JSON to reduce migration risk. |
| `compoz:<tenant>:<state>:site:settings` | `packages/infra/src/site/kv-site-repository.ts` | Site settings JSON for draft or published state. | Tenant-scoped, draft/published canonical config. | Store as JSON on a tenant site settings/state table. Normalize only fields needed for lookups such as domain/baseUrl if required. |
| `compoz:<tenant>:status:snapshot` | `packages/infra/src/site/kv-site-status-snapshot.ts` | Site status snapshot. | Tenant-scoped derived cache. | Do not migrate as canonical relational data. Recompute or cache separately. |
| `compoz:<tenant>:statusDetails:version` | `packages/infra/src/site/kv-site-status-snapshot.ts` | Status details version counter. | Tenant-scoped derived cache/version. | Do not migrate as canonical relational data. |
| `compoz:<tenant>:statusDetails:snapshot:v<version>:<scope>:<includeBlocks>:page:<pageId\|all>` | `packages/infra/src/site/kv-site-status-snapshot.ts` | Status details snapshot for page/all pages and optional blocks. | Tenant-scoped derived cache. | Do not migrate as canonical relational data. |
| `compoz:<tenantId>:*` | `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts` | Any tenant-scoped KV data for a demo sandbox. | Tenant-scoped cleanup pattern for `demo-*`. | Replace with relational cascade/delete by tenant id plus object storage cleanup. |
| `compoz:default:*` -> `compoz:demo:*` | `packages/infra/src/scripts/migrate-default-to-demo.ts` | One-off source/target key migration. | Legacy migration script. | Use only for historical context. |
| `compoz:*:draft:pages:*`, `compoz:*:published:pages:*` | `scripts/audit-legacy-card-cells.mjs` | Scan patterns for page audits. | Cross-tenant audit pattern. | Replace with Prisma page queries during migration tooling. |

### Global KV Keys Containing Tenant Data

These keys are not tenant-scoped by key prefix, but their stored values contain
tenant ids and affect tenant resolution/access.

| Key pattern | Source | Stores | Scope/classification | Prisma boundary |
| --- | --- | --- | --- | --- |
| `compoz:studio:users:user:<userId>` | `packages/infra/src/users/kv-users-repository.ts` | User JSON including `rbac.tenantIds`, `rbac.defaultTenantId`, optional demo metadata. | Global user data containing tenant access data. | Relational `User` table plus either JSON RBAC initially or a user-tenant membership table when access control needs querying. |
| `compoz:studio:users:userByEmail:<emailLower>` | `packages/infra/src/users/kv-users-repository.ts` | Email-to-userId index. | Global derived index. | Unique index on `User.email`. |
| `compoz:studio:users:pwd:<userId>` | `packages/infra/src/users/kv-users-repository.ts` | Password hash. | Global auth secret data. | User credential table or auth adapter storage, depending on auth migration scope. |
| `compoz:studio:demo:sandbox:<demoInstanceId>` | `packages/infra/src/demo/kv-demo-sandbox-repository.ts` | Demo sandbox record including sandbox tenant id, user id, expiry, created time. | Global demo lifecycle data pointing to a tenant id. | Relational demo sandbox table if demo lifecycle remains database-backed. |

### Blob/Object Storage Paths with `tenantId`

| Path pattern | Source | Stores | Scope/classification | Prisma boundary |
| --- | --- | --- | --- | --- |
| `tenants/<tenantId>/_tmp/media/<yyyy>/<mm>/<filename>` | `apps/studio/src/app/api/media/upload/image/prepare/route.ts`, `apps/studio/src/app/api/media/upload/image/client/route.ts` | Temporary direct-upload image object path. The client-token route verifies that the temp key starts with the current tenant prefix. | Tenant-scoped temporary object storage. | Remain object storage. Optional media metadata table can track committed assets, but temp objects should not become relational domain data. |
| `tenants/<tenantId>/<yyyy>/<mm>/<filename>` | `apps/studio/src/app/api/media/upload/svg/route.ts` | Tenant-scoped SVG/logo upload object path. | Tenant-scoped object storage. | Remain object storage. Store metadata only if assets need listing, cleanup, ownership, or usage tracking. |
| `/uploads/<key>` for local storage | `packages/infra/src/media/storage/local-media-storage.ts`, `apps/site/src/app/uploads/[...path]/route.ts` | Local public URL for object key, including tenant-prefixed keys when provided. | Infrastructure/local development storage. | Keep as object storage/public file serving concern. |

The inspected code does not show a canonical media asset registry table or a
reliable media usage index. Media URLs appear to be persisted inside settings or
page content payloads. During migration, treat media usage as embedded JSON
references unless a current source of truth is found elsewhere.

## Prisma Migration Recommendations

### Move to Prisma

#### `Tenant`

Create a `Tenant` table as the canonical tenant registry. Fields should be based
only on current usage:

- `id`: stable tenant id string, lower-case, currently values such as
  `default`, `demo`, `portfolio`, `lola`, `renaud`, and generated `demo-*`.
- `createdAt`: useful for operational lifecycle and demo cleanup.
- `updatedAt`: useful for admin changes and migration tracking.
- `kind` or `isDemo`: only if needed to preserve the current `demo` seed and
  `demo-*` sandbox distinction. Current code relies on string prefixes, so this
  can also remain derived initially.
- `expiresAt`: only for demo sandbox tenants if demo cleanup moves from KV to
  Prisma. Otherwise keep expiry on a separate demo sandbox record.

Do not add billing, plan, subscription, or product entitlement fields. They are
not present in the current codebase.

#### `TenantDomain`

Create a `TenantDomain` table for production host resolution currently stored in
`COMPOZ_TENANT_BY_HOST_JSON`.

Fields based on current usage:

- `id`: generated id.
- `tenantId`: foreign key to `Tenant.id`.
- `host`: normalized host without port and without leading `www.`.
- `rawHost` or `displayHost`: optional, only if preserving the entered value is
  useful for admin display. Runtime lookup should use normalized `host`.
- `isPrimary`: optional, useful if the public URL should prefer one domain.
  Current code does not require it, so it can be deferred.
- `createdAt`, `updatedAt`.

Recommended lookup behavior:

- Normalize incoming hosts exactly like `resolveTenantFromHost`.
- Look up `TenantDomain.host`.
- Keep `.lvh.me` resolution as dev-only fallback.
- Keep `COMPOZ_DEFAULT_TENANT_ID` as final infrastructure fallback until all
  environments have explicit domains.

#### Tenant-Scoped Site Settings and Pages

Current tenant-scoped settings/pages should move to Prisma-backed repositories,
but nested builder content should remain JSON:

- Pages: relational identity and lookup fields such as `tenantId`, `state`,
  `pageId`, `slug`, timestamps/status where present; page content and blocks as
  JSON.
- Site settings: tenant id and state as relational keys; settings payload as
  JSON.
- Site index: preserve as JSON initially if publish behavior depends on exact
  persisted shape.

This follows the current architecture where blocks, rows, columns, and cells are
nested builder payloads. There is no strong current reason to normalize them.

#### Users and Tenant Access

Users already carry tenant access in `rbac.tenantIds` and `defaultTenantId`.
For an initial migration:

- Move users to Prisma if auth/users are in migration scope.
- Preserve RBAC validation with the existing Zod schemas after reading from
  Prisma.
- Either keep `tenantIds` as JSON initially or introduce a user-tenant
  membership table if admin querying/filtering needs it.

Wildcard `"*"` access must be preserved.

### Keep in Environment Variables

Keep these as env/runtime config:

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
- repository implementation flags during migration
- KV/Upstash env vars until KV is fully retired

### Keep Static or Dev-Only

Keep these static unless/until there is an explicit product requirement to edit
them from Studio:

- `.lvh.me` local tenant mapping behavior.
- `*.vercel.app` fallback behavior.
- Tenant skin mappings and skin CSS files.
- Tenant runtime feature flags such as `lola`'s `autoHideSingleH1Block`.
- Demo seed constants and demo sandbox id naming, unless demo management moves
  fully into database records.

### Do Not Normalize Yet

Do not normalize these during the first Prisma migration:

- Blocks, rows, columns, and cells inside page content.
- Site settings subsections that are only read/write as whole JSON payloads.
- Site index if exact draft/published synchronization semantics depend on the
  current payload.
- Media references embedded in page/settings JSON.
- Status snapshots and status details caches.

The migration should first preserve behavior and lookup semantics. Normalization
can follow only where there is a demonstrated query, integrity, or editing need.

## Risks and Migration Notes

### Host Resolution Drift

Domain lookup must preserve current normalization:

- lower-case host
- trim whitespace
- strip port
- strip leading `www.`

If Prisma domain rows store unnormalized hosts, production host resolution can
silently fall back to `COMPOZ_DEFAULT_TENANT_ID` and serve the wrong tenant.

### Missing Tenant Sources of Truth

Tenant ids are currently present in several places:

- host mapping env
- user RBAC
- KV key prefixes
- demo sandbox records
- skin mappings
- Google verification mapping
- media object paths
- public settings `seo.baseUrl`

A migration that only reads KV page/settings prefixes will miss Studio access,
domain resolution, demo cleanup, and tenant-specific presentation behavior.

### Draft/Published Synchronization

Pages and site settings are stored separately for `draft` and `published`.
Publish copies between states and then revalidates public routes. A Prisma model
must preserve state separation and publish copy semantics before attempting to
derive published data from draft data.

Files involved:

- `apps/studio/src/app/api/site/publish/route.ts`
- `packages/core/src/domain/site/use-cases/publish/publish-site.ts`
- `packages/infra/src/pages/kv-pages-repository.ts`
- `packages/infra/src/site/kv-site-repository.ts`
- `apps/site/src/app/api/revalidate/route.ts`

### Publish and Revalidation

Publish revalidates both host-based public routes and fallback `/t/[tenantId]`
routes. Domain migration must not remove fallback revalidation until host-based
domains are fully reliable in every environment.

### Demo Tenant Cleanup

Demo cleanup currently relies on the `demo-*` prefix and KV key scans. In
Prisma, cleanup should delete demo sandbox rows, demo users, tenant-scoped page
and settings rows, and related derived/cache rows. Object storage cleanup needs
explicit handling for `tenants/demo-*` paths.

### Rollback Strategy

Recommended rollback approach:

1. Keep KV data intact until Prisma has been verified in production.
2. Use repository flags or a controlled adapter switch to route reads/writes.
3. During dual-write, write Prisma and KV from the same domain objects.
4. Keep Zod validation after Prisma reads to detect shape drift early.
5. Roll back by switching repositories back to KV if Prisma validation or host
   resolution differs.

### Zod Validation After Prisma Reads

The current KV repositories parse persisted JSON with validation schemas before
returning domain objects. Prisma repositories should keep the same boundary:

- Parse page payloads, settings payloads, users, demo sandbox records, and RBAC
  with existing Zod schemas.
- Treat validation failures as migration/data-quality issues, not as shape
  changes to silently coerce.
- Preserve legacy-shape repair/migration scripts separately from runtime reads.

## Inspected Files

- `.env.local` (variable names only; values intentionally omitted)
- `apps/site/src/app/(hosted)/[slug]/page.tsx`
- `apps/site/src/app/(hosted)/layout.tsx`
- `apps/site/src/app/(hosted)/page.tsx`
- `apps/site/src/app/api/revalidate/route.ts`
- `apps/site/src/app/manifest.ts`
- `apps/site/src/app/robots.ts`
- `apps/site/src/app/sitemap.ts`
- `apps/site/src/app/t/[tenantId]/[slug]/page.tsx`
- `apps/site/src/app/t/[tenantId]/layout.tsx`
- `apps/site/src/app/t/[tenantId]/page.tsx`
- `apps/site/src/app/t/[tenantId]/robots.ts`
- `apps/site/src/app/t/[tenantId]/sitemap.ts`
- `apps/site/src/app/uploads/[...path]/route.ts`
- `apps/site/src/lib/pages/published-page-loaders.ts`
- `apps/site/src/lib/seo/resolveSiteBaseUrl.ts`
- `apps/site/src/lib/tenant/resolve-site-tenant.ts`
- `apps/site/public/site-skins/portfolio/custom.css`
- `apps/site/public/site-skins/renaud/custom.css`
- `apps/studio/public/site-skins/portfolio/custom.css`
- `apps/studio/public/site-skins/renaud/custom.css`
- `apps/studio/scripts/seed-admin.ts`
- `apps/studio/src/app/[locale]/(dashboard)/admin/users/page.tsx`
- `apps/studio/src/app/[locale]/(dashboard)/layout.tsx`
- `apps/studio/src/app/[locale]/StudioClientProviders.tsx`
- `apps/studio/src/app/api/admin/tenant/active/route.ts`
- `apps/studio/src/app/api/internal/demo/cleanup/route.ts`
- `apps/studio/src/app/api/media/upload/image/client/route.ts`
- `apps/studio/src/app/api/media/upload/image/prepare/route.ts`
- `apps/studio/src/app/api/media/upload/svg/route.ts`
- `apps/studio/src/app/api/settings/footer/route.ts`
- `apps/studio/src/app/api/settings/header/route.ts`
- `apps/studio/src/app/api/settings/identity/route.ts`
- `apps/studio/src/app/api/settings/legal-menu/route.ts`
- `apps/studio/src/app/api/settings/primary-menu/route.ts`
- `apps/studio/src/app/api/settings/seo/route.ts`
- `apps/studio/src/app/api/settings/social/route.ts`
- `apps/studio/src/app/api/settings/theme/route.ts`
- `apps/studio/src/app/api/site/publish/route.ts`
- `apps/studio/src/auth/auth.ts`
- `apps/studio/src/auth/demo-auth.ts`
- `apps/studio/src/auth/middleware.ts`
- `apps/studio/src/auth/require-session.ts`
- `apps/studio/src/config/siteOrigin.ts`
- `apps/studio/src/features/admin/tenant/TenantContext.tsx`
- `apps/studio/src/features/admin/tenant/useSetActiveTenant.ts`
- `apps/studio/src/features/admin/users/components/forms/AdminUsersForm.tsx`
- `apps/studio/src/features/admin/users/sections/AdminUsersSection.tsx`
- `apps/studio/src/lib/config/uploads.ts`
- `apps/studio/src/lib/demo/start-demo-sandbox.ts`
- `packages/core/src/constants/demo/demo.ts`
- `packages/core/src/domain/demo/use-cases/create-demo-sandbox-from-seed.ts`
- `packages/core/src/domain/site/use-cases/publish/publish-site.ts`
- `packages/core/src/domain/users/entities/user.ts`
- `packages/infra/src/demo/kv-demo-sandbox-cloner.ts`
- `packages/infra/src/demo/kv-demo-sandbox-repository.ts`
- `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts`
- `packages/infra/src/demo/kv-demo-seed-reader.ts`
- `packages/infra/src/http/studio/tenant.client.ts`
- `packages/infra/src/kv/kv-redis.ts`
- `packages/infra/src/kv/kv-telemetry.ts`
- `packages/infra/src/lib/normalize-tenant-id.ts`
- `packages/infra/src/media/storage/blob-media-storage.ts`
- `packages/infra/src/media/storage/index.ts`
- `packages/infra/src/media/storage/local-media-storage.ts`
- `packages/infra/src/media/storage/media-storage.ts`
- `packages/infra/src/pages/index.ts`
- `packages/infra/src/pages/kv-pages-repository.ts`
- `packages/infra/src/scripts/migrate-default-to-demo.ts`
- `packages/infra/src/site/index.ts`
- `packages/infra/src/site/kv-site-repository.ts`
- `packages/infra/src/site/kv-site-status-snapshot.ts`
- `packages/infra/src/users/kv-users-repository.ts`
- `packages/ui/src/lib/tenant-id.ts`
- `packages/ui/src/site/skins/resolveSiteRuntimeFeatures.ts`
- `packages/ui/src/site/skins/resolveSiteUi.ts`
- `packages/validation/src/users/user-form.ts`
- `packages/validation/src/users/user-intents.ts`
- `packages/validation/src/users/user.ts`
- `scripts/audit-legacy-card-cells.mjs`
