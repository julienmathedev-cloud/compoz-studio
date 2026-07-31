/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-transaction.ts
 * @layer infra/pages
 * @description Prisma transaction implementing Website-locked OCC page and draft structure mutations.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  CreateDraftPageStructureCommand,
  CreateDraftPageStructureResult,
  DeleteDraftPageStructureCommand,
  DraftPageStructureTransaction,
  DraftStructureMutationResult,
  DraftStructureSnapshot,
  ReorderDraftSiblingsCommand,
  UpdateDraftPageIntent,
  UpdateDraftPageStructureResult,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import {
  resolvePageMetadataChanges,
  type PageMetadataColumns,
} from "@compoz/core/domain/pages/revisions/page-metadata";
import {
  planCreateDraftPage,
  planDeleteDraftPage,
  planMoveDraftPage,
  planReorderDraftSiblings,
  type DraftStructurePage,
  type DraftStructurePlan,
} from "@compoz/core/domain/pages/structure/draft-structure-planner";
import {
  assertParentId,
  normalizeFinalPageState,
} from "@compoz/core/domain/pages/validators/pages";
import { replacePagePathInMenus } from "@compoz/core/domain/site/helpers/replace-page-path-in-menus";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import {
  toDomainPageWithRevisions,
  toPrismaDraftPageCreateData,
  type PrismaPageRow,
} from "@compoz/infra/pages/mappers/page.mapper";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { toDomainDraftSiteIndex } from "@compoz/infra/site/mappers/site-index.mapper";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const UPDATE_ATTEMPTS = 3;

class CompositeCasMiss extends Error {
  constructor() {
    super("Draft page composite CAS missed.");
    this.name = "CompositeCasMiss";
  }
}

export type DraftStructureTransactionStage =
  | "beforeLock"
  | "afterLock"
  | "afterRead"
  | "afterDetach"
  | "afterPagination"
  | "afterDelete"
  | "duringNormalization"
  | "afterNormalization"
  | "beforeMetadataCas"
  | "beforeMenuCas"
  | "beforeRevisionIncrement"
  | "beforeCommit";

export type DraftStructureTransactionHook = (args: {
  command: "create" | "reorder" | "update" | "delete";
  stage: DraftStructureTransactionStage;
}) => void | Promise<void>;

type TransactionRunner = Pick<PrismaClient, "$transaction">;

type Options = Readonly<{
  websiteId: string;
  client?: TransactionRunner;
  now?: () => Date;
  hook?: DraftStructureTransactionHook;
}>;

type DraftPageRow = PrismaPageRow & {
  position: number;
};

type InternalIntent =
  | Readonly<{ kind: "create"; value: CreateDraftPageStructureCommand }>
  | Readonly<{ kind: "reorder"; value: ReorderDraftSiblingsCommand }>
  | Readonly<{ kind: "update"; value: UpdateDraftPageIntent }>
  | Readonly<{ kind: "delete"; value: DeleteDraftPageStructureCommand }>;

type UpdateContext = Readonly<{
  currentRow: DraftPageRow;
  currentPage: Page;
  effectiveParentId: string | null;
  parentChangeRequested: boolean;
  parentActuallyChanged: boolean;
  metadataPatch: Partial<PageMetadataColumns>;
  oldSlug: string;
}>;

type TransactionResult = Readonly<{
  snapshot: DraftStructureSnapshot;
  rows: DraftPageRow[];
  structureChanged: boolean;
  outcome: MutationOutcome;
  updateMetadataPatch: Partial<PageMetadataColumns>;
}>;

function toPlannerPages(rows: ReadonlyArray<DraftPageRow>): DraftStructurePage[] {
  return rows.map((row) => ({
    id: row.pageId,
    parentId: row.parentPageId,
    slug: row.slug,
    paginationEnabled: row.paginationEnabled,
    metaRevision: row.metaRevision,
    position: row.position,
  }));
}

