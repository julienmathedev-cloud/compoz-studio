/**
 * @file packages/core/src/domain/pages/use-cases/create-page.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that creates a page with metadata and sitemap configuration.
 * @remarks
 * The domain generates a unique slug and applies business defaults before persistence.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  CreatePageDeps,
  CreatePageInput,
  CreatePageResult,
} from "@compoz/core/domain/pages/use-cases/create-page.types";
import { applySitemapDefaults } from "@compoz/core/domain/pages/use-cases/helpers/apply-page-defaults";
import {
  assertNameRequired,
  assertPageSlug,
  assertPaginationEnabled,
  assertParentId,
  assertPriority,
} from "@compoz/core/domain/pages/validators/pages";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

export function createPage({
  pages,
  idGenerator,
  nowIso = () => new Date().toISOString(),
}: CreatePageDeps) {
  return async function run(input: CreatePageInput): Promise<CreatePageResult> {
    const state = DEFAULT_CONTENT_STATE;

    const name = assertNameRequired(input.name);

    const inputSlug =
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
      inputSlug && inputSlug.length > 0 ? inputSlug : name,
    );

    const hasHome =
      input.existingSlugs instanceof Set
        ? input.existingSlugs.has(HOME_SLUG)
        : await pages.existsBySlug(state, HOME_SLUG);

    if (base === HOME_SLUG && hasHome) {
      throw new DomainError({
        code: EC.PAGE_SLUG_CONFLICT,
        message: EC.PAGE_SLUG_CONFLICT,
      });
    }

    const slug = await generateUniqueSlug({
      pages,
      state,
      base,
      existingSlugs: input.existingSlugs,
    });

    const seoTitle = input.seoTitle !== null ? input.seoTitle.trim() : null;
    const seoDescription =
      input.seoDescription !== null
        ? input.seoDescription.trim() || null
        : null;

    const sitemap =
      input.sitemap !== null ? applySitemapDefaults(input.sitemap) : null;

    if (sitemap !== null) {
      assertPriority(sitemap.priority);
    }

    const page = buildPageEntity({
      id: idGenerator.nextId(),
      parentId,
      slug,
      name,
      seoTitle,
      seoDescription,
      sitemap,
      paginationEnabled,
      nowIso,
    });

    await pages.ensureBase();
    await pages.createDraftPage({
      pageId: page.id,
      parentId: page.parentId,
      slug: page.slug,
      name: page.name,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      blocks: page.blocks,
      sitemap: page.sitemap,
      paginationEnabled: page.paginationEnabled,
      metaCreatedAt: page.meta.createdAt,
      metaUpdatedAt: page.meta.updatedAt,
    });

    return { page };
  };
}

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

  if (existingSlugs instanceof Set) {
    while (existingSlugs.has(slug)) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  while (await pages.existsBySlug(state, slug)) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

type BuildPageEntityProps = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sitemap: Page["sitemap"];
  paginationEnabled: boolean;
  nowIso: NonNullable<CreatePageDeps["nowIso"]>;
};

function buildPageEntity({
  id,
  parentId,
  slug,
  name,
  seoTitle,
  seoDescription,
  sitemap,
  paginationEnabled,
  nowIso,
}: BuildPageEntityProps): Page {
  const at = nowIso();

  return {
    id,
    parentId,
    slug,
    name,
    seoTitle,
    seoDescription,
    blocks: [],
    meta: { createdAt: at, updatedAt: at },
    sitemap,
    paginationEnabled,
  };
}
