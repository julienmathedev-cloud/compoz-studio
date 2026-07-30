/**
 * @file packages/core/src/domain/pages/revisions/page-metadata.ts
 * @layer core/domain/pages/revisions
 * @description Pure normalization and three-way resolution for draft page metadata.
 */

import type {
  Page,
  PageSitemap,
} from "@compoz/core/domain/pages/entities/page";
import type {
  MetadataChange,
  PageMetadataChanges,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import {
  compareThreeWayField,
  type ThreeWayFieldResult,
} from "@compoz/core/domain/revisions/three-way-field";
import { applySitemapDefaults } from "@compoz/core/domain/pages/use-cases/helpers/apply-page-defaults";
import {
  assertNameRequired,
  assertPageSlug,
  assertPaginationEnabled,
  assertSeoDescription,
  assertSeoTitle,
  assertSitemap,
} from "@compoz/core/domain/pages/validators/pages";
import { normalizeSlugInput } from "@compoz/core/domain/slug/utils";

export type PageMetadataField =
  | "name"
  | "slug"
  | "seoTitle"
  | "seoDescription"
  | "sitemap"
  | "paginationEnabled";

export type PageMetadataColumns = Pick<
  Page,
  PageMetadataField
>;

export type PageMetadataConflict = Readonly<{
  field: PageMetadataField;
  baseline: unknown;
  local: unknown;
  current: unknown;
}>;

export type PageMetadataResolution = Readonly<{
  patch: Partial<PageMetadataColumns>;
  conflicts: ReadonlyArray<PageMetadataConflict>;
  changedFields: ReadonlyArray<PageMetadataField>;
}>;

type MutableResolution = {
  patch: Partial<PageMetadataColumns>;
  conflicts: PageMetadataConflict[];
  changedFields: PageMetadataField[];
};

function normalizeNullableText(
  value: string | null,
  assertValue: (value: string | null) => void,
): string | null {
  const normalized = String(value ?? "").trim() || null;
  assertValue(normalized);
  return normalized;
}

function normalizeSitemap(value: PageSitemap | null): PageSitemap | null {
  if (value === null) return null;

  const normalized = applySitemapDefaults(value);
  assertSitemap(normalized);
  return normalized;
}

export function pageSitemapEquals(
  left: PageSitemap | null,
  right: PageSitemap | null,
): boolean {
  if (left === null || right === null) return left === right;

  return (
    left.include === right.include &&
    left.changefreq === right.changefreq &&
    left.priority === right.priority
  );
}

function append<T>(
  output: MutableResolution,
  field: PageMetadataField,
  result: ThreeWayFieldResult<T>,
  write: (value: T) => void,
): void {
  if (result.classification === "local-only") {
    write(result.local);
    output.changedFields.push(field);
    return;
  }

  if (result.classification === "conflict") {
    output.conflicts.push({
      field,
      baseline: result.baseline,
      local: result.local,
      current: result.current,
    });
  }
}

function compare<T>(
  field: PageMetadataField,
  change: MetadataChange<T>,
  current: T,
  equals?: (left: T, right: T) => boolean,
): ThreeWayFieldResult<T> {
  return compareThreeWayField({
    path: field,
    baseline: change.baseline,
    local: change.local,
    current,
    equals,
  });
}

/**
 * Resolves every supplied field before persistence, so contradictory fields
 * cannot be partially written.
 */
export function resolvePageMetadataChanges(input: Readonly<{
  current: Page;
  changes: PageMetadataChanges;
  effectiveParentId: string | null;
}>): PageMetadataResolution {
  const { current, changes, effectiveParentId } = input;
  const output: MutableResolution = {
    patch: {},
    conflicts: [],
    changedFields: [],
  };

  const nameChange = changes.name
    ? {
        baseline: assertNameRequired(changes.name.baseline),
        local: assertNameRequired(changes.name.local),
      }
    : undefined;

  if (nameChange) {
    append(output, "name", compare("name", nameChange, current.name), (value) => {
      output.patch.name = value;
    });
  }

  if (changes.slug) {
    const baselineName = nameChange?.baseline ?? current.name;
    const localName = nameChange?.local ?? current.name;
    const normalizeSlug = (value: string, fallback: string) => {
      const trimmed = String(value ?? "").trim();
      return assertPageSlug(
        trimmed ? normalizeSlugInput(trimmed) : fallback,
      );
    };
    const slugChange = {
      baseline: normalizeSlug(changes.slug.baseline, baselineName),
      local: normalizeSlug(changes.slug.local, localName),
    };
    append(output, "slug", compare("slug", slugChange, current.slug), (value) => {
      output.patch.slug = value;
    });
  }

  if (changes.seoTitle) {
    const normalized = {
      baseline: normalizeNullableText(
        changes.seoTitle.baseline,
        assertSeoTitle,
      ),
      local: normalizeNullableText(changes.seoTitle.local, assertSeoTitle),
    };
    append(
      output,
      "seoTitle",
      compare("seoTitle", normalized, current.seoTitle),
      (value) => {
        output.patch.seoTitle = value;
      },
    );
  }

  if (changes.seoDescription) {
    const normalized = {
      baseline: normalizeNullableText(
        changes.seoDescription.baseline,
        assertSeoDescription,
      ),
      local: normalizeNullableText(
        changes.seoDescription.local,
        assertSeoDescription,
      ),
    };
    append(
      output,
      "seoDescription",
      compare("seoDescription", normalized, current.seoDescription),
      (value) => {
        output.patch.seoDescription = value;
      },
    );
  }

  if (changes.sitemap) {
    const normalized = {
      baseline: normalizeSitemap(changes.sitemap.baseline),
      local: normalizeSitemap(changes.sitemap.local),
    };
    append(
      output,
      "sitemap",
      compare("sitemap", normalized, current.sitemap, pageSitemapEquals),
      (value) => {
        output.patch.sitemap = value;
      },
    );
  }

  if (changes.paginationEnabled) {
    const normalizePagination = (value: boolean) =>
      assertPaginationEnabled({
        parentId: effectiveParentId,
        paginationEnabled: value,
      });
    const normalized = {
      baseline: normalizePagination(changes.paginationEnabled.baseline),
      local: normalizePagination(changes.paginationEnabled.local),
    };
    append(
      output,
      "paginationEnabled",
      compare(
        "paginationEnabled",
        normalized,
        current.paginationEnabled,
      ),
      (value) => {
        output.patch.paginationEnabled = value;
      },
    );
  }

  return output;
}
