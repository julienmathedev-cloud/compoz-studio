/**
 * @file packages/ui/src/renderer/cells/CardsCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une grille de cartes.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Rend une grille de `SiteCard`.
 * - Ignore les items sans titre.
 * - Les colonnes et l’alignement sont pilotés par la cell.
 */

import type { CardsCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import type { SiteCardsUi } from "@compoz/ui/site/site-ui.types";

export type CardsCellRendererProps = Readonly<{
  cell?: CardsCellShape | null;
  ui: SiteCardsUi;
}>;

export function CardsCellRenderer({ cell, ui }: CardsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 3;
  const align = cell.align ?? "left";

  return (
    <div className={ui.root} data-cell="cards">
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");

          return (
            <SiteCard
              key={item.id}
              title={title}
              description={description}
              icon={
                item.icon
                  ? renderContentIcon(item.icon, { className: ui.icon })
                  : undefined
              }
              align={align}
              ui={ui}
            />
          );
        })}
      </div>
    </div>
  );
}

CardsCellRenderer.displayName = "CardsCellRenderer";
