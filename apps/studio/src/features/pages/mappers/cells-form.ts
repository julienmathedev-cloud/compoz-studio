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

export function createEmptyImageEditor(): ImageEditorFormValues {
  return {
    id: createUiId(),
    src: "",
    alt: "",
    caption: "",
    href: null,
    width: undefined,
    height: undefined,
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
    icon: "",
  };
}

export function createEmptyCardsExtendedItem(): CardsExtendedItemFormValues {
  return {
    id: createUiId(),
    title: "",
    description: "",
    bullets: [],
    footer: "",
    icon: "",
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
    subtitle: "",
    description: "",
    badge: "",
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
    meta: "",
    sections: [createEmptyStructuredCardSection()],
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
    placeholder: "",
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
      subtitle: "",
      align: "left",
      variant: "default",
      separator: false,
      idAnchor: "",
      reveal: true,
      highlights: [],
    };
  }

  if (kind === "richText") {
    return { id, kind: "richText", content: "" };
  }

  if (kind === "spacer") {
    return {
      id,
      kind: "spacer",
      size: "md",
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
      items: [createEmptyCardItem()],
    };
  }

  if (kind === "cardsExtended") {
    return {
      id,
      kind: "cardsExtended",
      columns: 2,
      align: "left",
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
      items: [createEmptyStructuredCardItem()],
    };
  }

  if (kind === "form") {
    return {
      id,
      kind: "form",
      to: "mailto:",
      submitLabel: "Envoyer",
      successMessage: "",
      errorMessage: "",
      fields: [createEmptyFormField()],
    };
  }

  if (kind === "image") {
    return { id, kind: "image", image: createEmptyImageEditor() };
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
