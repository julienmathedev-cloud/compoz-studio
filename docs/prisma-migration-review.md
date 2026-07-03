# Prisma Migration Review — Compoz

## Résumé exécutif

- État général de la migration : les repositories principaux `SiteRepository`, `PagesRepository` et `UsersRepository` ont bien une factory runtime avec sélection `kv` / `prisma` / `memory`. Les routes publiques, loaders Studio, routes API settings/pages/publish/status et routes admin users passent majoritairement par ces factories.
- On peut tester localement avec Prisma pour les données principales en configurant `SITE_REPO_IMPL=prisma`, `PAGES_REPO_IMPL=prisma`, `USERS_REPO_IMPL=prisma`, avec une base PostgreSQL migrée et seedée.
- Les images ne sont pas concernées par la migration : elles restent sous forme d'URL dans les JSON de pages/settings.
- Le blocage principal avant bascule complète est l'incohérence entre la volonté produit "pas de wildcard `*`" et le code qui accepte encore `tenantIds: ["*"]` côté validation/session. En Prisma, `PrismaUsersRepository` ne modélise plus le wildcard : les accès sont relationnels via `WebsiteAccess`.
- Le host resolver public reste env-based (`COMPOZ_TENANT_BY_HOST_JSON`) malgré l'existence de `WebsiteDomain` en Prisma. Ce n'est bloquant que si l'objectif de bascule inclut la résolution par domaines depuis PostgreSQL.
- La demo sandbox reste volontairement KV et ne doit pas bloquer la bascule des vrais sites/users.
- Les snapshots de statut restent volontairement KV via `SiteStatusCachePort`. C'est acceptable si on les traite comme cache/read-model invalidable.

## HIGH — À corriger avant bascule Prisma

### 1. Wildcard `tenantIds: ["*"]` encore accepté par le domaine/session

- Fichier(s)
  - `packages/core/src/domain/users/entities/user.ts`
  - `packages/validation/src/users/user.ts`
  - `apps/studio/src/auth/require-session.ts`
  - `packages/infra/src/users/prisma-users-repository.ts`
  - `scripts/migrate-auth-access-domains-to-prisma.mjs`
- Problème
  - Le domaine et la validation documentent/acceptent encore `tenantIds` contenant `"*"`.
  - `require-session.ts` donne encore un accès admin au tenant actif si `tenantIds.includes("*")`.
  - `PrismaUsersRepository.create()` / `put()` transforme `rbac.tenantIds` en lignes `WebsiteAccess` sans traitement spécial du wildcard. Un user contenant `"*"` tenterait donc de créer un accès vers `websiteId="*"`, ce qui échoue en Prisma sauf si un Website `"*"` existe.
  - Le script `migrate-auth-access-domains-to-prisma.mjs` compense le wildcard en le remplaçant par tous les websites non sandbox. Cette logique n'existe pas dans le repository runtime.
- Pourquoi c'est bloquant
  - Le comportement souhaité est explicitement : pas de wildcard `*`.
  - Tant que l'API admin et l'auth l'acceptent encore, on peut créer ou conserver un état impossible à écrire proprement dans Prisma.
  - C'est un risque runtime direct pour `USERS_REPO_IMPL=prisma`, surtout sur `create-user` / `update-user`.
- Correction recommandée minimale
  - Interdire `"*"` dans `TenantIdSchema` ou dans `assertUserRbac`.
  - Retirer le chemin `hasWildcard` dans `getSessionWithTenantOrNull`.
  - Vérifier/migrer les users existants pour remplacer les wildcards par les vrais `WebsiteAccess` avant activation de `USERS_REPO_IMPL=prisma`.
  - Garder la logique de migration wildcard uniquement dans le script de migration, pas dans le runtime.

### 2. Seed admin Studio encore forcé sur KV

- Fichier(s)
  - `apps/studio/scripts/seed-admin.ts`
  - `apps/studio/package.json`
- Problème
  - `seed-admin.ts` importe directement `KvUsersRepository` et ignore `getUsersRepository()`.
  - En environnement Prisma, `pnpm --filter @compoz/studio seed:admin` seedera KV, pas PostgreSQL.
- Pourquoi c'est bloquant
  - Pour tester localement `USERS_REPO_IMPL=prisma`, le compte admin peut ne pas exister dans PostgreSQL même si le script annonce un seed réussi.
  - Cela peut faire croire que l'auth Prisma est cassée alors que le seed a écrit dans le mauvais backend.
- Correction recommandée minimale
  - Ajouter un seed Prisma explicite ou faire passer le seed admin par `getUsersRepository()`.
  - Si le seed reste legacy KV, documenter qu'il ne doit plus être utilisé pour un test Prisma.

