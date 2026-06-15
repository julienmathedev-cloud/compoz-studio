/**
 * @file packages/ui/src/renderer/cells/CardCollectionCellRenderer.tsx
 * @layer ui/renderer/cells
 * @description Rendu statique d’une collection homogène de cards.
 */

import type {
  CardCollectionCellShape,
  CardCollectionItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteCardCollectionItem } from "@compoz/ui/site/components/organisms/SiteCardCollectionItem";
import type {
  SiteCardCollectionUi,
  SiteCardsExtendedUi,
  SiteCardsUi,
  SiteRevealPresetUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type CardCollectionCellRendererProps = Readonly<{
  cell?: CardCollectionCellShape | null;
  ui: SiteCardCollectionUi;
  cardsUi: SiteCardsUi;
  cardsExtendedUi: SiteCardsExtendedUi;
  structuredCardUi: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardCollectionCellRenderer({
  cell,
  ui,
  cardsUi,
  cardsExtendedUi,
  structuredCardUi,
  revealUi,
}: CardCollectionCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = (cell.items as ReadonlyArray<CardCollectionItemShape>).filter(
    (item) => {
      const title = normalizeString(item.title, "");

      if (cell.cardKind !== "structuredCard") {
        return Boolean(title);
      }

      const sections =
        "sections" in item && Array.isArray(item.sections)
          ? item.sections.filter((section) => {
              const label = normalizeString(section.label, "");
              const content = normalizeString(section.content, "");
              return Boolean(label && content);
            })
          : [];

      return Boolean(title && sections.length > 0);
    },
  );

  if (items.length < 1) return null;

  const columns = cell.columns;
  const align = cell.align;
  const reveal = cell.reveal === true;
  const cols = Math.max(1, Math.floor(columns));
  const isStructuredCard = cell.cardKind === "structuredCard";

  return (
    <div
      className={cn(ui.root, ui.align[align], cell.cssClassName)}
      data-cell="cardCollection"
      data-card-cell
      data-card-collection
      data-structured-card-cell={isStructuredCard ? true : undefined}
      data-card-kind={cell.cardKind}
      data-card-columns={columns}
      data-card-align={align}
      data-reveal={reveal ? "true" : "false"}
    >
      <div
        className={cn(ui.grid, ui.columns[columns])}
        data-card-grid
        data-card-collection-grid
        data-structured-card-grid={isStructuredCard ? true : undefined}
      >
        {items.map((item, index) => {
          const seed = index % cols;

          const content = (
            <div
              className="h-full"
              data-card-content
              data-card-collection-content
              data-structured-card-content={isStructuredCard ? true : undefined}
            >
              <SiteCardCollectionItem
                item={item}
                cardKind={cell.cardKind}
                align={align}
                cardsUi={cardsUi}
                cardsExtendedUi={cardsExtendedUi}
                structuredCardUi={structuredCardUi}
              />
            </div>
          );

          return (
            <div
              key={item.id}
              className={ui.item}
              data-card-item
              data-card-collection-item
              data-structured-card-item={isStructuredCard ? true : undefined}
              data-card-index={index}
              data-card-column={seed}
              data-structured-card-index={isStructuredCard ? index : undefined}
              data-structured-card-column={isStructuredCard ? seed : undefined}
            >
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                  className={ui.item}
                >
                  {content}
                </SiteReveal>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

CardCollectionCellRenderer.displayName = "CardCollectionCellRenderer";
