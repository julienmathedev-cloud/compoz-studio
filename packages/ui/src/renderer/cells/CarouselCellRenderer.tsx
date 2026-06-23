/**
 * @file packages/ui/src/renderer/cells/CarouselCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Site/preview renderer for a homogeneous carousel or slider based on
 * `variant` and `itemKind`.
 *
 * @remarks
 * - UI-only: consumes an already validated cell shape.
 * - Normalizes image/card-like items into `NormalizedCarouselItem`.
 * - Delegates the visual rendering to `SiteCarousel` or `SiteSlider`.
 */

import type {
  CardItemShape,
  CarouselCellShape,
  ExtendedCardItemShape,
  ImageEditorShape,
  StructuredCardItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { SiteCarousel } from "@compoz/ui/site/components/organisms/SiteCarousel";
import { SiteSlider } from "@compoz/ui/site/components/organisms/SiteSlider";
import type { NormalizedCarouselItem } from "@compoz/ui/site/components/organisms/carousel-item.types";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type CarouselCellRendererProps = Readonly<{
  cell?: CarouselCellShape | null;
  ui: SiteCarouselUi;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

export function CarouselCellRenderer({
  cell,
  ui,
  isFullBleed = false,
  priority = false,
}: CarouselCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = normalizeCarouselItems(cell);

  if (items.length === 0) return null;

  if (cell.variant === "slider") {
    return (
      <SiteSlider
        items={items}
        ui={ui}
        showDots={cell.showDots}
        showArrows={cell.showArrows}
        isFullBleed={isFullBleed}
        priority={priority}
      />
    );
  }

  return (
    <SiteCarousel
      items={items}
      ui={ui}
      showDots={cell.showDots}
      showArrows={cell.showArrows}
      isFullBleed={isFullBleed}
      priority={priority}
    />
  );
}

CarouselCellRenderer.displayName = "CarouselCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function normalizeCarouselItems(
  cell: CarouselCellShape,
): NormalizedCarouselItem[] {
  const itemKind = cell.itemKind;

  if (itemKind === "image") {
    return cell.items
      .map((item) => normalizeImageItem(item as ImageEditorShape))
      .filter((item): item is NormalizedCarouselItem => Boolean(item));
  }

  if (itemKind === "card") {
    return cell.items
      .map((item) => normalizeCardItem(item as CardItemShape))
      .filter((item): item is NormalizedCarouselItem => Boolean(item));
  }

  if (itemKind === "extendedCard") {
    return cell.items
      .map((item) => normalizeExtendedCardItem(item as ExtendedCardItemShape))
      .filter((item): item is NormalizedCarouselItem => Boolean(item));
  }

  return cell.items
    .map((item) => normalizeStructuredCardItem(item as StructuredCardItemShape))
    .filter((item): item is NormalizedCarouselItem => Boolean(item));
}

function normalizeImageItem(
  item: ImageEditorShape,
): NormalizedCarouselItem | null {
  const src = normalizeString(item.src, "");
  if (!src) return null;

  return {
    kind: "image",
    id: item.id,
    src,
    alt: normalizeString(item.alt, ""),
    width: item.width,
    height: item.height,
    caption:
      typeof item.caption === "string"
        ? normalizeString(item.caption, "")
        : undefined,
  };
}

function normalizeCardItem(item: CardItemShape): NormalizedCarouselItem | null {
  const title = normalizeString(item.title, "");
  if (!title) return null;

  return {
    kind: "card",
    id: item.id,
    title,
    description: normalizeString(item.description, ""),
    icon: normalizeString(item.icon ?? "", "") || undefined,
  };
}

function normalizeExtendedCardItem(
  item: ExtendedCardItemShape,
): NormalizedCarouselItem | null {
  const title = normalizeString(item.title, "");
  if (!title) return null;

  return {
    kind: "extendedCard",
    id: item.id,
    title,
    description: normalizeString(item.description, ""),
    bullets: item.bullets
      .map((bullet) => normalizeString(bullet, ""))
      .filter(Boolean),
    footer: normalizeString(item.footer ?? "", "") || undefined,
    icon: normalizeString(item.icon ?? "", "") || undefined,
  };
}

function normalizeStructuredCardItem(
  item: StructuredCardItemShape,
): NormalizedCarouselItem | null {
  const title = normalizeString(item.title, "");
  if (!title) return null;

  const sections = item.sections
    .map((section) => ({
      label: normalizeString(section.label, ""),
      content: normalizeString(section.content, ""),
    }))
    .filter((section) => Boolean(section.label && section.content));

  if (sections.length === 0) return null;

  const image =
    item.image?.src &&
    item.image.width &&
    item.image.height &&
    normalizeString(item.image.src, "")
      ? {
          src: normalizeString(item.image.src, ""),
          alt: normalizeString(item.image.alt, ""),
          width: item.image.width,
          height: item.image.height,
          caption: normalizeString(
            typeof item.image.caption === "string" ? item.image.caption : "",
            "",
          ),
        }
      : undefined;

  const button =
    item.button && normalizeString(item.button.label, "")
      ? {
          label: normalizeString(item.button.label, ""),
          href: normalizeString(item.button.href, ""),
          variant: item.button.variant,
        }
      : undefined;

  return {
    kind: "structuredCard",
    id: item.id,
    title,
    meta: normalizeString(item.meta ?? "", "") || undefined,
    sections,
    image,
    button,
  };
}
