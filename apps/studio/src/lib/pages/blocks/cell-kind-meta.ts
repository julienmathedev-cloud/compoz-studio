/**
 * @file apps/studio/src/lib/pages/blocks/cell-kind-meta.ts
 * @layer studio/lib/pages/block
 *
 * @description
 * Studio UI metadata for block cells.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { LucideIcon } from "lucide-react";
import {
  GalleryHorizontal,
  Heading,
  History,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  ListOrdered,
  Mail,
  MessageSquareQuote,
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
    kind === "cardCollection" ||
    kind === "steps" ||
    kind === "testimonials" ||
    kind === "timeline" ||
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
  if (kind === "cardCollection") return LayoutGrid;
  if (kind === "steps") return ListOrdered;
  if (kind === "testimonials") return MessageSquareQuote;
  if (kind === "timeline") return History;
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
