/**
 * @file packages/ui/src/renderer/cells/CardsExtendedCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une grille de cartes étendues.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Rend une grille de `SiteExtendedCard`.
 * - Ignore les items sans titre.
 * - Les colonnes et l’alignement sont pilotés par la cell.
 * - `reveal` active/désactive l’enrobage `SiteReveal` item par item.
 */

import type { CardsExtendedCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import type {
  SiteCardsExtendedUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

export type CardsExtendedCellRendererProps = Readonly<{
  cell?: CardsExtendedCellShape | null;
  ui: SiteCardsExtendedUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardsExtendedCellRenderer({
  cell,
  ui,
  revealUi,
}: CardsExtendedCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 2;
  const align = cell.align ?? "left";
  const reveal = cell.reveal === true;
  const cols = Math.max(1, Math.floor(columns || 1));

  return (
    <div
      className={ui.root}
      data-cell="cardsExtended"
      data-reveal={reveal ? "true" : "false"}
    >
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");
          const footer = normalizeString(item.footer ?? "", "");

          const bullets = Array.isArray(item.bullets)
            ? item.bullets
                .map((bullet) => normalizeString(bullet, ""))
                .filter(Boolean)
            : [];

          const seed = index % cols;

          const card = (
            <SiteExtendedCard
              title={title}
              description={description}
              icon={
                item.icon
                  ? renderContentIcon(item.icon, { className: ui.icon })
                  : undefined
              }
              bullets={bullets}
              footer={footer || undefined}
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

CardsExtendedCellRenderer.displayName = "CardsExtendedCellRenderer";
