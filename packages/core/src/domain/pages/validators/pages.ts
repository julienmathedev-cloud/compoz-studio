/**
 * @file packages/core/src/domain/pages/validators/pages.ts
 * @layer core/domain/pages/validators
 * @description Pure domain invariants for pages.
 * @remarks
 * Validates page name, slug, sitemap priority, parent relationship, and pagination rules without Zod, HTTP, or UI dependencies.
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
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { assertSlug } from "@compoz/core/domain/slug/validator";

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

/** Validates and normalizes a page slug while mapping generic slug errors to page-specific codes. */
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

/** Root-page pagination is normalized because it is derived from the final hierarchy. */
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

  return parentId === null ? false : paginationEnabled;
}

/** Validates hierarchy-dependent invariants against a page's effective final state. */
export function normalizeFinalPageState(page: Page): Page {
  if (page.slug === HOME_SLUG && page.parentId !== null) {
    throw new DomainError({
      code: EC.PAGE_PARENT_INVALID,
      message: EC.PAGE_PARENT_INVALID,
    });
  }

  if (page.parentId !== null || page.paginationEnabled === false) {
    return page;
  }

  return { ...page, paginationEnabled: false };
}

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

/** `null` identifies a root page; non-null parent ids must be non-empty strings. */
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

export function assertSeoDescription(
  seoDescription: string | null,
  path: (string | number)[] = ["seoDescription"],
): void {
  if (seoDescription !== null && typeof seoDescription !== "string") {
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