## MEDIUM — À corriger bientôt

### 1. Résolution de domaines publique encore env-based

- Fichier(s)
  - `apps/site/src/lib/tenant/resolve-site-tenant.ts`
  - `apps/site/src/lib/pages/published-page-loaders.ts`
  - `apps/site/src/app/sitemap.ts`
  - `apps/site/src/app/robots.ts`
  - `packages/infra/prisma/schema.prisma`
  - `scripts/migrate-auth-access-domains-to-prisma.mjs`
- Problème
  - `WebsiteDomain` existe dans le schéma Prisma et le script de migration sait l'alimenter.
  - Le runtime public ne lit pas `WebsiteDomain`. Il résout encore le tenant via `COMPOZ_TENANT_BY_HOST_JSON`, `*.lvh.me`, puis fallback `COMPOZ_DEFAULT_TENANT_ID`.
- Impact
  - Avec `SITE_REPO_IMPL=prisma` / `PAGES_REPO_IMPL=prisma`, les contenus viennent de Prisma, mais le choix du `Website.id` reste piloté par env.
  - Ajouter/modifier un domaine en base ne change pas le rendu public tant que l'env JSON n'est pas aligné.
- Correction recommandée minimale
  - Garder l'env JSON pour le test local court terme.
  - Prévoir un resolver Prisma `host -> Website.id` avant bascule domaine réelle en production.

### 2. `PrismaUsersRepository.putMany()` ne crée pas les users manquants

- Fichier(s)
  - `packages/infra/src/users/prisma-users-repository.ts`
  - `packages/core/src/domain/users/ports/users-repository.ts`
- Problème
  - Le port `UsersRepository.putMany()` existe.
  - En KV, `putMany()` écrit les docs users même s'ils n'existent pas.
  - En Prisma, `putMany()` boucle sur `put()`, et `put()` lève si le user est absent.
- Impact
  - Ce n'est pas bloquant pour les routes admin actuelles si elles utilisent `create()` pour créer et `put()` pour mettre à jour.
  - C'est un écart de comportement important pour scripts/tests/outils qui s'attendraient à un upsert.
- Correction recommandée minimale
  - Clarifier le contrat du port : `put()` update-only ou upsert.
  - Si le contrat attendu reste l'upsert, adapter `PrismaUsersRepository.put()` / `putMany()` ou éviter ces méthodes dans les scripts de migration.

### 3. Factories `@compoz/infra/site` et `@compoz/infra/pages` utilisées sans export package explicite

- Fichier(s)
  - `packages/infra/package.json`
  - `packages/infra/src/site/index.ts`
  - `packages/infra/src/pages/index.ts`
  - usages dans `apps/site` et `apps/studio`
- Problème
  - Les imports runtime utilisent `@compoz/infra/site` et `@compoz/infra/pages`.
  - `package.json` expose explicitement plusieurs sous-chemins, mais pas `./site` ni `./pages`.
  - Le monorepo compile probablement grâce aux `paths` TypeScript (`@compoz/infra/* -> packages/infra/src/*`), mais le boundary package n'est pas cohérent.
- Impact
  - Risque si les apps sont résolues strictement via `exports` package au build/runtime.
  - Ce n'est pas un problème Prisma métier, mais c'est une fragilité de packaging autour des factories critiques.
- Correction recommandée minimale
  - Ajouter `./site` et `./pages` aux exports de `@compoz/infra/package.json`, comme `./users`.

### 4. Host resolver et migration domains peuvent diverger sur la source de vérité

- Fichier(s)
  - `apps/site/src/lib/tenant/resolve-site-tenant.ts`
  - `scripts/migrate-auth-access-domains-to-prisma.mjs`
- Problème
  - Le script migre `COMPOZ_TENANT_BY_HOST_JSON` vers `WebsiteDomain`.
  - Le runtime continue à lire `COMPOZ_TENANT_BY_HOST_JSON`.
- Impact
  - Après migration, deux sources peuvent diverger : env JSON et table `WebsiteDomain`.
- Correction recommandée minimale
  - Pendant la phase de test, garder un seul mapping source et vérifier que les lignes Prisma correspondent.
  - Avant bascule domaine, choisir et documenter la source runtime.

## REVIEW — Décisions à prendre

### 1. Source runtime des domaines publics

- Sujet
  - Résolution `host -> Website.id`.
- Situation actuelle
  - Runtime public : env/host-based.
  - Prisma : table `WebsiteDomain` présente et script de migration disponible.
