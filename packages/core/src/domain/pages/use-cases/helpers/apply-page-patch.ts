/**
 * @file packages/core/src/domain/pages/use-cases/helpers/apply-page-patch.ts
 * @layer core/domain/pages/use-cases/helpers
 * @description
 * Helpers pour l’utilisation de `applyPatch` sur les pages.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { applySitemapDefaults } from "@compoz/core/domain/pages/use-cases/helpers/apply-page-defaults";
import type {
  ChangedKey,
  UpdatePageDeps,
  UpdatePageInput,
} from "@compoz/core/domain/pages/use-cases/update-page.types";
import {
  assertPageSlug,
  assertPaginationEnabled,
  assertParentId,
  assertPriority,
  assertNameRequired,
} from "@compoz/core/domain/pages/validators/pages";
import { normalizeSlugInput } from "@compoz/core/domain/slug/utils";

export function applySitemapPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (typeof input.sitemap !== "object" || input.sitemap === null) return;

  const prev = existing.sitemap ?? applySitemapDefaults();

  const nextChangefreq =
    "changefreq" in input.sitemap
      ? input.sitemap.changefreq === null
        ? undefined
        : input.sitemap.changefreq
      : prev.changefreq;

  const nextPriority =
    "priority" in input.sitemap
      ? input.sitemap.priority === null
        ? undefined
        : input.sitemap.priority
      : prev.priority;

  const sNext = {
    include: input.sitemap.include ?? prev.include ?? true,
    changefreq: nextChangefreq,
    priority: nextPriority,
  };

  assertPriority(sNext.priority);

  const changedSitemap =
    sNext.include !== (prev.include ?? true) ||
    sNext.changefreq !== prev.changefreq ||
    sNext.priority !== prev.priority;

  if (changedSitemap) {
    next.sitemap = sNext;
    changed.push("sitemap");
  }
}

export function applyParentIdPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (!("parentId" in input)) return;

  const pid = assertParentId(input.parentId, ["parentId"]);

  if (pid !== existing.parentId) {
    if (pid !== null && pid === existing.id) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["parentId"], meta: { reason: "self_parent" } },
      });
    }

    next.parentId = pid;
    changed.push("parentId");
  }
}

export function applyPaginationEnabledPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (!("paginationEnabled" in input)) return;

  const isRoot = next.parentId === null;

  const value = isRoot
    ? false
    : assertPaginationEnabled({
        parentId: next.parentId,
        paginationEnabled: input.paginationEnabled,
        path: ["paginationEnabled"],
      });

  if (value !== existing.paginationEnabled) {
    next.paginationEnabled = value;
    changed.push("paginationEnabled");
  }
}

type SlugChange = Readonly<{ from: string; to: string }>;

export async function applySlugPatch({
  existing,
  next,
  changed,
  input,
  pages,
  state,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
  pages: UpdatePageDeps["pages"];
  state: ContentState;
}): Promise<SlugChange | null> {
  if (typeof input.slug !== "string") return null;

  const rawSlug = String(input.slug ?? "").trim();

  // Reset : slug vidé => on dérive depuis le titre courant (next.title si modifié)
  const baseSource =
    rawSlug.length === 0 ? next.name : normalizeSlugInput(rawSlug);

  const candidate = assertPageSlug(baseSource);

  if (candidate === existing.slug) return null;

  const other = await pages.readBySlug(state, candidate);
  if (other && other.id !== existing.id) {
    throw new DomainError({
      code: EC.PAGE_SLUG_CONFLICT,
      message: EC.PAGE_SLUG_CONFLICT,
    });
  }

  const from = existing.slug;
  next.slug = candidate;
  changed.push("slug");

  return { from, to: candidate };
}

export function applyNamePatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (typeof input.name !== "string") return;

  const t = assertNameRequired(input.name);
  if (t !== existing.name) {
    next.name = t;
    changed.push("name");
  }
}
