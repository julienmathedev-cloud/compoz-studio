/**
 * @file packages/ui/src/site/components/molecules/SiteTimelineItem.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders a public site timeline item with alternating layout and optional desktop offset.
 *
 * @remarks
 * Receives the desktop vertical offset calculated from the previous item height to keep the staggered timeline layout balanced.
 */

import type { CSSProperties } from "react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteTimelineItemDescription } from "@compoz/ui/site/components/atoms/SiteTimelineItemDescription";
import type { SiteTimelineItemUi } from "@compoz/ui/site/site-ui.types";
import type { TimelineItemShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteTimelineItemProps = Readonly<{
  item: TimelineItemShape;
  index: number;
  ui: SiteTimelineItemUi;
  desktopOffset?: number;
}>;

export function SiteTimelineItem({
  item,
  index,
  ui,
  desktopOffset = 0,
}: SiteTimelineItemProps) {
  const isLeft = index % 2 === 0;
  const badge = normalizeString(item.badge ?? "", "");

  const itemStyle = {
    "--timeline-item-mt": `${desktopOffset}px`,
  } as CSSProperties;

  return (
    <div className={cn(ui.root)}>
      <div
        className={cn(ui.row, isLeft ? ui.rowLeft : ui.rowRight, ui.mobileRow)}
        style={itemStyle}
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
            {badge ? (
              <div className={cn(ui.badgeWrap)}>
                <div className={cn(ui.badge)}>{badge}</div>
              </div>
            ) : null}

            <div className={cn(ui.card, isLeft ? ui.cardLeft : ui.cardRight)}>
              <SiteTimelineItemDescription
                period={item.period}
                title={item.title}
                subtitle={item.subtitle ?? undefined}
                description={item.description ?? undefined}
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
