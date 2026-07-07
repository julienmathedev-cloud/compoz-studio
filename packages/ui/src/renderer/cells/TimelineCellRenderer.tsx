/**
 * @file packages/ui/src/renderer/cells/TimelineCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated timeline cell through the shared site timeline component.
 */

import { SiteTimeline } from "@compoz/ui/site/components/organisms/SiteTimeline";
import type { SiteTimelineUi } from "@compoz/ui/site/site-ui.types";
import type { TimelineCellShape } from "@compoz/validation/pages/blocks/cells/cell";

export type TimelineCellRendererProps = Readonly<{
  cell?: TimelineCellShape | null;
  ui: SiteTimelineUi;
}>;

export function TimelineCellRenderer({ cell, ui }: TimelineCellRendererProps) {
  if (!cell) return null;
  if (!cell.items.length) return null;

  const items = cell.items.filter(
    (item) => item.id && item.period && item.title,
  );
  if (!items.length) return null;

  return <SiteTimeline items={items} collapsible={cell.collapsible} ui={ui} />;
}

TimelineCellRenderer.displayName = "TimelineCellRenderer";
