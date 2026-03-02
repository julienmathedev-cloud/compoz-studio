/**
 * @file packages/core/src/domain/pages/use-cases/create-page.ts
 * @layer core/domain
 * @description
 * Use-case de création d’une page (slug/titre) avec métadonnées et configuration sitemap.
 * Génère un slug unique et applique les défauts métier côté domaine.
 */

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  CreatePageDeps,
  CreatePageInput,
  CreatePageResult,
} from "@compoz/core/domain/pages/use-cases/create-page.types";
import {
  applySitemapDefaults,
  assertPageSlug,
  assertPaginationEnabled,
  assertParentId,
  assertPriority,
  assertTitleRequired,
} from "@compoz/core/domain/pages/validators/pages";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

export function createPage({
  pages,
  idGenerator,
  nowIso = () => new Date().toISOString(),
}: CreatePageDeps) {
  return async function run(input: CreatePageInput): Promise<CreatePageResult> {
    const title = assertTitleRequired(input.title);

    const rawSlug =
      typeof input.slug === "string" ? input.slug.trim() : undefined;

    const parentId = assertParentId(input.parentId);

    const paginationEnabled =
      parentId === null
        ? false
        : assertPaginationEnabled({
            parentId,
            paginationEnabled: input.paginationEnabled,
            path: ["paginationEnabled"],
          });

    const base = assertPageSlug(
      rawSlug && rawSlug.length > 0 ? rawSlug : title,
    );

    // Règle "home" : si "home" existe déjà, on bloque (plutôt que suffixer).
    // ✅ Optimisation : si existingSlugs est fourni, pas de repo call.
    const hasHome =
      input.existingSlugs instanceof Set
        ? input.existingSlugs.has("home")
        : await pages.existsBySlug(WRITE_CONTENT_STATE, "home");

    if (base === "home" && hasHome) {
      throw new DomainError({
        code: EC.PAGE_SLUG_CONFLICT,
        message: EC.PAGE_SLUG_CONFLICT,
      });
    }

    const slug = await generateUniqueSlug({
      pages,
      state: WRITE_CONTENT_STATE,
      base,
      existingSlugs: input.existingSlugs,
    });

    const sitemap =
      input.sitemap != null ? applySitemapDefaults(input.sitemap) : undefined;

    if (sitemap) assertPriority(sitemap.priority);

    const page = buildPageEntity({
      id: idGenerator.nextId(),
      parentId,
      slug,
      title,
      sitemap,
      paginationEnabled,
      nowIso,
    });

    await pages.ensureBase();
    await pages.put(WRITE_CONTENT_STATE, page);

    return { page };
  };
}

/* -------------------------------------------------------------------------- */
/*                               Inline helpers                               */
/* -------------------------------------------------------------------------- */

type GenerateUniqueSlugProps = {
  pages: CreatePageDeps["pages"];
  state: ContentState;
  base: string;
  existingSlugs?: ReadonlySet<string> | undefined;
};

async function generateUniqueSlug({
  pages,
  state,
  base,
  existingSlugs,
}: GenerateUniqueSlugProps): Promise<string> {
  let slug = base;
  let suffix = 2;

  // ✅ Fast path (no KV scans): if we have a local slug index, use it.
  if (existingSlugs instanceof Set) {
    while (existingSlugs.has(slug)) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  // Fallback: repository checks (may be costly on KV impl).
  while (await pages.existsBySlug(state, slug)) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

type BuildPageEntityProps = {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  sitemap: Page["sitemap"];
  paginationEnabled: boolean;
  nowIso: NonNullable<CreatePageDeps["nowIso"]>;
};

function buildPageEntity({
  id,
  parentId,
  slug,
  title,
  sitemap,
  paginationEnabled,
  nowIso,
}: BuildPageEntityProps): Page {
  const at = nowIso();
  const base: Page = {
    id,
    parentId,
    slug,
    title,
    blocks: [],
    meta: { createdAt: at, updatedAt: at },
    paginationEnabled,
  };

  return sitemap ? { ...base, sitemap } : base;
}