- Options possibles
  - Court terme : garder `COMPOZ_TENANT_BY_HOST_JSON` comme source runtime.
  - Moyen terme : créer un resolver Prisma et utiliser `WebsiteDomain`.
  - Mixte temporaire : Prisma d'abord, fallback env/dev `lvh.me`.
- Recommandation simple
  - Pour tester Prisma localement : garder env JSON.
  - Pour une bascule production propre : passer `WebsiteDomain` en source runtime, avec fallback dev explicite.

### 2. Demo sandbox KV ou Prisma

- Sujet
  - Création sandbox, clonage seed, cleanup, user demo, tenant demo.
- Situation actuelle
  - `apps/studio/src/lib/demo/start-demo-sandbox.ts` instancie directement `KvUsersRepository`, `KvDemoSandboxRepository`, `KvDemoSeedReader`, `KvDemoSandboxCloner`.
  - `apps/studio/src/lib/demo/cleanup-expired-demo-sandboxes.ts` instancie directement `KvDemoSandboxRepository`, `KvUsersRepository`, `KvDemoSandboxTenantCleaner`.
  - `packages/infra/src/demo/kv-demo-seed-reader.ts` lit le seed via `KvSiteRepository`.
  - `packages/infra/src/demo/kv-demo-sandbox-cloner.ts` clone via `KvSiteRepository` et `KvPagesRepository`.
  - `packages/infra/src/demo/kv-demo-sandbox-tenant-cleaner.ts` supprime uniquement des tenants demo KV.
- Options possibles
  - Garder la demo sandbox en KV pendant la migration principale.
  - Migrer la demo sandbox vers Prisma plus tard, avec repositories dédiés.
- Recommandation simple
  - Ne pas considérer la demo sandbox comme bloquante pour les vrais sites/users.
  - Si la demo doit fonctionner avec Prisma, créer des implémentations Prisma dédiées pour seed reader, cloner, sandbox repository et cleaner.

### 3. Snapshots de statut en KV

- Sujet
  - `SiteStatusCachePort`.
- Situation actuelle
  - `getSiteStatusCache()` retourne toujours `KvSiteStatusSnapshot`, même avec `SITE_REPO_IMPL=prisma`.
  - Le commentaire dans `packages/infra/src/site/index.ts` indique que c'est volontaire pour la première phase.
- Options possibles
  - Garder KV comme cache invalidable.
  - Migrer les snapshots vers Prisma si besoin d'un full PostgreSQL.
  - Désactiver les snapshots en local Prisma si Upstash n'est pas disponible.
- Recommandation simple
  - Garder KV pour la bascule initiale. Ce n'est pas bloquant si les snapshots restent des caches/read-models invalidables.

### 4. Sémantique de `tenantId`

- Sujet
  - Les anciens `tenantId` correspondent maintenant aux `Website.id`.
- Situation actuelle
  - Le code garde le nom historique `tenantId` dans les routes, sessions, factories et helpers.
  - Les repositories Prisma normalisent `tenantId` en `websiteId`.
- Options possibles
  - Garder le vocabulaire `tenantId` côté domaine/app.
  - Renommer progressivement vers `websiteId`.
- Recommandation simple
  - Ne pas renommer partout maintenant. Signaler seulement dans les docs que `tenantId === Website.id` pendant la migration.

## INFO — Points non bloquants

- `PrismaSiteRepository`, `PrismaPagesRepository` et `PrismaUsersRepository` existent.
- Les factories supportent bien `memory`, `kv`, `prisma`, avec fallback `kv` sur valeur inconnue.
- Les pages publiques host-based et fallback `/t/[tenantId]` passent par les loaders/factories.
- Les loaders draft Studio passent par les factories.
- Les routes API settings/pages/publish/status utilisent `getSiteRepository()`, `getPagesRepository()` et `getSiteStatusCache()`.
- L'auth Studio utilise `getUsersRepository()`.
- Les routes admin users utilisent `getUsersRepository()`.
- Les mappers Prisma/domain sont présents pour pages et site settings/index.
- Les images restent dans les JSON, donc pas de migration Blob requise.
- `scripts/migrate-kv-to-prisma.mjs` est utile pour migrer site/pages/settings par tenant.
- `scripts/migrate-auth-access-domains-to-prisma.mjs` est utile pour users, access rows et domains.
- `scripts/audit-prisma-switch-readiness.mjs` reste utile comme audit statique rapide.
- `packages/infra/src/scripts/backup-upstash-local.ts` reste utile pour sauvegarde KV.
- `packages/infra/src/scripts/migrate-default-to-demo.ts` et `apps/studio/scripts/seed-admin.ts` sont legacy/KV-oriented pour cette migration.

