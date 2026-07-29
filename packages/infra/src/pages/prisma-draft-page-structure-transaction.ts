/**
 * @file packages/infra/src/pages/prisma-draft-page-structure-transaction.ts
 * @layer infra/pages
 * @description Prisma transaction implementing Website-locked OCC draft structure mutations.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  CreateDraftPageStructureCommand,
  CreateDraftPageStructureResult,
  DeleteDraftPageStructureCommand,
  DraftPageStructureTransaction,
  DraftStructureSnapshot,
  ReorderDraftSiblingsCommand,
  UpdateDraftPageStructureCommand,
  UpdateDraftPageStructureResult,
} from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import {
  planCreateDraftPage,
  planDeleteDraftPage,
  planMoveDraftPage,
  planReorderDraftSiblings,
  type DraftStructurePage,
  type DraftStructurePlan,
} from "@compoz/core/domain/pages/structure/draft-structure-planner";
import { replacePagePathInMenus } from "@compoz/core/domain/site/helpers/replace-page-path-in-menus";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { toDomainSiteIndex } from "@compoz/infra/site/mappers/site-index.mapper";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import {
  toDomainPage,
  toPrismaDraftPageCreateData,
  type PrismaPageRow,
} from "@compoz/infra/pages/mappers/page.mapper";
import {
  Prisma,
  type PrismaClient,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";

export type DraftStructureTransactionStage =
  | "beforeLock"
  | "afterLock"
  | "afterRead"
  | "afterDetach"
  | "afterPagination"
  | "afterDelete"
  | "duringNormalization"
  | "afterNormalization"
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

type InternalCommand =
  | Readonly<{ kind: "create"; value: CreateDraftPageStructureCommand }>
  | Readonly<{ kind: "reorder"; value: ReorderDraftSiblingsCommand }>
  | Readonly<{ kind: "update"; value: UpdateDraftPageStructureCommand }>
  | Readonly<{ kind: "delete"; value: DeleteDraftPageStructureCommand }>;

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
  const index = toDomainSiteIndex(rows, CONTENT_STATE.DRAFT);

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

    return { ...result.snapshot, page: toDomainPage(page) };
  }

  async reorder(
    command: ReorderDraftSiblingsCommand,
  ): Promise<DraftStructureSnapshot> {
    return (await this.run({ kind: "reorder", value: command })).snapshot;
  }

  async update(
    command: UpdateDraftPageStructureCommand,
  ): Promise<UpdateDraftPageStructureResult> {
    const runtimeCommand = command as unknown as Readonly<
      Record<string, unknown>
    >;
    const runtimeMenuRevisions =
      runtimeCommand["menuRenameExpectedRevisions"];
    if (
      "menuSlugRename" in runtimeCommand ||
      (typeof runtimeMenuRevisions === "object" &&
        runtimeMenuRevisions !== null &&
        ("previousSlug" in runtimeMenuRevisions ||
          "nextSlug" in runtimeMenuRevisions))
    ) {
      throw new DomainError({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: ERROR_CODES.INVALID_ARGUMENT,
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(command, "parentPageId") &&
      command.expectedDraftStructureRevision === undefined
    ) {
      throw new DomainError({
        code: ERROR_CODES.REVISION_REQUIRED,
        message: ERROR_CODES.REVISION_REQUIRED,
      });
    }

    const result = await this.run({ kind: "update", value: command });
    const page = result.rows.find((row) => row.pageId === command.pageId);
    if (!page) pageNotFound();

    return { ...result.snapshot, page: toDomainPage(page) };
  }

  async delete(
    command: DeleteDraftPageStructureCommand,
  ): Promise<DraftStructureSnapshot> {
    return (await this.run({ kind: "delete", value: command })).snapshot;
  }

  private async run(
    command: InternalCommand,
  ): Promise<Readonly<{ snapshot: DraftStructureSnapshot; rows: DraftPageRow[] }>> {
    return this.client.$transaction(async (tx) => {
      const websiteExists = await tx.website.findUnique({
        where: { id: this.websiteId },
        select: { id: true },
      });
      if (!websiteExists) pageNotFound();

      await this.invokeHook(command.kind, "beforeLock");
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Website" WHERE "id" = ${this.websiteId} FOR UPDATE`,
      );
      await this.invokeHook(command.kind, "afterLock");

      const website = await tx.website.findUnique({
        where: { id: this.websiteId },
        select: { draftStructureRevision: true },
      });
      if (!website) pageNotFound();

      const rows = (await tx.page.findMany({
        where: { websiteId: this.websiteId, state: "draft" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })) as DraftPageRow[];
      await this.invokeHook(command.kind, "afterRead");

      const current = toSnapshot(rows, website.draftStructureRevision);
      const expected = command.value.expectedDraftStructureRevision;

      if (
        expected !== undefined &&
        expected !== website.draftStructureRevision
      ) {
        throw new DomainError({
          code: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          message: ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT,
          details: {
            expectedDraftStructureRevision: expected,
            currentDraftStructureRevision: website.draftStructureRevision,
            current,
          },
        });
      }

      const plan = this.plan(command, rows);
      if (plan.kind === "noop") {
        if (
          command.kind === "update" &&
          (command.value.metadata ||
            plan.paginationDisabledPageIds.length > 0)
        ) {
          await this.applyUpdateWrites(tx, command.value, false, rows);
          await this.applyPaginationNormalization(
            tx,
            plan.paginationDisabledPageIds,
          );
          const nextRows = (await tx.page.findMany({
            where: { websiteId: this.websiteId, state: "draft" },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          })) as DraftPageRow[];
          await this.invokeHook(command.kind, "beforeCommit");
          return {
            snapshot: toSnapshot(
              nextRows,
              website.draftStructureRevision,
            ),
            rows: nextRows,
          };
        }

        await this.invokeHook(command.kind, "beforeCommit");
        return { snapshot: current, rows };
      }

      await this.applyCommandWrites(tx, command, rows, plan);
      await this.invokeHook(command.kind, "beforeRevisionIncrement");

      const nextWebsite = await tx.website.update({
        where: { id: this.websiteId },
        data: { draftStructureRevision: { increment: 1 } },
        select: { draftStructureRevision: true },
      });

      const nextRows = (await tx.page.findMany({
        where: { websiteId: this.websiteId, state: "draft" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })) as DraftPageRow[];

      await this.invokeHook(command.kind, "beforeCommit");

      return {
        snapshot: toSnapshot(
          nextRows,
          nextWebsite.draftStructureRevision,
          this.now().toISOString(),
        ),
        rows: nextRows,
      };
    });
  }

  private plan(
    command: InternalCommand,
    rows: ReadonlyArray<DraftPageRow>,
  ): DraftStructurePlan {
    const pages = toPlannerPages(rows);

    switch (command.kind) {
      case "create": {
        if (rows.some((row) => row.slug === command.value.page.slug)) {
          throw new DomainError({ code: ERROR_CODES.PAGE_SLUG_CONFLICT });
        }

        return planCreateDraftPage({
          pages,
          page: {
            id: command.value.page.id,
            parentId: command.value.page.parentId,
            slug: command.value.page.slug,
            paginationEnabled: command.value.page.paginationEnabled,
            metaRevision: 0,
            position: pages.length,
          },
        });
      }
      case "reorder":
        return planReorderDraftSiblings({
          pages,
          parentId: command.value.parentPageId,
          orderedPageIds: command.value.orderedPageIds,
        });
      case "update": {
        const target = pages.find(
          (page) => page.id === command.value.pageId,
        );
        if (!target) pageNotFound();
        const effectivePages = pages.map((page) =>
          page.id === command.value.pageId
            ? {
                ...page,
                slug: command.value.metadata?.page.slug ?? page.slug,
                paginationEnabled:
                  command.value.metadata?.page.paginationEnabled ??
                  page.paginationEnabled,
              }
            : page,
        );
        return planMoveDraftPage({
          pages: effectivePages,
          pageId: command.value.pageId,
          parentId:
            command.value.parentPageId === undefined
              ? target.parentId
              : command.value.parentPageId,
        });
      }
      case "delete":
        return planDeleteDraftPage({
          pages,
          pageId: command.value.pageId,
        });
    }
  }

  private async applyCommandWrites(
    tx: Prisma.TransactionClient,
    command: InternalCommand,
    rows: ReadonlyArray<DraftPageRow>,
    plan: Exclude<DraftStructurePlan, { kind: "noop" }>,
  ): Promise<void> {
    if (command.kind === "create") {
      const planned = plan.pages.find(
        (page) => page.id === command.value.page.id,
      );
      if (!planned) pageNotFound();

      await tx.page.create({
        data: toPrismaDraftPageCreateData(
          this.websiteId,
          {
            pageId: command.value.page.id,
            parentId: command.value.page.parentId,
            slug: command.value.page.slug,
            name: command.value.page.name,
            seoTitle: command.value.page.seoTitle,
            seoDescription: command.value.page.seoDescription,
            blocks: command.value.page.blocks,
            sitemap: command.value.page.sitemap,
            paginationEnabled: planned.paginationEnabled,
            metaCreatedAt: command.value.page.meta.createdAt,
            metaUpdatedAt: command.value.page.meta.updatedAt,
          },
          planned.position,
        ),
      });
    }

    if (command.kind === "update") {
      await this.applyUpdateWrites(tx, command.value, true, rows);
    }

    if (command.kind === "delete") {
      const children = rows.filter(
        (row) => row.parentPageId === command.value.pageId,
      );

      if (children.length > 0) {
        await tx.page.updateMany({
          where: {
            websiteId: this.websiteId,
            state: "draft",
            parentPageId: command.value.pageId,
          },
          data: { parentPageId: null },
        });
      }
      await this.invokeHook(command.kind, "afterDetach");

      const deleted = await tx.page.deleteMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: command.value.pageId,
        },
      });
      if (deleted.count !== 1) pageNotFound();
      await this.invokeHook(command.kind, "afterDelete");
    }

    await this.applyPaginationNormalization(
      tx,
      plan.paginationDisabledPageIds,
    );
    await this.invokeHook(command.kind, "afterPagination");

    const previousPosition = new Map(
      rows.map((row) => [row.pageId, row.position]),
    );

    for (const page of plan.pages) {
      if (
        command.kind === "create" &&
        page.id === command.value.page.id
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
      await this.invokeHook(command.kind, "duringNormalization");
    }
    await this.invokeHook(command.kind, "afterNormalization");
  }

  private async applyUpdateWrites(
    tx: Prisma.TransactionClient,
    command: UpdateDraftPageStructureCommand,
    includeParent: boolean,
    knownRows?: ReadonlyArray<DraftPageRow>,
  ): Promise<void> {
    const rows =
      knownRows ??
      ((await tx.page.findMany({
        where: { websiteId: this.websiteId, state: "draft" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      })) as DraftPageRow[]);
    if (!rows.some((row) => row.pageId === command.pageId)) pageNotFound();

    const metadata = command.metadata;
    if (
      metadata &&
      rows.some(
        (row) =>
          row.pageId !== command.pageId &&
          row.slug === metadata.page.slug,
      )
    ) {
      throw new DomainError({ code: ERROR_CODES.PAGE_SLUG_CONFLICT });
    }

    const current = rows.find((row) => row.pageId === command.pageId);
    if (!current) pageNotFound();
    const effectiveParentPageId =
      includeParent && command.parentPageId !== undefined
        ? command.parentPageId
        : current.parentPageId;
    const effectiveSlug = metadata?.page.slug ?? current.slug;
    if (
      effectiveSlug === HOME_SLUG &&
      effectiveParentPageId !== null
    ) {
      throw new DomainError({
        code: ERROR_CODES.PAGE_PARENT_INVALID,
        message: ERROR_CODES.PAGE_PARENT_INVALID,
      });
    }
    const effectivePaginationEnabled =
      effectiveParentPageId === null
        ? false
        : (metadata?.page.paginationEnabled ??
          current.paginationEnabled);

    if (
      (includeParent && command.parentPageId !== undefined) ||
      metadata
    ) {
      await tx.page.updateMany({
        where: {
          websiteId: this.websiteId,
          state: "draft",
          pageId: command.pageId,
        },
        data: {
          ...(includeParent && command.parentPageId !== undefined
            ? { parentPageId: command.parentPageId }
            : {}),
          ...(metadata
            ? {
                slug: metadata.page.slug,
                name: metadata.page.name,
                seoTitle: metadata.page.seoTitle,
                seoDescription: metadata.page.seoDescription,
                sitemap:
                  metadata.page.sitemap === null
                    ? Prisma.JsonNull
                    : (metadata.page
                        .sitemap as unknown as Prisma.InputJsonValue),
                paginationEnabled: effectivePaginationEnabled,
                metaRevision: { increment: 1 },
                metaUpdatedAt: new Date(metadata.page.meta.updatedAt),
              }
            : {}),
        },
      });
    }

    if (metadata && effectiveSlug !== current.slug) {
      const site = new PrismaSiteRepository({
        websiteId: this.websiteId,
        transactionClient: tx,
      });
      const currentBundle = await site.readSettingsWithRevisions("draft");
      const patched = replacePagePathInMenus({
        settings: currentBundle.settings,
        fromSlug: current.slug,
        toSlug: effectiveSlug,
      });
      const primaryChanged =
        patched.settings.primaryMenu !== currentBundle.settings.primaryMenu;
      const legalChanged =
        patched.settings.legalMenu !== currentBundle.settings.legalMenu;

      if (primaryChanged) {
        const expectedRevision =
          command.menuRenameExpectedRevisions
            ?.expectedPrimaryMenuRevision;
        if (expectedRevision === undefined) {
          throw new DomainError({ code: ERROR_CODES.REVISION_REQUIRED });
        }
        const primary = await site.compareAndSetDraftPrimaryMenu({
          expectedRevision,
          primaryMenu: patched.settings.primaryMenu,
        });
        if (!primary) {
          throw new DomainError({
            code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
            details: {
              resourceId: "primaryMenu",
              expectedRevision,
              currentRevision:
                currentBundle.revisions.primaryMenuRevision,
              conflictingPaths: ["items"],
            },
          });
        }
      }

      if (legalChanged) {
        const expectedRevision =
          command.menuRenameExpectedRevisions
            ?.expectedLegalMenuRevision;
        if (expectedRevision === undefined) {
          throw new DomainError({ code: ERROR_CODES.REVISION_REQUIRED });
        }
        const legal = await site.compareAndSetDraftLegalMenu({
          expectedRevision,
          legalMenu: patched.settings.legalMenu,
        });
        if (!legal) {
          throw new DomainError({
            code: ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
            details: {
              resourceId: "legalMenu",
              expectedRevision,
              currentRevision:
                currentBundle.revisions.legalMenuRevision,
              conflictingPaths: ["items"],
            },
          });
        }
      }
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
    command: InternalCommand["kind"],
    stage: DraftStructureTransactionStage,
  ): Promise<void> {
    await this.hook?.({ command, stage });
  }
}
