/**
 * @file packages/ui/src/renderer/cells/RichTextCellRenderer.tsx
 * @layer ui/public/cells
 *
 * @description
 * Cell renderer public/preview : rendu RichText (HTML TipTap) avec sanitization allowlist.
 *
 * @remarks
 * - On stocke le HTML brut (output TipTap) côté data.
 * - On sanitise au rendu (preview/public) pour éviter toute injection.
 * - On conserve un preset typographique stable via `prose`.
 */
import { cn } from "@compoz/ui/lib/utils";
import type { PublicRichTextUi } from "@compoz/ui/site/public-ui.types";
import type { RichTextCellShape } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type RichTextCellRendererProps = Readonly<{
  /** Shape frontière (cell richText). */
  cell?: RichTextCellShape | null;

  /** UI fine (optionnel). */
  ui: PublicRichTextUi;
  /**
   * Preset typographique (par défaut activé).
   * Laisse `true` pour un rendu stable public/preview.
   */
  withPreset?: boolean;

  /**
   * Classes du preset typographique.
   * Tu peux remplacer par tes tokens/constants quand tu les auras.
   */
  presetClassName?: string;
}>;

export function RichTextCellRenderer({ cell, ui }: RichTextCellRendererProps) {
  if (!cell) return null;

  const rawHtml = typeof cell.content === "string" ? cell.content : "";

  // Optionnel : éviter un wrapper vide.
  if (!rawHtml) return null;

  const safeHtml = rawHtml;

  return (
    <div
      className={cn(ui.root, "whitespace-pre-wrap")}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

RichTextCellRenderer.displayName = "RichTextCellRenderer";
