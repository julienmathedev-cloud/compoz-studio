"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteTimelineItem.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Item public individuel pour la cellule `timeline`.
 *
 * @remarks
 * - UI-only.
 * - Tous les styles sont pilotés par `ui`.
 * - Reprend la logique d’alternance gauche / droite du portfolio.
 * - Gère le décalage vertical progressif en desktop.
 */

import { cn } from "@compoz/ui/lib/utils";
import type { SiteTimelineItemUi } from "@compoz/ui/site/site-ui.types";
import { SiteTimelineItemDescription } from "@compoz/ui/site/components/atoms/SiteTimelineItemDescription";
import type { TimelineItemShape } from "@compoz/validation/pages/blocks/cells/cell";
import type { CSSProperties } from "react";

export type SiteTimelineItemProps = Readonly<{
  item: TimelineItemShape;
  index: number;
  ui: SiteTimelineItemUi;
}>;

export function SiteTimelineItem({ item, index, ui }: SiteTimelineItemProps) {
  const isLeft = index % 2 === 0;
  const margin = index > 0 ? -(80 + index * 10) : 0;

  return (
    <div className={cn(ui.root)}>
      <div
        className={cn(ui.row, isLeft ? ui.rowLeft : ui.rowRight, ui.mobileRow)}
        style={{ "--timeline-item-mt": `${margin}px` } as CSSProperties}
      >
        {!isLeft ? <div className={cn(ui.side)} /> : null}

        <div
          className={cn(
            ui.center,
            isLeft ? ui.connectorLeft : ui.connectorRight,
            ui.connector,
          )}
        />

        <div className={cn(ui.contentWrap)}>
          <div
            className={cn(
              ui.cardWrap,
              isLeft ? ui.cardWrapLeft : ui.cardWrapRight,
            )}
          >
            <div className={cn(ui.badgeWrap)}>
              <div className={cn(ui.badge)}>{item.badge ?? ""}</div>
            </div>

            <div className={cn(ui.card, isLeft ? ui.cardLeft : ui.cardRight)}>
              <SiteTimelineItemDescription
                period={item.period}
                title={item.title}
                subtitle={item.subtitle}
                description={item.description}
                keywords={item.keywords}
                isLeft={isLeft}
                ui={ui}
              />
            </div>
          </div>
        </div>

        {isLeft ? <div className={cn(ui.side)} /> : null}
      </div>
    </div>
  );
}

SiteTimelineItem.displayName = "SiteTimelineItem";
