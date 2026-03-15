/**
 * @file packages/ui/src/renderer/cells/CardsExtendedCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une grille de cartes étendues.
 */

import type { CardsExtendedCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import type { SiteCardsExtendedUi } from "@compoz/ui/site/site-ui.types";

export type CardsExtendedCellRendererProps = Readonly<{
  cell?: CardsExtendedCellShape | null;
  ui: SiteCardsExtendedUi;
}>;

export function CardsExtendedCellRenderer({
  cell,
  ui,
}: CardsExtendedCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 2;
  const align = cell.align ?? "left";

  return (
    <div className={ui.root} data-cell="cardsExtended">
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");
          const icon = normalizeString(item.icon ?? "", "");
          const footer = normalizeString(item.footer ?? "", "");

          const bullets = Array.isArray(item.bullets)
            ? item.bullets
                .map((bullet) => normalizeString(bullet, ""))
                .filter(Boolean)
            : [];

          return (
            <SiteExtendedCard
              key={item.id}
              title={title}
              description={description}
              icon={icon || undefined}
              bullets={bullets}
              footer={footer || undefined}
              align={align}
            />
          );
        })}
      </div>
    </div>
  );
}

CardsExtendedCellRenderer.displayName = "CardsExtendedCellRenderer";
