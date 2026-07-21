/**
 * @file packages/ui/src/renderer/items/ExtendedCardItemsRenderer.tsx
 * @layer ui/renderer/items
 *
 * @description
 * Renders validated extended card items as a site card grid.
 *
 * @remarks
 * Items without a title are ignored; columns, alignment, and reveal behavior are owned by the parent cell.
 */

import type { ExtendedCardItemShape } from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import type {
  SiteExtendedCardUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

export type ExtendedCardItemsRendererProps = Readonly<{
  items?: ReadonlyArray<ExtendedCardItemShape> | null;
  columns?: 1 | 2 | 3;
  align?: "left" | "center";
  reveal?: boolean;
  ui: SiteExtendedCardUi;
  revealUi: SiteRevealPresetUi;
}>;

export function ExtendedCardItemsRenderer({
  items: rawItems,
  columns = 2,
  align = "left",
  reveal = false,
  ui,
  revealUi,
}: ExtendedCardItemsRendererProps) {
  if (!rawItems?.length) return null;

  const items = rawItems.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  return (
    <div
      className={ui.root}
      data-card-items
      data-card-kind="extendedCard"
      data-card-columns={columns}
      data-card-align={align}
      data-reveal={reveal ? "true" : "false"}
    >
      <div className={cn(ui.grid, ui.columns[columns])} data-card-grid>
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");
          const footer = normalizeString(item.footer ?? "", "");

          const bullets = item.bullets
            .map((bullet) => normalizeString(bullet, ""))
            .filter(Boolean);

          const seed = index % columns;

          const card = (
            <SiteExtendedCard
              eyebrow={item.eyebrow ?? undefined}
              title={title}
              description={description}
              icon={
                item.icon
                  ? renderContentIcon(item.icon, { className: ui.icon })
                  : undefined
              }
              bullets={bullets}
              footer={footer || undefined}
              button={item.button ?? undefined}
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
              className="h-full"
            >
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                  className={cn(ui.content)}
                >
                  <div data-card-content className="h-full">
                    {card}
                  </div>
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

ExtendedCardItemsRenderer.displayName = "ExtendedCardItemsRenderer";
