/**
 * @file packages/ui/src/renderer/cells/CardCollectionCellRenderer.tsx
 * @layer ui/renderer/cells
 * @description Rendu statique d’une collection homogène de cards.
 */

import type {
  CardCollectionCardColumns,
  CardCollectionStackedColumns,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  CardCollectionCellShape,
  CardItemShape,
  CardsExtendedItemShape,
  StructuredCardItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { CardsCellRenderer } from "@compoz/ui/renderer/cells/CardsCellRenderer";
import { CardsExtendedCellRenderer } from "@compoz/ui/renderer/cells/CardsExtendedCellRenderer";
import { StructuredCardCellRenderer } from "@compoz/ui/renderer/cells/StructuredCardCellRenderer";
import { cn } from "@compoz/ui/lib/utils";
import type {
  SiteCardsExtendedUi,
  SiteCardsUi,
  SiteRevealPresetUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type CardCollectionCellRendererProps = Readonly<{
  cell?: CardCollectionCellShape | null;
  cardsUi: SiteCardsUi;
  cardsExtendedUi: SiteCardsExtendedUi;
  structuredCardUi: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardCollectionCellRenderer({
  cell,
  cardsUi,
  cardsExtendedUi,
  structuredCardUi,
  revealUi,
}: CardCollectionCellRendererProps) {
  if (!cell?.items?.length) return null;

  if (cell.cardKind === "card") {
    return (
      <CardsCellRenderer
        cell={{
          id: cell.id,
          kind: "cards",
          cssClassName: cell.cssClassName,
          columns: cell.columns as CardCollectionCardColumns,
          align: cell.align,
          reveal: cell.reveal,
          items: cell.items as CardItemShape[],
        }}
        ui={cardsUi}
        revealUi={revealUi}
      />
    );
  }

  if (cell.cardKind === "cardsExtended") {
    return (
      <CardsExtendedCellRenderer
        cell={{
          id: cell.id,
          kind: "cardsExtended",
          cssClassName: cell.cssClassName,
          columns: cell.columns as CardCollectionStackedColumns,
          align: cell.align,
          reveal: cell.reveal,
          items: cell.items as CardsExtendedItemShape[],
        }}
        ui={cardsExtendedUi}
        revealUi={revealUi}
      />
    );
  }

  return (
    <div className={cn(cell.align === "center" ? "text-center" : "text-left")}>
      <StructuredCardCellRenderer
        cell={{
          id: cell.id,
          kind: "structuredCard",
          cssClassName: cell.cssClassName,
          columns: cell.columns as CardCollectionStackedColumns,
          reveal: cell.reveal,
          items: cell.items as StructuredCardItemShape[],
        }}
        ui={structuredCardUi}
        revealUi={revealUi}
      />
    </div>
  );
}

CardCollectionCellRenderer.displayName = "CardCollectionCellRenderer";
