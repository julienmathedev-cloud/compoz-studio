/**
 * @file packages/core/src/domain/pages/entities/items/card-item.ts
 * @layer core/domain/pages
 * @description Simple card item domain entity.
 * @remarks
 * Layout concerns are handled by higher-level cells such as `cardCollection` or `carousel`.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";
import type { ButtonItem } from "@compoz/core/domain/pages/entities/cells/buttons";

export type CardItem = {
  id: string;
  eyebrow: string | null;
  title: string;
  description: string;
  icon: ContentIconKind | null;
  button: ButtonItem | null;
};
