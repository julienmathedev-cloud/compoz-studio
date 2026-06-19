/**
 * @file packages/core/src/domain/pages/entities/items/structured-card-item.ts
 * @layer core/domain/pages
 *
 * @description
 * Domain entities representing structured card items.
 *
 * @remarks
 * A structured card item provides richer content than a simple or extended
 * card: optional image, title, optional meta, descriptive sections, and an
 * optional CTA button.
 *
 * Layout concerns such as columns or reveal behavior are handled by
 * higher-level cells such as `cardCollection` or `carousel`.
 */

import type { ButtonItem } from "@compoz/core/domain/pages/entities/cells/buttons";
import type { ImageEditor } from "@compoz/core/domain/pages/entities/cells/image-editor";

export type StructuredCardSection = {
  id: string;
  label: string;
  content: string;
};

export type StructuredCardItem = {
  id: string;
  image: ImageEditor | null;
  title: string;
  meta: string | null;
  sections: ReadonlyArray<StructuredCardSection>;
  button: ButtonItem | null;
};
