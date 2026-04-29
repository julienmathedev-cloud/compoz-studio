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
 * - `reveal` active/désactive l’enrobage `SiteReveal` item par item.
 */

import type { CardsCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import type {
  SiteCardsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

export type CardsCellRendererProps = Readonly<{
  cell?: CardsCellShape | null;
  ui: SiteCardsUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardsCellRenderer({
  cell,
  ui,
  revealUi,
}: CardsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 3;
  const align = cell.align ?? "left";
  const reveal = cell.reveal === true;
  const cols = Math.max(1, Math.floor(columns || 1));

  return (
    <div
      className={ui.root}
      data-cell="cards"
      data-reveal={reveal ? "true" : "false"}
    >
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");
          const seed = index % cols;

          const card = (
            <SiteCard
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

          return (
            <div key={item.id}>
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                  className={cn(ui.content)}
                >
                  {card}
                </SiteReveal>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

CardsCellRenderer.displayName = "CardsCellRenderer";
