/**
 * @file apps/studio/src/lib/pages/block/cell-kind-meta.ts
 * @layer studio/lib/pages/block
 *
 * @description
 * Métadonnées sur les cellules de blocs (pour l’UI Studio).
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  GalleryHorizontal,
  Heading,
  History,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  LayoutList,
  ListOrdered,
  Mail,
  Minus,
  MousePointerClick,
  SeparatorHorizontal,
  Type,
} from "lucide-react";
import type { useTranslations } from "next-intl";

export type CellKind = CellDTO["kind"];

export type CellKindMeta = Readonly<{
  kind: CellKind;
  label: string;
  Icon: LucideIcon;
}>;

export function getCellKind(value: unknown): CellKind | null {
  if (!value || typeof value !== "object") return null;

  const kind = (value as { kind?: unknown }).kind;

  if (
    kind === "heading" ||
    kind === "richText" ||
    kind === "spacer" ||
    kind === "separator" ||
    kind === "buttons" ||
    kind === "cards" ||
    kind === "cardsExtended" ||
    kind === "steps" ||
    kind === "timeline" ||
    kind === "structuredCard" ||
    kind === "form" ||
    kind === "image" ||
    kind === "gallery" ||
    kind === "carousel"
  ) {
    return kind;
  }

  return null;
}

export function getCellKindIcon(kind: CellKind): LucideIcon {
  if (kind === "heading") return Heading;
  if (kind === "richText") return Type;
  if (kind === "spacer") return SeparatorHorizontal;
  if (kind === "separator") return Minus;
  if (kind === "buttons") return MousePointerClick;
  if (kind === "cards") return LayoutGrid;
  if (kind === "cardsExtended") return LayoutList;
  if (kind === "steps") return ListOrdered;
  if (kind === "timeline") return History;
  if (kind === "structuredCard") return FileText;
  if (kind === "form") return Mail;
  if (kind === "image") return ImageIcon;
  if (kind === "carousel") return GalleryHorizontal;
  return Images;
}

export function getCellKindLabel(
  kind: CellKind,
  t: ReturnType<typeof useTranslations>,
): string {
  return t(`studio.cellEditorTabs.kinds.${kind}`, {
    default: kind,
  });
}

export function getCellKindMeta(
  kind: CellKind,
  t: ReturnType<typeof useTranslations>,
): CellKindMeta {
  return {
    kind,
    label: getCellKindLabel(kind, t),
    Icon: getCellKindIcon(kind),
  };
}