## Vérification par zone

### Repositories / factories

- `getSiteRepository()` est défini dans `packages/infra/src/site/index.ts`.
  - `SITE_REPO_IMPL=memory` -> `InMemorySiteRepository`.
  - `SITE_REPO_IMPL=kv` -> `KvSiteRepository`.
  - `SITE_REPO_IMPL=prisma` -> `PrismaSiteRepository`.
  - Cache par implémentation et tenant, sauf memory global.
- `getPagesRepository()` est défini dans `packages/infra/src/pages/index.ts`.
  - `PAGES_REPO_IMPL=memory` -> `InMemoryPagesRepository`.
  - `PAGES_REPO_IMPL=kv` -> `KvPagesRepository`.
  - `PAGES_REPO_IMPL=prisma` -> `PrismaPagesRepository`.
  - Cache par implémentation et tenant.
- `getUsersRepository()` est défini dans `packages/infra/src/users/index.ts`.
  - `USERS_REPO_IMPL=memory` -> `InMemoryUsersRepository`.
  - `USERS_REPO_IMPL=kv` -> `KvUsersRepository`.
  - `USERS_REPO_IMPL=prisma` -> `PrismaUsersRepository`.
  - Singleton recréé si l'implémentation change.
- Instanciations directes KV restantes :
  - Factories infra : normal.
  - Scripts migration : normal.
  - Demo sandbox : volontairement KV.
  - `apps/studio/scripts/seed-admin.ts` : point bloquant pour seed Prisma.

### Auth / Users

- `apps/studio/src/auth/auth.ts` utilise bien `getUsersRepository()` pour `readByEmail()` et `verifyPassword()`.
- `apps/studio/src/app/api/admin/users/route.ts` utilise `getUsersRepository()` pour list/create.
- `apps/studio/src/app/api/admin/users/[userId]/route.ts` utilise `getUsersRepository()` pour read/update/delete.
- `PrismaUsersRepository.put()` est cohérent avec le use-case `update-user` si le user existe déjà : `update-user` lit d'abord `readById()` puis appelle `put(next)`.
- Le risque `put()` concerne les usages hors `update-user`, notamment `putMany()` ou scripts qui attendraient un upsert.
- Les users demo/sandbox restent volontairement en KV dans les flows demo actuels.
- Le wildcard `*` reste supporté dans validation/session et doit être supprimé pour le comportement souhaité.

### Site / Pages

- Public host-based :
  - `apps/site/src/app/(hosted)/page.tsx`
  - `apps/site/src/app/(hosted)/[slug]/page.tsx`
  - passent par `published-page-loaders.ts`, puis par `getSiteRepository()` / `getPagesRepository()`.
- Fallback `/t/[tenantId]` :
  - `apps/site/src/app/t/[tenantId]/page.tsx`
  - `apps/site/src/app/t/[tenantId]/[slug]/page.tsx`
  - passe aussi par les loaders/factories.
- Sitemap/robots :
  - `apps/site/src/app/sitemap.ts`
  - `apps/site/src/app/t/[tenantId]/sitemap.ts`
  - `apps/site/src/app/robots.ts`
  - `apps/site/src/app/t/[tenantId]/robots.ts`
  - utilisent les repositories configurables.
- Draft loaders Studio :
  - `apps/studio/src/lib/pages/draft-page-loaders.ts` utilise `getSiteRepository()` / `getPagesRepository()`.
- `tenantId` reste un nom historique, mais les repositories Prisma l'interprètent comme `websiteId`. Pas de risque runtime direct tant que les valeurs migrées correspondent aux `Website.id`.

### Domaines / host resolver

- Résolution actuelle :
  - `COMPOZ_TENANT_BY_HOST_JSON`
  - `*.lvh.me`
  - fallback `COMPOZ_DEFAULT_TENANT_ID` ou `"default"`
- `WebsiteDomain` existe dans Prisma et le script `migrate-auth-access-domains-to-prisma.mjs` sait l'alimenter.
- Le runtime public ne lit pas `WebsiteDomain`.
- Conclusion : résolution domaine actuellement mixte dans le projet, mais env-based côté runtime. Prisma-based côté modèle/migration seulement.
- Bloquant uniquement si la bascule Prisma attend que les domaines soient pilotés depuis PostgreSQL.

### Demo sandbox

- Création sandbox :
  - `apps/studio/src/lib/demo/start-demo-sandbox.ts`
  - KV users + KV sandbox repository + KV seed reader + KV cloner.
