/**
 * @file packages/ui/src/renderer/items/CardItemsRenderer.tsx
 * @layer ui/renderer/items
 *
 * @description
 * Renders validated simple card items as a site card grid.
 *
 * @remarks
 * Items without a title are ignored; columns, alignment, and reveal behavior are owned by the parent cell.
 */

import type { CardItemShape } from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import type {
  SiteCardUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

export type CardItemsRendererProps = Readonly<{
  items?: ReadonlyArray<CardItemShape> | null;
  columns?: 2 | 3 | 4;
  align?: "left" | "center";
  reveal?: boolean;
  ui: SiteCardUi;
  revealUi: SiteRevealPresetUi;
}>;

export function CardItemsRenderer({
  items: rawItems,
  columns = 3,
  align = "left",
  reveal = false,
  ui,
  revealUi,
}: CardItemsRendererProps) {
  if (!rawItems?.length) return null;

  const items = rawItems.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const cols = columns;

  return (
    <div
      className={ui.root}
      data-card-items
      data-card-kind="card"
      data-card-columns={columns}
      data-card-align={align}
      data-reveal={reveal ? "true" : "false"}
    >
      <div className={cn(ui.grid, ui.columns[columns])} data-card-grid>
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
            <div
              key={item.id}
              data-card-item
              data-card-index={index}
              data-card-column={seed}
            >
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                  className={cn(ui.content)}
                >
                  <div data-card-content>{card}</div>
                </SiteReveal>
              ) : (
                <div className={cn(ui.content)} data-card-content>
                  {card}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

CardItemsRenderer.displayName = "CardItemsRenderer";
