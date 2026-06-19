/**
 * @file packages/ui/src/site/skins/default/cells/testimonials-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — testimonials cell (thème Default).
 */

import type { SiteTestimonialsUi } from "@compoz/ui/site/site-ui.types";

export const defaultTestimonialsUi: SiteTestimonialsUi = {
  root: "w-full space-y-6",
  header: "mx-auto flex max-w-3xl flex-col gap-2 text-center",
  title: "text-2xl font-semibold text-foreground md:text-3xl",
  description: "text-muted-foreground",
  staticGridOne: "mx-auto grid w-full max-w-2xl grid-cols-1 gap-6",
  staticGridTwo:
    "mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2",
  staticGridMany: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
  marqueeViewport: "overflow-hidden",
  marqueeTrack: "testimonials-marquee-track flex w-max",
  marqueeGroup: "flex shrink-0 gap-6 pr-6",
  marqueeDuplicate: "testimonials-marquee-duplicate",
  item: "min-w-0",
  staticItem: "w-full",
  marqueeItem: "w-[min(82vw,22rem)] shrink-0",
  card: "flex h-full flex-col border border-border bg-card shadow-xs",
  cardContent: "flex flex-1 flex-col gap-4",
  rating: "flex items-center gap-1 text-primary",
  star: "h-4 w-4",
  quote: "space-y-4 text-base leading-relaxed text-card-foreground",
  author: "flex items-center gap-3",
  authorImageWrapper:
    "relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted",
  authorImage: "object-cover",
  authorText: "flex min-w-0 flex-col",
  authorName: "not-italic font-medium text-card-foreground",
  authorRole: "text-sm text-muted-foreground",
} as const;
