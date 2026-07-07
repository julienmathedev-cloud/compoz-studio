/**
 * @file packages/ui/src/site/components/atoms/SiteTimelineItemDescription.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Renders the textual content for a public site timeline item.
 *
 * @remarks
 * Does not impose a heading tag so timeline placement cannot break the surrounding HTML heading hierarchy.
 */

import { cn } from "@compoz/ui/lib/utils";
import type { SiteTimelineItemUi } from "@compoz/ui/site/site-ui.types";

export type SiteTimelineItemDescriptionProps = Readonly<{
  period: string;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: readonly string[];
  isLeft: boolean;
  ui: SiteTimelineItemUi;
}>;

export function SiteTimelineItemDescription({
  period,
  title,
  subtitle,
  description,
  keywords,
  isLeft,
  ui,
}: SiteTimelineItemDescriptionProps) {
  const textAlignClassName = isLeft ? ui.textLeft : ui.textRight;
  const keywordsWrapClassName = isLeft
    ? ui.keywordsWrapLeft
    : ui.keywordsWrapRight;

  return (
    <div className={cn(ui.cardInner, textAlignClassName)}>
      <p className={cn(ui.period)} data-timeline-period>
        {period}
      </p>

      <div className={cn(ui.textBlock)} data-timeline-text-block>
        <p className={cn(ui.title)} data-timeline-title>
          {title}
        </p>

        {subtitle ? (
          <p className={cn(ui.subtitle)} data-timeline-subtitle>
            {subtitle}
          </p>
        ) : null}

        {description ? (
          <p className={cn(ui.description)} data-timeline-description>
            {description}
          </p>
        ) : null}

        {keywords?.length ? (
          <div
            className={cn(ui.keywordsWrap, keywordsWrapClassName)}
            data-timeline-keywords
          >
            {keywords.map((keyword, index) => (
              <span
                key={keyword}
                className={cn(ui.keyword)}
                data-timeline-keyword
                data-timeline-keyword-index={index}
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

SiteTimelineItemDescription.displayName = "SiteTimelineItemDescription";
