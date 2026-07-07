/**
 * @file packages/ui/src/renderer/cells/CardCollectionCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated homogeneous card collection cell.
 *
 * @remarks
 * The cell owns the outer wrapper and selected card kind; item renderers own filtering, grid rendering, and reveal behavior.
 */

import type {
  CardCollectionCellShape,
  CardItemShape,
  ExtendedCardItemShape,
  StructuredCardItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import { CardItemsRenderer } from "@compoz/ui/renderer/items/CardItemsRenderer";
import { ExtendedCardItemsRenderer } from "@compoz/ui/renderer/items/ExtendedCardItemsRenderer";
import { StructuredCardItemsRenderer } from "@compoz/ui/renderer/items/StructuredCardItemsRenderer";
import type {
  SiteCardCollectionUi,
  SiteCardUi,
  SiteExtendedCardUi,
  SiteRevealPresetUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type CardCollectionCellRendererProps = Readonly<{
  cell?: CardCollectionCellShape | null;
  ui: SiteCardCollectionUi;
  cardUi: SiteCardUi;
  extendedCardUi: SiteExtendedCardUi;
  structuredCardUi: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardCollectionCellRenderer({
  cell,
  ui,
  cardUi,
  extendedCardUi,
  structuredCardUi,
  revealUi,
}: CardCollectionCellRendererProps) {
  if (!cell?.items?.length) return null;

  const align = cell.align;
  const reveal = cell.reveal === true;
  const cardKind = cell.cardKind;

  const content = renderCardCollectionItems({
    cell,
    cardUi,
    extendedCardUi,
    structuredCardUi,
    revealUi,
    reveal,
  });

  if (!content) return null;

  return (
    <div
      className={cn(ui.root, ui.align[align], cell.cssClassName)}
      data-cell="cardCollection"
      data-card-collection
      data-card-kind={cardKind}
      data-card-columns={cell.columns}
      data-card-align={align}
      data-reveal={reveal ? "true" : "false"}
    >
      {content}
    </div>
  );
}

CardCollectionCellRenderer.displayName = "CardCollectionCellRenderer";

type RenderCardCollectionItemsParams = Readonly<{
  cell: CardCollectionCellShape;
  cardUi: SiteCardUi;
  extendedCardUi: SiteExtendedCardUi;
  structuredCardUi: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
  reveal: boolean;
}>;

function renderCardCollectionItems({
  cell,
  cardUi,
  extendedCardUi,
  structuredCardUi,
  revealUi,
  reveal,
}: RenderCardCollectionItemsParams) {
  const cardKind = cell.cardKind;

  if (cardKind === "card") {
    return (
      <CardItemsRenderer
        items={cell.items as ReadonlyArray<CardItemShape>}
        columns={toCardColumns(cell.columns)}
        align={cell.align}
        reveal={reveal}
        ui={cardUi}
        revealUi={revealUi}
      />
    );
  }

  if (cardKind === "extendedCard") {
    return (
      <ExtendedCardItemsRenderer
        items={cell.items as ReadonlyArray<ExtendedCardItemShape>}
        columns={toStackedColumns(cell.columns)}
        align={cell.align}
        reveal={reveal}
        ui={extendedCardUi}
        revealUi={revealUi}
      />
    );
  }

  return (
    <StructuredCardItemsRenderer
      items={cell.items as ReadonlyArray<StructuredCardItemShape>}
      columns={toStackedColumns(cell.columns)}
      reveal={reveal}
      ui={structuredCardUi}
      revealUi={revealUi}
    />
  );
}

function toCardColumns(columns: CardCollectionCellShape["columns"]): 2 | 3 | 4 {
  return columns === 2 || columns === 3 || columns === 4 ? columns : 3;
}

function toStackedColumns(
  columns: CardCollectionCellShape["columns"],
): 1 | 2 | 3 {
  return columns === 1 || columns === 2 || columns === 3 ? columns : 1;
}
