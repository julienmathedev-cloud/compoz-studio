/**
 * @file packages/core/src/domain/pages/validators/pages.ts
 * @layer core/domain/pages/validators
 * @description
 * Invariants métier des pages : validation name/slug, sitemap et contrôle de priority.
 * Ce module reste purement domaine (pas de Zod/HTTP/UI).
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import {
  DomainError,
  isDomainErrorLike,
} from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { assertSlug } from "@compoz/core/domain/slug/validator";

/**
 * Valide qu’un nom de page est non vide une fois trimé.
 *
 * @param name - Nom brut.
 * @param path - Chemin logique de l’erreur.
 * @throws DomainError(EC.PAGE_TITLE_REQUIRED) si le nom est vide après trim.
 * @returns Le nom normalisé (trimé).
 */
export function assertNameRequired(
  name: string,
  path: (string | number)[] = ["name"],
): string {
  const t = name.trim();

  if (!t) {
    throw new DomainError({
      code: EC.PAGE_TITLE_REQUIRED,
      message: EC.PAGE_TITLE_REQUIRED,
      details: { path },
    });
  }

  return t;
}

/**
 * Valide et normalise le slug d’une page.
 *
 * @param raw  - Slug brut.
 * @param path - Chemin logique pour `details.path` (par défaut `"slug"`).
 *
 * @returns Le slug normalisé (kebab-case) si tout est valide.
 */
export function assertPageSlug(
  raw: string,
  path: (string | number)[] = ["slug"],
): string {
  try {
    return assertSlug(raw, path);
  } catch (e) {
    if (!isDomainErrorLike(e)) {
      throw e;
    }

    let mappedCode: ErrorCode | undefined;

    switch (e.code) {
      case EC.SLUG_REQUIRED:
        mappedCode = EC.PAGE_SLUG_REQUIRED;
        break;
      case EC.SLUG_RESERVED:
        mappedCode = EC.PAGE_SLUG_RESERVED;
        break;
      case EC.SLUG_INVALID_FORMAT:
        mappedCode = EC.PAGE_SLUG_INVALID_FORMAT;
        break;
      default:
        throw e;
    }

    throw new DomainError({
      code: mappedCode,
      message: mappedCode,
      details: { path },
      cause: e,
    });
  }
}

/**
 * Valide `paginationEnabled` au regard de `parentId`.
 *
 * Règle métier :
 * - parentId === null => paginationEnabled doit être false
 * - parentId !== null => paginationEnabled peut être true/false
 */
export function assertPaginationEnabled(args: {
  parentId: string | null;
  paginationEnabled: unknown;
  path?: (string | number)[];
}): boolean {
  const { parentId, paginationEnabled, path = ["paginationEnabled"] } = args;

  if (typeof paginationEnabled !== "boolean") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  if (parentId === null && paginationEnabled === true) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path, meta: { reason: "root_page_cannot_paginate" } },
    });
  }

  return paginationEnabled;
}

/**
 * Valide que la priorité du sitemap, si fournie, est dans [0, 1].
 *
 * @param p    - Valeur de priorité éventuelle.
 * @param path - Chemin logique de l’erreur.
 */
export function assertPriority(
  p: number | null,
  path: (string | number)[] = ["sitemap", "priority"],
): void {
  if (p === null) return;

  if (typeof p !== "number" || p < 0 || p > 1) {
    throw new DomainError({
      code: EC.VALIDATION_ERROR,
      message: EC.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE,
      details: { path, meta: { priority: p } },
    });
  }
}

/**
 * Valide `parentId` :
 * - `null` => page racine
 * - `string` non vide => id d’une page parente
 */
export function assertParentId(
  parentId: unknown,
  path: (string | number)[] = ["parentId"],
): string | null {
  if (parentId === null) return null;

  if (typeof parentId !== "string") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  const v = parentId.trim();

  if (!v) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  return v;
}

export function assertSeoTitle(
  seoTitle: string | null,
  path: (string | number)[] = ["seoTitle"],
): void {
  if (seoTitle !== null && typeof seoTitle !== "string") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }
}

export function assertSitemap(
  sitemap: Page["sitemap"],
  path: (string | number)[] = ["sitemap"],
): void {
  if (sitemap === null) return;

  if (typeof sitemap !== "object") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  if (typeof sitemap.include !== "boolean") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: [...path, "include"] },
    });
  }

  if (
    sitemap.changefreq !== null &&
    sitemap.changefreq !== "always" &&
    sitemap.changefreq !== "hourly" &&
    sitemap.changefreq !== "daily" &&
    sitemap.changefreq !== "weekly" &&
    sitemap.changefreq !== "monthly" &&
    sitemap.changefreq !== "yearly" &&
    sitemap.changefreq !== "never"
  ) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        path: [...path, "changefreq"],
        meta: { changefreq: sitemap.changefreq },
      },
    });
  }

  assertPriority(sitemap.priority, [...path, "priority"]);
}

export function assertPage(p: Page): void {
  assertNameRequired(p.name, ["page", "name"]);
  assertPageSlug(p.slug, ["page", "slug"]);
  assertSeoTitle(p.seoTitle, ["page", "seoTitle"]);

  const normalizedParentId = assertParentId(p.parentId, ["page", "parentId"]);

  if (normalizedParentId !== null && normalizedParentId === p.id) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: ["page", "parentId"], meta: { reason: "self_parent" } },
    });
  }

  assertSitemap(p.sitemap, ["page", "sitemap"]);

  assertPaginationEnabled({
    parentId: normalizedParentId,
    paginationEnabled: p.paginationEnabled,
    path: ["page", "paginationEnabled"],
  });
}
