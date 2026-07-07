/**
 * @file packages/core/src/domain/site/use-cases/status/site-diff.ts
 * @layer core/domain/site/use-cases/status
 * @description Pure draft versus published diff helpers for pages and blocks.
 * @remarks
 * Page diffs use `meta.updatedAt`; block diffs intentionally use JSON comparison in V0.5.
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

export function pageDiffKind(
  draft?: Page | null,
  published?: Page | null,
): SiteDiffKind {
  if (draft && !published) return "new";
  if (!draft && published) return "deleted";
  if (!draft || !published) return "published";

  const du = String(draft.meta?.updatedAt ?? "");
  const pu = String(published.meta?.updatedAt ?? "");

  // Missing timestamps are treated as no proven modification.
  if (!du || !pu) return "published";

  return du !== pu ? "modified" : "published";
}

type BlockMap = Map<string, Block>;

function toBlockMap(blocks: ReadonlyArray<Block>): BlockMap {
  const m = new Map<string, Block>();
  for (const b of blocks) {
    const id = typeof b?.id === "string" ? b.id : "";
    if (id) m.set(id, b);
  }
  return m;
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
  const pubMap = toBlockMap(publishedBlocks);

  let blocksNew = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;

  // Stable order keeps KV snapshots and admin output deterministic.
  const allIds = Array.from(
    new Set<string>([...draftMap.keys(), ...pubMap.keys()]),
  ).sort();

  const items: SiteStatusBlockDetails[] = [];

  for (const id of allIds) {
    const d = draftMap.get(id);
    const p = pubMap.get(id);

    // Compare once when both block versions exist.
    const diff =
      d && p
        ? safeStringify(d) !== safeStringify(p)
          ? "modified"
          : "published"
        : blockDiffKind(d, p);

    if (diff === "new") blocksNew++;
    if (diff === "modified") blocksModified++;
    if (diff === "deleted") blocksDeleted++;

    const type =
      typeof d?.type === "string"
        ? d.type
        : typeof p?.type === "string"
          ? p.type
          : undefined;

    const name =
      typeof d?.name === "string"
        ? d.name
        : typeof p?.name === "string"
          ? p.name
          : undefined;

    items.push({ id, type, name, diff });
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
