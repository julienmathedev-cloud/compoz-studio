/**
 * @file packages/core/src/domain/pages/entities/cells/timeline.ts
 * @layer core/domain/pages
 * @description
 * Entité métier TimelineCell.
 */

export type TimelineItem = {
  id: string;
  period: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  keywords?: ReadonlyArray<string>;
};

export type TimelineCell = {
  id: string;
  kind: "timeline";
  items: ReadonlyArray<TimelineItem>;
};
