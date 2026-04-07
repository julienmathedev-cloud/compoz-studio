/**
 * @file apps/studio/src/features/pages/mappers/cells-form.ts
 * @layer ui/studio/pages/mappers
 *
 * @description
 * Mappers de formulaires studio pour les cells.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import { toCellShapeFromDTO } from "@compoz/ui/pages/mappers/cell-shape";
import type {
  ButtonItemFormValues,
  CardItemFormValues,
  CardsExtendedItemFormValues,
  CarouselItemFormValues,
  CellFormValues,
  FormFieldFormValues,
  ImageEditorFormValues,
  SpacerCellFormValues,
  StepItemFormValues,
  StructuredCardItemFormValues,
  StructuredCardSectionFormValues,
  TimelineItemFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";

function createUiId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeSpacerVisibility(
  visibility: SpacerCellFormValues["visibility"] | undefined,
): SpacerCellFormValues["visibility"] {
  return {
    mobile: visibility?.mobile ?? true,
    tablet: visibility?.tablet ?? true,
    desktop: visibility?.desktop ?? true,
  };
}

export function createEmptyImageEditor(): ImageEditorFormValues {
  return {
    id: createUiId(),
    src: "",
    alt: "",
    caption: null,
    href: null,
    width: 0,
    height: 0,
  };
}

export function createEmptyButtonItem(): ButtonItemFormValues {
  return {
    id: createUiId(),
    label: "",
    href: "",
    variant: "default",
  };
}

export function createEmptyCardItem(): CardItemFormValues {
  return {
    id: createUiId(),
    title: "",
    description: "",
    icon: null,
  };
}

export function createEmptyCardsExtendedItem(): CardsExtendedItemFormValues {
  return {
    id: createUiId(),
    title: "",
    description: "",
    bullets: [],
    footer: null,
    icon: null,
  };
}

export function createEmptyStepItem(): StepItemFormValues {
  return {
    id: createUiId(),
    title: "",
    description: "",
  };
}

export function createEmptyTimelineItem(): TimelineItemFormValues {
  return {
    id: createUiId(),
    period: "",
    title: "",
    subtitle: null,
    description: null,
    badge: null,
    keywords: [],
  };
}

export function createEmptyStructuredCardSection(): StructuredCardSectionFormValues {
  return {
    id: createUiId(),
    label: "",
    content: "",
  };
}

export function createEmptyStructuredCardItem(): StructuredCardItemFormValues {
  return {
    id: createUiId(),
    image: createEmptyImageEditor(),
    title: "",
    meta: null,
    sections: [createEmptyStructuredCardSection()],
    button: createEmptyButtonItem(),
  };
}

export function createEmptyCarouselCardItem(): CardItemFormValues {
  return createEmptyCardItem();
}

export function createEmptyCarouselCardsExtendedItem(): CardsExtendedItemFormValues {
  return createEmptyCardsExtendedItem();
}

export function createEmptyCarouselStructuredCardItem(): StructuredCardItemFormValues {
  return createEmptyStructuredCardItem();
}

export function createEmptyCarouselItem(
  itemKind: "image" | "card" | "cardsExtended" | "structuredCard",
): CarouselItemFormValues {
  if (itemKind === "image") {
    return createEmptyImageEditor();
  }

  if (itemKind === "card") {
    return createEmptyCarouselCardItem();
  }

  if (itemKind === "cardsExtended") {
    return createEmptyCarouselCardsExtendedItem();
  }

  return createEmptyCarouselStructuredCardItem();
}

export function createEmptyFormField(): FormFieldFormValues {
  return {
    id: createUiId(),
    name: "",
    label: "",
    type: "text",
    placeholder: null,
    required: true,
  };
}

export function createEmptyCell(kind: CellFormValues["kind"]): CellFormValues {
  const id = createUiId();

  if (kind === "heading") {
    return {
      id,
      kind: "heading",
      level: "h2",
      title: "",
      subtitle: null,
      align: "left",
      variant: "default",
      separator: false,
      idAnchor: null,
      reveal: true,
      highlights: [],
    };
  }

  if (kind === "richText") {
    return {
      id,
      kind: "richText",
      content: "",
      reveal: true,
    };
  }

  if (kind === "spacer") {
    return {
      id,
      kind: "spacer",
      size: "md",
      visibility: {
        mobile: true,
        tablet: true,
        desktop: true,
      },
    };
  }

  if (kind === "separator") {
    return {
      id,
      kind: "separator",
      align: "center",
      size: "md",
    };
  }

  if (kind === "buttons") {
    return {
      id,
      kind: "buttons",
      align: "left",
      gap: "md",
      items: [createEmptyButtonItem()],
    };
  }

  if (kind === "cards") {
    return {
      id,
      kind: "cards",
      columns: 3,
      align: "left",
      reveal: true,
      items: [createEmptyCardItem()],
    };
  }

  if (kind === "cardsExtended") {
    return {
      id,
      kind: "cardsExtended",
      columns: 2,
      align: "left",
      reveal: true,
      items: [createEmptyCardsExtendedItem()],
    };
  }

  if (kind === "steps") {
    return {
      id,
      kind: "steps",
      variant: "vertical",
      items: [createEmptyStepItem()],
    };
  }

  if (kind === "timeline") {
    return {
      id,
      kind: "timeline",
      items: [createEmptyTimelineItem()],
    };
  }

  if (kind === "structuredCard") {
    return {
      id,
      kind: "structuredCard",
      columns: 1,
      reveal: true,
      items: [createEmptyStructuredCardItem()],
    };
  }

  if (kind === "form") {
    return {
      id,
      kind: "form",
      to: "mailto:",
      submitLabel: "Envoyer",
      successMessage: null,
      errorMessage: null,
      fields: [createEmptyFormField()],
    };
  }

  if (kind === "image") {
    return {
      id,
      kind: "image",
      image: createEmptyImageEditor(),
      variant: "default",
      size: "full",
      reveal: true,
    };
  }

  if (kind === "carousel") {
    return {
      id,
      kind: "carousel",
      variant: "carousel",
      showDots: true,
      showArrows: false,
      itemKind: "image",
      items: [createEmptyImageEditor()],
    };
  }

  return {
    id,
    kind: "gallery",
    linksEnabled: false,
    maxColumns: 3,
    reveal: true,
    items: [createEmptyImageEditor()],
  };
}

export function toCellFormValuesFromDTO(cell: CellDTO): CellFormValues {
  return toCellShapeFromDTO(cell);
}

export function ensureCellsLength(
  cells: ReadonlyArray<CellFormValues>,
  columns: 1 | 2 | 3,
): CellFormValues[] {
  const output = Array.from(cells ?? []).slice(0, columns);

  while (output.length < columns) {
    output.push(createEmptyCell("richText"));
  }

  return output;
}

export function normalizeStructuredCardButton(
  button: StructuredCardItemFormValues["button"],
): StructuredCardItemFormValues["button"] {
  if (!button) return null;

  const isEmptyLabel = !button.label || !button.label.trim();

  // 👉 règle métier : pas de label = pas de bouton
  if (isEmptyLabel) {
    return null;
  }

  return {
    ...button,
    label: button.label.trim(),
    href: button.href?.trim() ?? "",
  };
}

export function normalizeStructuredCardImage(
  image: StructuredCardItemFormValues["image"],
): StructuredCardItemFormValues["image"] {
  if (!image) return null;

  const isEmptySrc = !image.src || !image.src.trim();
  const isEmptyAlt = !image.alt || !image.alt.trim();
  const isEmptyCaption = !image.caption || !image.caption.trim();
  const isEmptyHref = !image.href || !image.href.trim();
  const hasInvalidWidth = !image.width || image.width <= 0;
  const hasInvalidHeight = !image.height || image.height <= 0;

  const isCompletelyEmpty =
    isEmptySrc &&
    isEmptyAlt &&
    isEmptyCaption &&
    isEmptyHref &&
    hasInvalidWidth &&
    hasInvalidHeight;

  // 👉 règle métier : image entièrement vide = pas d’image
  if (isCompletelyEmpty) {
    return null;
  }

  return {
    ...image,
    src: image.src.trim(),
    alt: image.alt.trim(),
    caption: image.caption?.trim() ? image.caption.trim() : null,
    href: image.href?.trim() ? image.href.trim() : null,
  };
}

export function normalizeStructuredCardItem(
  item: StructuredCardItemFormValues,
): StructuredCardItemFormValues {
  return {
    ...item,
    image: normalizeStructuredCardImage(item.image),
    button: normalizeStructuredCardButton(item.button),
  };
}

export function normalizeCellFormValues(cell: CellFormValues): CellFormValues {
  if (cell.kind === "structuredCard") {
    return {
      ...cell,
      items: cell.items.map(normalizeStructuredCardItem),
    };
  }

  if (cell.kind === "spacer") {
    return {
      ...cell,
      visibility: normalizeSpacerVisibility(cell.visibility),
    };
  }

  return cell;
}
