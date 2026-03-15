/**
 * @file packages/ui/src/renderer/cells/CarouselCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un carousel ou slider
 * homogène basé sur `variant` + `itemKind`.
 */

import type {
  CardItemShape,
  CardsExtendedItemShape,
  CarouselCellShape,
  CaseStudyCardItemShape,
  ImageEditorShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import { SiteCaseStudyCard } from "@compoz/ui/site/components/molecules/SiteCaseStudyCard";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import { SiteCarousel } from "@compoz/ui/site/components/organisms/SiteCarousel";
import { SiteSlider } from "@compoz/ui/site/components/organisms/SiteSlider";
import type { SiteCarouselUi } from "@compoz/ui/site/site-ui.types";

export type CarouselCellRendererProps = Readonly<{
  cell?: CarouselCellShape | null;
  ui: SiteCarouselUi;
  isFullBleed?: boolean;
  priority?: boolean;
}>;

type NormalizedImageItem = Readonly<{
  kind: "image";
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}>;

type NormalizedCardItem = Readonly<{
  kind: "card";
  id: string;
  title: string;
  description: string;
  icon?: string;
}>;

type NormalizedCardsExtendedItem = Readonly<{
  kind: "cardsExtended";
  id: string;
  title: string;
  description: string;
  bullets: string[];
  footer?: string;
  icon?: string;
}>;

type NormalizedCaseStudyCardItem = Readonly<{
  kind: "caseStudyCard";
  id: string;
  title: string;
  context: string;
  solution: string;
  result: string;
  image?: Readonly<{
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }>;
}>;

type NormalizedCarouselItem =
  | NormalizedImageItem
  | NormalizedCardItem
  | NormalizedCardsExtendedItem
  | NormalizedCaseStudyCardItem;

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
        ui={ui.slider}
        showDots={cell.showDots}
        showArrows={cell.showArrows}
        renderItem={(item, ctx) =>
          renderCarouselItem({
            item,
            ui,
            isFullBleed,
            priority: priority && ctx.index === 0,
            isActive: ctx.isActive,
          })
        }
      />
    );
  }

  return (
    <SiteCarousel
      items={items}
      ui={ui.carousel}
      showDots={cell.showDots}
      showArrows={cell.showArrows}
      renderItem={(item, ctx) =>
        renderCarouselItem({
          item,
          ui,
          isFullBleed,
          priority: priority && ctx.index === 0,
          isActive: ctx.isActive,
        })
      }
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
  if (cell.itemKind === "image") {
    return cell.items
      .map((item) => normalizeImageItem(item as ImageEditorShape))
      .filter(Boolean) as NormalizedImageItem[];
  }

  if (cell.itemKind === "card") {
    return cell.items
      .map((item) => normalizeCardItem(item as CardItemShape))
      .filter(Boolean) as NormalizedCardItem[];
  }

  if (cell.itemKind === "cardsExtended") {
    return cell.items
      .map((item) => normalizeCardsExtendedItem(item as CardsExtendedItemShape))
      .filter(Boolean) as NormalizedCardsExtendedItem[];
  }

  return cell.items
    .map((item) => normalizeCaseStudyCardItem(item as CaseStudyCardItemShape))
    .filter(Boolean) as NormalizedCaseStudyCardItem[];
}

function normalizeImageItem(
  item: ImageEditorShape,
): NormalizedImageItem | null {
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

function normalizeCardItem(item: CardItemShape): NormalizedCardItem | null {
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

function normalizeCardsExtendedItem(
  item: CardsExtendedItemShape,
): NormalizedCardsExtendedItem | null {
  const title = normalizeString(item.title, "");
  if (!title) return null;

  return {
    kind: "cardsExtended",
    id: item.id,
    title,
    description: normalizeString(item.description, ""),
    bullets: Array.isArray(item.bullets)
      ? item.bullets
          .map((bullet) => normalizeString(bullet, ""))
          .filter(Boolean)
      : [],
    footer: normalizeString(item.footer ?? "", "") || undefined,
    icon: normalizeString(item.icon ?? "", "") || undefined,
  };
}

function normalizeCaseStudyCardItem(
  item: CaseStudyCardItemShape,
): NormalizedCaseStudyCardItem | null {
  const title = normalizeString(item.title, "");
  const context = normalizeString(item.context, "");
  const solution = normalizeString(item.solution, "");
  const result = normalizeString(item.result, "");

  if (!title || !context || !solution || !result) return null;

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

  return {
    kind: "caseStudyCard",
    id: item.id,
    title,
    context,
    solution,
    result,
    image,
  };
}

function renderCarouselItem({
  item,
  ui,
  isFullBleed,
  priority,
  isActive,
}: Readonly<{
  item: NormalizedCarouselItem;
  ui: SiteCarouselUi;
  isFullBleed: boolean;
  priority: boolean;
  isActive: boolean;
}>) {
  if (item.kind === "image") {
    return (
      <div
        className={
          isFullBleed ? ui.imageItem.fillContainer : ui.imageItem.ratioContainer
        }
      >
        <SiteAppImage
          image={{
            src: item.src,
            alt: item.alt,
            width: item.width,
            height: item.height,
          }}
          fill
          sizes="100vw"
          className={ui.imageItem.image}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>
    );
  }

  if (item.kind === "card") {
    return (
      <div
        className={isActive ? ui.contentItem.active : ui.contentItem.inactive}
      >
        <SiteCard
          title={item.title}
          description={item.description}
          icon={item.icon}
        />
      </div>
    );
  }

  if (item.kind === "cardsExtended") {
    return (
      <div
        className={isActive ? ui.contentItem.active : ui.contentItem.inactive}
      >
        <SiteExtendedCard
          title={item.title}
          description={item.description}
          bullets={item.bullets}
          footer={item.footer}
          icon={item.icon}
          align="left"
        />
      </div>
    );
  }

  return (
    <div className={isActive ? ui.contentItem.active : ui.contentItem.inactive}>
      <SiteCaseStudyCard
        title={item.title}
        context={item.context}
        solution={item.solution}
        result={item.result}
        image={item.image}
        ui={ui.caseStudyCard}
      />
    </div>
  );
}
