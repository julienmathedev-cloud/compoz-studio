/**
 * @file packages/core/src/domain/pages/use-cases/update-page.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that updates a draft page through a controlled patch.
 * @remarks
 * No-op updates are not persisted. Slug changes validate uniqueness, accept UI-style slugs, and can update menu hrefs when the optional `site` dependency is provided.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Page,
  PageWithRevisions,
} from "@compoz/core/domain/pages/entities/page";
import {
  applyNamePatch,
  applyPaginationEnabledPatch,
  applyParentIdPatch,
  applySeoDescriptionPatch,
  applySeoTitlePatch,
  applySitemapPatch,
  applySlugPatch,
} from "@compoz/core/domain/pages/use-cases/helpers/apply-page-patch";
import { normalizeFinalPageState } from "@compoz/core/domain/pages/validators/pages";
import type {
  ChangedKey,
  UpdatePageDeps,
  UpdatePageInput,
  UpdatePageResult,
} from "@compoz/core/domain/pages/use-cases/update-page.types";
import { assertDraftStructureRevision } from "@compoz/core/domain/pages/use-cases/helpers/assert-draft-structure-revision";

export function updatePage({
  pages,
  structure,
  nowIso = () => new Date().toISOString(),
}: UpdatePageDeps) {
  return async function run(input: UpdatePageInput): Promise<UpdatePageResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    const pageRead = await readExistingPageById({
      pages,
      state: DEFAULT_CONTENT_STATE,
      pageId,
    });
    const existing = pageRead.page;

    const next: Page = { ...existing };
    const changed: ChangedKey[] = [];

    applyNamePatch({ existing, next, changed, input });
    applySeoTitlePatch({ existing, next, changed, input });
    applySeoDescriptionPatch({ existing, next, changed, input });

    const slugChange = await applySlugPatch({
      existing,
      next,
      changed,
      input,
      pages,
      state: DEFAULT_CONTENT_STATE,
    });

    applyParentIdPatch({ existing, next, changed, input });
    applyPaginationEnabledPatch({ existing, next, changed, input });
    applySitemapPatch({ existing, next, changed, input });

    const normalized = normalizeFinalPageState(next);
    if (normalized.paginationEnabled !== next.paginationEnabled) {
      next.paginationEnabled = normalized.paginationEnabled;
      if (next.paginationEnabled === existing.paginationEnabled) {
        const changedIndex = changed.indexOf("paginationEnabled");
        if (changedIndex !== -1) changed.splice(changedIndex, 1);
      } else if (!changed.includes("paginationEnabled")) {
        changed.push("paginationEnabled");
      }
    }

    if (changed.length === 0) {
      const result =
        "parentId" in input
          ? await structure.update({
              pageId,
              parentPageId: existing.parentId,
              expectedDraftStructureRevision:
                assertDraftStructureRevision(
                  input.expectedDraftStructureRevision,
                ),
            })
          : await structure.update({ pageId });

      return {
        page: result.page,
        structure: {
          index: result.index,
          draftStructureRevision: result.draftStructureRevision,
        },
      };
    }

    const metaUpdatedAt = nowIso();
    next.meta = { ...existing.meta, updatedAt: metaUpdatedAt };

    const metadataChanged = changed.some((key) => key !== "parentId");

    if ("parentId" in input || metadataChanged) {
      const write = {
        pageId,
        ...(metadataChanged
          ? {
              metadata: {
                page: next,
                metaRevision: pageRead.revisions.metaRevision,
              },
            }
          : {}),
        ...(slugChange
          ? {
              menuRenameExpectedRevisions: {
                expectedPrimaryMenuRevision:
                  input.expectedPrimaryMenuRevision,
                expectedLegalMenuRevision:
                  input.expectedLegalMenuRevision,
              },
            }
          : {}),
      };
      const result =
        "parentId" in input
          ? await structure.update({
              ...write,
              parentPageId: next.parentId,
              expectedDraftStructureRevision:
                assertDraftStructureRevision(
                  input.expectedDraftStructureRevision,
                ),
            })
          : await structure.update(write);

      return {
        page: result.page,
        structure: {
          index: result.index,
          draftStructureRevision: result.draftStructureRevision,
        },
      };
    }

    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
    });
  };
}

async function readExistingPageById({
  pages,
  state,
  pageId,
}: {
  pages: UpdatePageDeps["pages"];
  state: ContentState;
  pageId: string;
}): Promise<PageWithRevisions> {
  const existing = await pages.readByIdWithRevisions(state, pageId);

  if (!existing) {
    throw new DomainError({
      code: EC.PAGE_NOT_FOUND,
      message: EC.PAGE_NOT_FOUND,
    });
  }

  return existing;
}
