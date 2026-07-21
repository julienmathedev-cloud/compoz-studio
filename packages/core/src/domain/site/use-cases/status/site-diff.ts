/**
 * @file packages/core/src/domain/site/use-cases/status/site-diff.ts
 * @layer core/domain/site/use-cases/status
 * @description Pure draft versus published diff helpers for pages and blocks.
 * @remarks
 * Page diffs compare the current semantic state while ignoring the technical
 * `meta.updatedAt` audit timestamp. Block diffs intentionally use JSON
 * comparison in V0.5.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  SiteDiffKind,
  SiteStatusBlockDetails,
  SiteStatusPageDetails,
} from "@compoz/core/domain/site/entities/site-status-details";

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function asNonEmptyString(input: unknown): string | undefined {
  const s = String(input ?? "").trim();

  return s ? s : undefined;
}

/**
 * Removes only the technical update timestamp from page comparison.
 *
 * Blocks deliberately remain part of the comparable value so that block
 * content changes and block reordering both modify the owning page.
 */
function toComparablePage(page: Readonly<Page>) {
  const { meta, ...pageWithoutMeta } = page;

  if (!meta) {
    return pageWithoutMeta;
  }

  const { updatedAt: _updatedAt, ...metaWithoutUpdatedAt } = meta;

  return {
    ...pageWithoutMeta,
    meta: metaWithoutUpdatedAt,
  };
}

export function pageDiffKind(
  draft?: Page | null,
  published?: Page | null,
): SiteDiffKind {
  if (draft && !published) return "new";
  if (!draft && published) return "deleted";
  if (!draft || !published) return "published";

  return safeStringify(toComparablePage(draft)) !==
    safeStringify(toComparablePage(published))
    ? "modified"
    : "published";
}

type BlockMap = Map<string, Block>;

function toBlockMap(blocks: ReadonlyArray<Block>): BlockMap {
  const map = new Map<string, Block>();

  for (const block of blocks) {
    const id = typeof block?.id === "string" ? block.id : "";

    if (id) {
      map.set(id, block);
    }
  }

  return map;
}

export function blockDiffKind(draft?: Block, published?: Block): SiteDiffKind {
  if (draft && !published) return "new";
  if (!draft && published) return "deleted";
  if (!draft || !published) return "published";

  return safeStringify(draft) !== safeStringify(published)
    ? "modified"
    : "published";
}

export function buildBlockDetails(
  draftBlocks: ReadonlyArray<Block>,
  publishedBlocks: ReadonlyArray<Block>,
): {
  items: ReadonlyArray<SiteStatusBlockDetails>;
  counts: SiteStatusPageDetails["blocks"];
  hasChanges: boolean;
} {
  const draftMap = toBlockMap(draftBlocks);
  const publishedMap = toBlockMap(publishedBlocks);

  let blocksNew = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;

  // Stable order keeps cached snapshots and admin output deterministic.
  const allIds = Array.from(
    new Set<string>([...draftMap.keys(), ...publishedMap.keys()]),
  ).sort();

  const items: SiteStatusBlockDetails[] = [];

  for (const id of allIds) {
    const draft = draftMap.get(id);
    const published = publishedMap.get(id);

    const diff = blockDiffKind(draft, published);

    if (diff === "new") blocksNew++;
    if (diff === "modified") blocksModified++;
    if (diff === "deleted") blocksDeleted++;

    const type =
      typeof draft?.type === "string"
        ? draft.type
        : typeof published?.type === "string"
          ? published.type
          : undefined;

    const name =
      typeof draft?.name === "string"
        ? draft.name
        : typeof published?.name === "string"
          ? published.name
          : undefined;

    items.push({
      id,
      type,
      name,
      diff,
    });
  }

  const hasChanges = blocksNew + blocksModified + blocksDeleted > 0;

  return {
    items,
    hasChanges,
    counts: {
      draft: draftBlocks.length,
      published: publishedBlocks.length,
      modified: blocksModified,
      new: blocksNew,
      deleted: blocksDeleted,
    },
  };
}
