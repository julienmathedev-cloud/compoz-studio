/**
 * @file packages/core/src/domain/site/use-cases/status/site-diff.ts
 * @layer core/domain
 *
 * @description
 * Helpers de diff draft vs published (pages / blocks) utilisés par les use-cases status.
 *
 * @remarks
 * - Pages : diff basé sur `meta.updatedAt` (V0.5).
 * - Blocks : diff basé sur une comparaison JSON (V0.5).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  SiteDiffKind,
  SiteStatusBlockDetails,
  SiteStatusPageDetails,
} from "@compoz/core/domain/site/entities/site-status-details";

/* -------------------------------------------------------------------------------------------------
 * Helpers génériques
 * ------------------------------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------------------------------
 * Page diff
 * ------------------------------------------------------------------------------------------------- */

/**
 * Détermine le diff d'une page entre draft et published.
 *
 * Règles V0.5 :
 * - draft && !published => new
 * - !draft && published => deleted
 * - draft && published =>
 *   - meta.updatedAt différent => modified
 *   - sinon => published (équivalent "up to date" côté liste)
 */
export function pageDiffKind(
  draft?: Page | null,
  published?: Page | null,
): SiteDiffKind {
  if (draft && !published) return "new";
  if (!draft && published) return "deleted";
  if (!draft || !published) return "published";

  const du = String(draft.meta?.updatedAt ?? "");
  const pu = String(published.meta?.updatedAt ?? "");

  // Si un des deux manque, on considère "published" (pas de preuve de modif).
  if (!du || !pu) return "published";

  return du !== pu ? "modified" : "published";
}

/* -------------------------------------------------------------------------------------------------
 * Block diff
 * ------------------------------------------------------------------------------------------------- */

type BlockMap = Map<string, Block>;

function toBlockMap(blocks: ReadonlyArray<Block>): BlockMap {
  const m = new Map<string, Block>();
  for (const b of blocks) {
    const id = typeof b?.id === "string" ? b.id : "";
    if (id) m.set(id, b);
  }
  return m;
}

/**
 * Détermine le diff d'un block entre draft et published.
 *
 * Règles V0.5 :
 * - draft && !published => new
 * - !draft && published => deleted
 * - draft && published => JSON différent => modified, sinon published
 */
export function blockDiffKind(draft?: Block, published?: Block): SiteDiffKind {
  if (draft && !published) return "new";
  if (!draft && published) return "deleted";
  if (!draft || !published) return "published";

  return safeStringify(draft) !== safeStringify(published)
    ? "modified"
    : "published";
}

/**
 * Construit le read-model blocks pour une page (items + counts + hasChanges).
 */
export function buildBlockDetails(
  draftBlocks: ReadonlyArray<Block>,
  publishedBlocks: ReadonlyArray<Block>,
): {
  items: ReadonlyArray<SiteStatusBlockDetails>;
  counts: SiteStatusPageDetails["blocks"];
  /** new + modified + deleted (sert au filtre scope=dirty) */
  hasChanges: boolean;
} {
  const draftMap = toBlockMap(draftBlocks);
  const pubMap = toBlockMap(publishedBlocks);

  let blocksNew = 0;
  let blocksModified = 0;
  let blocksDeleted = 0;

  const allIds = new Set<string>([...draftMap.keys(), ...pubMap.keys()]);
  const items: SiteStatusBlockDetails[] = [];

  for (const id of allIds) {
    const d = draftMap.get(id);
    const p = pubMap.get(id);

    const diff = blockDiffKind(d, p);

    if (diff === "new") blocksNew++;
    if (diff === "modified") blocksModified++;
    if (diff === "deleted") blocksDeleted++;

    const type =
      typeof d?.type === "string"
        ? d.type
        : typeof p?.type === "string"
          ? p.type
          : undefined;

    const title =
      typeof d?.title === "string"
        ? d.title
        : typeof p?.title === "string"
          ? p.title
          : undefined;

    items.push({ id, type, title, diff });
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
