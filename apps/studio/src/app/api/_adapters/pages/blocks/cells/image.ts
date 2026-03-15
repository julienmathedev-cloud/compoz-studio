/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/image.ts
 */

import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  ImageCell,
  ImageEditor,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  ImageCellIntentDTO,
  ImageEditorIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptImage(dto: ImageEditorIntentDTO): ImageEditor {
  return {
    id: trimOrKeep(dto.id),
    src: trimOrKeep(dto.src),
    alt: typeof dto.alt === "string" ? trimOrKeep(dto.alt) : dto.alt,
    caption:
      typeof dto.caption === "string" ? trimOrKeep(dto.caption) : dto.caption,
    href: typeof dto.href === "string" ? trimOrKeep(dto.href) : dto.href,
    width: dto.width ?? 0,
    height: dto.height ?? 0,
  };
}

export function adaptImageCell(dto: ImageCellIntentDTO): ImageCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "image",
    variant: dto.variant,
    image: adaptImage(dto.image),
  };
}