- Cleanup sandbox :
  - `apps/studio/src/lib/demo/cleanup-expired-demo-sandboxes.ts`
  - KV sandbox repository + KV users + KV tenant cleaner.
- Seed/clonage :
  - `packages/infra/src/demo/kv-demo-seed-reader.ts`
  - `packages/infra/src/demo/kv-demo-sandbox-cloner.ts`
  - direct KV site/pages.
- Conclusion : la demo sandbox reste volontairement KV.
- À migrer seulement si la demo doit utiliser Prisma aussi :
  - un `PrismaDemoSandboxRepository`,
  - un seed reader Prisma,
  - un cloner Prisma site/pages,
  - un cleaner Prisma sandbox-safe,
  - une stratégie pour users demo dans PostgreSQL.

### Snapshots / cache

- Port : `packages/core/src/domain/site/ports/site-status-cache-port.ts`.
- Factory : `packages/infra/src/site/index.ts`.
- Implémentation : `packages/infra/src/site/kv-site-status-snapshot.ts`.
- Les snapshots restent KV même avec `SITE_REPO_IMPL=prisma`.
- Acceptable pour la bascule principale si ce sont uniquement des caches/read-models invalidables.

### Scripts

- Utiles pour migration/test Prisma :
  - `scripts/migrate-kv-to-prisma.mjs`
  - `scripts/migrate-auth-access-domains-to-prisma.mjs`
  - `scripts/audit-prisma-switch-readiness.mjs`
  - `packages/infra` scripts `db:validate`, `db:generate`, `db:migrate:dev`, `db:studio`
- Utiles comme support/backup :
  - `packages/infra/src/scripts/backup-upstash-local.ts`
- Legacy / migration only :
  - `packages/infra/src/scripts/migrate-default-to-demo.ts`
  - `apps/studio/scripts/seed-admin.ts` pour KV admin seed.
- Aucun script à supprimer maintenant.

### Exports / package boundaries

- `@compoz/infra/users` est exposé dans `packages/infra/package.json`.
- `@compoz/infra/site` et `@compoz/infra/pages` sont utilisés partout mais ne sont pas exposés explicitement comme `./site` et `./pages`.
- Grâce aux paths TS, cela peut fonctionner en monorepo, mais les exports package sont incohérents avec les imports runtime critiques.
- Correction minimale : ajouter les sous-chemins `./site` et `./pages`.

## Plan d'action minimal recommandé

1. Valider la base Prisma :
   - `pnpm --filter @compoz/infra db:validate`
   - `pnpm --filter @compoz/infra db:generate`
   - `pnpm --filter @compoz/infra db:migrate:dev`
2. Migrer un vrai tenant site/pages/settings avec `scripts/migrate-kv-to-prisma.mjs` en `--dry-run`, puis `--apply --verify`.
3. Migrer users/access/domains avec `scripts/migrate-auth-access-domains-to-prisma.mjs` en `--dry-run`, puis `--apply --verify`.
4. Vérifier qu'aucun user réel restant ne dépend de `tenantIds: ["*"]`.
5. Corriger le seed admin ou créer l'admin directement dans Prisma.
6. Lancer Studio/Site avec :
   - `SITE_REPO_IMPL=prisma`
   - `PAGES_REPO_IMPL=prisma`
   - `USERS_REPO_IMPL=prisma`
   - `COMPOZ_TENANT_BY_HOST_JSON` encore aligné pour le test local.
7. Tester manuellement :
   - login Studio,
   - lecture settings,
   - création/update page,
   - publish,
   - rendu public host-based,
   - rendu public `/t/[tenantId]`,
   - sitemap/robots.
8. Ne pas inclure la demo sandbox dans le critère de go/no-go Prisma initial.

## Commandes de test recommandées

```bash
pnpm --filter @compoz/infra db:validate
pnpm --filter @compoz/infra db:generate
pnpm --filter @compoz/infra db:migrate:dev
```

```bash
node scripts/migrate-kv-to-prisma.mjs --tenant default --dry-run
node scripts/migrate-kv-to-prisma.mjs --tenant default --apply --verify
```

```bash
node scripts/migrate-auth-access-domains-to-prisma.mjs --dry-run
node scripts/migrate-auth-access-domains-to-prisma.mjs --apply --verify
```

```bash
SITE_REPO_IMPL=prisma PAGES_REPO_IMPL=prisma USERS_REPO_IMPL=prisma pnpm --filter @compoz/studio build
SITE_REPO_IMPL=prisma PAGES_REPO_IMPL=prisma USERS_REPO_IMPL=prisma pnpm --filter @compoz/site build
```

