/**
 * @file packages/ui/src/renderer/cells/RichTextCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu RichText (HTML TipTap).
 *
 * @remarks
 * - On stocke le HTML brut (output TipTap) côté data.
 * - Ce composant rend le HTML tel quel via `dangerouslySetInnerHTML`.
 * - La sanitization (allowlist) doit être gérée en amont (pipeline de contenu) ou ajoutée dans une passe dédiée.
 */

import type { RichTextCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteRichTextUi } from "@compoz/ui/site/site-ui.types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type RichTextCellRendererProps = Readonly<{
  /** Shape frontière (cell richText). */
  cell?: RichTextCellShape | null;

  /** UI fine (skin). */
  ui: SiteRichTextUi;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function RichTextCellRenderer({ cell, ui }: RichTextCellRendererProps) {
  if (!cell) return null;

  const html = typeof cell.content === "string" ? cell.content : "";
  if (!html) return null;

  return (
    <div
      className={cn(
        ui.root,
        "whitespace-pre-wrap [&_p:empty]:min-h-[1em] [&_p:empty]:my-1",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

RichTextCellRenderer.displayName = "RichTextCellRenderer";