function toSnapshot(
  rows: ReadonlyArray<DraftPageRow>,
  revision: number,
  updatedAt?: string,
): DraftStructureSnapshot {
  const index = toDomainDraftSiteIndex(rows);

  return {
    index: updatedAt ? { ...index, updatedAt } : index,
    draftStructureRevision: revision,
  };
}

function pageNotFound(): never {
  throw new DomainError({
    code: ERROR_CODES.PAGE_NOT_FOUND,
    message: ERROR_CODES.PAGE_NOT_FOUND,
  });
}

function revisionRequired(): never {
  throw new DomainError({
    code: ERROR_CODES.REVISION_REQUIRED,
    message: ERROR_CODES.REVISION_REQUIRED,
  });
}

function hasOwn(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export class PrismaDraftPageStructureTransaction
  implements DraftPageStructureTransaction
{
  private readonly websiteId: string;
  private readonly client: TransactionRunner;
  private readonly now: () => Date;
  private readonly hook?: DraftStructureTransactionHook;

  constructor(options: Options) {
    this.websiteId = requireWebsiteId(
      options.websiteId,
      "PrismaDraftPageStructureTransaction.constructor",
    );
    this.client = options.client ?? prisma;
    this.now = options.now ?? (() => new Date());
    this.hook = options.hook;
  }

  async create(
    command: CreateDraftPageStructureCommand,
  ): Promise<CreateDraftPageStructureResult> {
    const result = await this.run({ kind: "create", value: command });
    const page = result.rows.find((row) => row.pageId === command.page.id);
    if (!page) pageNotFound();

    const created = toDomainPageWithRevisions(page);
    return {
      ...result.snapshot,
      page: created.page,
      revisions: created.revisions,
    };
  }

  async reorder(
    command: ReorderDraftSiblingsCommand,
  ): Promise<DraftStructureMutationResult> {
    const result = await this.run({ kind: "reorder", value: command });
    return { ...result.snapshot, outcome: result.outcome };
  }

  async update(
    intent: UpdateDraftPageIntent,
  ): Promise<UpdateDraftPageStructureResult> {
    this.assertUpdateIntent(intent);

    for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt += 1) {
      try {
        const result = await this.run({ kind: "update", value: intent });
        const row = result.rows.find((item) => item.pageId === intent.pageId);
        if (!row) pageNotFound();
        const current = toDomainPageWithRevisions(row);

        return {
          outcome: result.outcome,
          slugChanged: hasOwn(result.updateMetadataPatch, "slug"),
          page: current.page,
          revisions: current.revisions,
          ...(result.structureChanged
            ? { structure: result.snapshot }
            : {}),
        };
      } catch (error) {
        if (!(error instanceof CompositeCasMiss)) throw error;
      }
    }

    throw new DomainError({
      code: ERROR_CODES.CONFLICT,
      message: ERROR_CODES.CONFLICT,
      details: {
        resourceId: "draftPageComposite",
        attempts: UPDATE_ATTEMPTS,
      },
    });
  }

  async delete(
    command: DeleteDraftPageStructureCommand,
  ): Promise<DraftStructureSnapshot> {
    return (await this.run({ kind: "delete", value: command })).snapshot;
  }

  private assertUpdateIntent(intent: UpdateDraftPageIntent): void {
    const runtime = intent as unknown as Readonly<Record<string, unknown>>;
    if (
      "metadata" in runtime ||
      "parentPageId" in runtime ||
      "menuRenameExpectedRevisions" in runtime ||
      "expectedPrimaryMenuRevision" in runtime ||
      "expectedLegalMenuRevision" in runtime
    ) {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: ERROR_CODES.INVALID_ARGUMENT,
      });
    }

    if (
      intent.metadataChanges &&
      intent.metadataChanges.expectedMetaRevision === undefined
    ) {
      revisionRequired();
    }
    if (
      intent.parentChange &&
      intent.parentChange.expectedDraftStructureRevision === undefined
    ) {
      revisionRequired();
    }
  }

  private async run(intent: InternalIntent): Promise<TransactionResult> {
    return this.client.$transaction(async (tx) => {
      const websiteExists = await tx.website.findUnique({
        where: { id: this.websiteId },
        select: { id: true },
      });
      if (!websiteExists) pageNotFound();

      await this.invokeHook(intent.kind, "beforeLock");
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Website" WHERE "id" = ${this.websiteId} FOR UPDATE`,
      );
      await this.invokeHook(intent.kind, "afterLock");

      const website = await tx.website.findUnique({
        where: { id: this.websiteId },
        select: { draftStructureRevision: true },
      });
      if (!website) pageNotFound();

      const rows = (await tx.page.findMany({
        where: { websiteId: this.websiteId, state: "draft" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })) as DraftPageRow[];
      await this.invokeHook(intent.kind, "afterRead");

      const currentSnapshot = toSnapshot(
        rows,
        website.draftStructureRevision,
      );
      const updateContext =
        intent.kind === "update"
          ? this.resolveUpdate(
              intent.value,
              rows,
            )
          : undefined;

      const expectedRevision =
        intent.kind === "update"
          ? updateContext?.parentChangeRequested
            ? intent.value.parentChange?.expectedDraftStructureRevision
            : undefined
          : intent.value.expectedDraftStructureRevision;

      if (
        expectedRevision !== undefined &&
        expectedRevision !== website.draftStructureRevision
      ) {
        throw new DomainError({
          code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          message: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          details: {
            expectedDraftStructureRevision: expectedRevision,
            currentDraftStructureRevision: website.draftStructureRevision,
            current: currentSnapshot,
          },
        });
      }

      const plan = this.plan(intent, rows, updateContext);
      const structureChanged = plan.kind !== "noop";
      const targetPaginationDerived =
        intent.kind === "update" &&
        plan.paginationDisabledPageIds.includes(intent.value.pageId) &&
        updateContext?.currentPage.paginationEnabled === true;

      const effectiveUpdateContext =
        updateContext && targetPaginationDerived
          ? {
              ...updateContext,
              metadataPatch: {
                ...updateContext.metadataPatch,
                paginationEnabled: false,
              },
            }
          : updateContext;

      if (plan.kind === "noop") {
        if (
          intent.kind === "update" &&
          effectiveUpdateContext &&
          (effectiveUpdateContext.parentActuallyChanged ||
            Object.keys(effectiveUpdateContext.metadataPatch).length > 0)
        ) {
          await this.applyUpdateWrites(
            tx,
            intent.value,
            effectiveUpdateContext,
          );
        }
      } else {
        await this.applyCommandWrites(
          tx,
          intent,
          rows,
          plan,
          effectiveUpdateContext,
        );
      }

      const remainingPaginationIds =
        intent.kind === "update"
          ? plan.paginationDisabledPageIds.filter(
              (pageId) => pageId !== intent.value.pageId,
            )
          : [];
      if (remainingPaginationIds.length > 0) {
        await this.applyPaginationNormalization(tx, remainingPaginationIds);
      }

      let finalStructureRevision = website.draftStructureRevision;
      if (structureChanged) {
        await this.invokeHook(intent.kind, "beforeRevisionIncrement");
        const nextWebsite = await tx.website.update({
          where: { id: this.websiteId },
          data: { draftStructureRevision: { increment: 1 } },
          select: { draftStructureRevision: true },
        });
        finalStructureRevision = nextWebsite.draftStructureRevision;
      }

      const nextRows = (await tx.page.findMany({
        where: { websiteId: this.websiteId, state: "draft" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })) as DraftPageRow[];

      await this.invokeHook(intent.kind, "beforeCommit");

      const outcome =
        intent.kind === "update"
          ? structureChanged ||
            Boolean(effectiveUpdateContext?.parentActuallyChanged) ||
            Object.keys(effectiveUpdateContext?.metadataPatch ?? {}).length > 0 ||
            remainingPaginationIds.length > 0
            ? "updated"
            : "noChanges"
          : intent.kind === "reorder" && !structureChanged
            ? "noChanges"
            : "updated";

      return {
        snapshot: structureChanged
          ? toSnapshot(
              nextRows,
              finalStructureRevision,
              this.now().toISOString(),
            )
          : toSnapshot(nextRows, finalStructureRevision),
        rows: nextRows,
        structureChanged,
        outcome,
        updateMetadataPatch: effectiveUpdateContext?.metadataPatch ?? {},
      };
    });
  }

  private resolveUpdate(
    intent: UpdateDraftPageIntent,
    rows: ReadonlyArray<DraftPageRow>,
  ): UpdateContext {
    const currentRow = rows.find((row) => row.pageId === intent.pageId);
    if (!currentRow) pageNotFound();
    const current = toDomainPageWithRevisions(currentRow);

    const normalizedParent = intent.parentChange
      ? {
          baseline: assertParentId(intent.parentChange.baseline),
          local: assertParentId(intent.parentChange.local),
        }
      : undefined;
    const parentChangeRequested =
      normalizedParent !== undefined &&
      normalizedParent.local !== normalizedParent.baseline;
    const effectiveParentId = parentChangeRequested
      ? normalizedParent.local
      : current.page.parentId;
    const parentActuallyChanged =
      parentChangeRequested && effectiveParentId !== current.page.parentId;

    const resolution = intent.metadataChanges
      ? resolvePageMetadataChanges({
          current: current.page,
          changes: intent.metadataChanges.changes,
          effectiveParentId,
        })
      : { patch: {}, conflicts: [], changedFields: [] };

    if (resolution.conflicts.length > 0 && intent.metadataChanges) {
      throw new DomainError({
        code: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
        message: ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT,
        details: {
          expectedMetaRevision:
            intent.metadataChanges.expectedMetaRevision,
          currentMetaRevision: current.revisions.metaRevision,
          conflicts: resolution.conflicts,
          current,
        },
      });
    }

    const effectivePage = normalizeFinalPageState({
      ...current.page,
      ...resolution.patch,
      parentId: effectiveParentId,
    });

    return {
      currentRow,
      currentPage: current.page,
      effectiveParentId,
      parentChangeRequested,
      parentActuallyChanged,
      metadataPatch:
        effectivePage.paginationEnabled !==
        (resolution.patch.paginationEnabled ??
          current.page.paginationEnabled)
          ? {
              ...resolution.patch,
              paginationEnabled: effectivePage.paginationEnabled,
            }
          : resolution.patch,
      oldSlug: current.page.slug,
    };
  }

  private plan(
    intent: InternalIntent,
    rows: ReadonlyArray<DraftPageRow>,
    updateContext?: UpdateContext,
  ): DraftStructurePlan {
    const pages = toPlannerPages(rows);

    switch (intent.kind) {
      case "create": {
        if (rows.some((row) => row.slug === intent.value.page.slug)) {
          throw new DomainError({ code: ERROR_CODES.PAGE_SLUG_CONFLICT });
        }

        return planCreateDraftPage({
          pages,
          page: {
            id: intent.value.page.id,
            parentId: intent.value.page.parentId,
            slug: intent.value.page.slug,
            paginationEnabled: intent.value.page.paginationEnabled,
            metaRevision: 0,
            position: pages.length,
          },
        });
      }
      case "reorder":
        return planReorderDraftSiblings({
          pages,
          parentId: intent.value.parentPageId,
          orderedPageIds: intent.value.orderedPageIds,
        });
      case "update": {
        if (!updateContext) pageNotFound();
        const effectivePages = pages.map((page) =>
          page.id === intent.value.pageId
            ? {
                ...page,
                slug:
                  updateContext.metadataPatch.slug ?? page.slug,
                paginationEnabled:
                  updateContext.metadataPatch.paginationEnabled ??
                  page.paginationEnabled,
              }
            : page,
        );
        return planMoveDraftPage({
          pages: effectivePages,
          pageId: intent.value.pageId,
          parentId: updateContext.effectiveParentId,
        });
      }
      case "delete":
        return planDeleteDraftPage({
          pages,
          pageId: intent.value.pageId,
        });
    }
  }

  private async applyCommandWrites(
    tx: Prisma.TransactionClient,
    intent: InternalIntent,
    rows: ReadonlyArray<DraftPageRow>,
    plan: Exclude<DraftStructurePlan, { kind: "noop" }>,
    updateContext?: UpdateContext,
  ): Promise<void> {
    if (intent.kind === "create") {
      const planned = plan.pages.find(
        (page) => page.id === intent.value.page.id,
      );
      if (!planned) pageNotFound();

      await tx.page.create({
        data: toPrismaDraftPageCreateData(
          this.websiteId,
          {
            pageId: intent.value.page.id,
            parentId: intent.value.page.parentId,
            slug: intent.value.page.slug,
            name: intent.value.page.name,
            seoTitle: intent.value.page.seoTitle,
            seoDescription: intent.value.page.seoDescription,
            blocks: intent.value.page.blocks,
            sitemap: intent.value.page.sitemap,
            paginationEnabled: planned.paginationEnabled,
            metaCreatedAt: intent.value.page.meta.createdAt,
            metaUpdatedAt: intent.value.page.meta.updatedAt,
          },
          planned.position,
        ),
      });
    }

    if (intent.kind === "update") {
      if (!updateContext) pageNotFound();
      await this.applyUpdateWrites(tx, intent.value, updateContext);
    }

    if (intent.kind === "delete") {
      const children = rows.filter(
        (row) => row.parentPageId === intent.value.pageId,
      );

      if (children.length > 0) {
        await tx.page.updateMany({
          where: {
            websiteId: this.websiteId,
            state: "draft",
            parentPageId: intent.value.pageId,
          },
          data: { parentPageId: null },
        });
      }
      await this.invokeHook(intent.kind, "afterDetach");

      const deleted = await tx.page.deleteMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: intent.value.pageId,
        },
      });
      if (deleted.count !== 1) pageNotFound();
      await this.invokeHook(intent.kind, "afterDelete");
    }

    if (intent.kind !== "update") {
      await this.applyPaginationNormalization(
        tx,
        plan.paginationDisabledPageIds,
      );
    }
    await this.invokeHook(intent.kind, "afterPagination");

    const previousPosition = new Map(
      rows.map((row) => [row.pageId, row.position]),
    );

    for (const page of plan.pages) {
      if (
        intent.kind === "create" &&
        page.id === intent.value.page.id
      ) {
        continue;
      }
      if (previousPosition.get(page.id) === page.position) continue;

      await tx.page.updateMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: page.id,
        },
        data: { position: page.position },
      });
      await this.invokeHook(intent.kind, "duringNormalization");
    }
    await this.invokeHook(intent.kind, "afterNormalization");
  }

  private async applyUpdateWrites(
    tx: Prisma.TransactionClient,
    intent: UpdateDraftPageIntent,
    context: UpdateContext,
  ): Promise<void> {
    const effectiveSlug =
      context.metadataPatch.slug ?? context.currentPage.slug;
    if (
      effectiveSlug === HOME_SLUG &&
      context.effectiveParentId !== null
    ) {
      throw new DomainError({
        code: ERROR_CODES.PAGE_PARENT_INVALID,
        message: ERROR_CODES.PAGE_PARENT_INVALID,
      });
    }

    if (
      effectiveSlug !== context.currentPage.slug &&
      (await tx.page.findFirst({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          slug: effectiveSlug,
          pageId: { not: intent.pageId },
        },
        select: { pageId: true },
      }))
    ) {
      throw new DomainError({ code: ERROR_CODES.PAGE_SLUG_CONFLICT });
    }

    if (context.parentActuallyChanged) {
      const parentWrite = await tx.page.updateMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: intent.pageId,
        },
        data: { parentPageId: context.effectiveParentId },
      });
      if (parentWrite.count !== 1) pageNotFound();
    }

    if (Object.keys(context.metadataPatch).length > 0) {
      await this.invokeHook("update", "beforeMetadataCas");
      const metadataWrite = await tx.page.updateMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: intent.pageId,
          metaRevision: context.currentRow.metaRevision,
        },
        data: {
          ...(hasOwn(context.metadataPatch, "name")
            ? { name: context.metadataPatch.name }
            : {}),
          ...(hasOwn(context.metadataPatch, "slug")
            ? { slug: context.metadataPatch.slug }
            : {}),
          ...(hasOwn(context.metadataPatch, "seoTitle")
            ? { seoTitle: context.metadataPatch.seoTitle }
            : {}),
          ...(hasOwn(context.metadataPatch, "seoDescription")
            ? { seoDescription: context.metadataPatch.seoDescription }
            : {}),
          ...(hasOwn(context.metadataPatch, "sitemap")
            ? {
                sitemap:
                  context.metadataPatch.sitemap === null
                    ? Prisma.JsonNull
                    : (context.metadataPatch
                        .sitemap as unknown as Prisma.InputJsonValue),
              }
            : {}),
          ...(hasOwn(context.metadataPatch, "paginationEnabled")
            ? {
                paginationEnabled:
                  context.metadataPatch.paginationEnabled,
              }
            : {}),
          metaRevision: { increment: 1 },
          metaUpdatedAt: this.now(),
        },
      });
      if (metadataWrite.count !== 1) throw new CompositeCasMiss();
    }

    if (effectiveSlug !== context.oldSlug) {
      await this.renameMenus(tx, context.oldSlug, effectiveSlug);
    }
  }

  private async renameMenus(
    tx: Prisma.TransactionClient,
    oldSlug: string,
    newSlug: string,
  ): Promise<void> {
    const site = new PrismaSiteRepository({
      websiteId: this.websiteId,
      transactionClient: tx,
    });
    const current = await site.readSettingsWithRevisions("draft");
    const patched = replacePagePathInMenus({
      settings: current.settings,
      fromSlug: oldSlug,
      toSlug: newSlug,
    });
    await this.invokeHook("update", "beforeMenuCas");

    if (patched.settings.primaryMenu !== current.settings.primaryMenu) {
      const updated = await site.compareAndSetDraftPrimaryMenu({
        expectedRevision: current.revisions.primaryMenuRevision,
        primaryMenu: patched.settings.primaryMenu,
      });
      if (!updated) throw new CompositeCasMiss();
    }

    if (patched.settings.legalMenu !== current.settings.legalMenu) {
      const updated = await site.compareAndSetDraftLegalMenu({
        expectedRevision: current.revisions.legalMenuRevision,
        legalMenu: patched.settings.legalMenu,
      });
      if (!updated) throw new CompositeCasMiss();
    }
  }

  private async applyPaginationNormalization(
    tx: Prisma.TransactionClient,
    pageIds: ReadonlyArray<string>,
  ): Promise<void> {
    if (pageIds.length === 0) return;

    await tx.page.updateMany({
      where: {
        websiteId: this.websiteId,
        state: "draft",
        pageId: { in: [...pageIds] },
        paginationEnabled: true,
      },
      data: {
        paginationEnabled: false,
        metaRevision: { increment: 1 },
        metaUpdatedAt: this.now(),
      },
    });
  }

  private async invokeHook(
    intent: InternalIntent["kind"],
    stage: DraftStructureTransactionStage,
  ): Promise<void> {
    await this.hook?.({ command: intent, stage });
  }
}
