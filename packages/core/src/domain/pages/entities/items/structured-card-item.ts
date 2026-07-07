/***
 * @file packages/core/src/domain/pages/entities/items/structured-card-item.ts
 * @layer core/domain/pages
 * @description Structured card item domain entity.
 * @remarks
 * Layout concerns are handled by higher-level cells such as `cardCollection` or `carousel`.
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
