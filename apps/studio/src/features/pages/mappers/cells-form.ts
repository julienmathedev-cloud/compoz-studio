/**
 * @file apps/studio/src/features/pages/mappers/cells-form.ts
 * @layer studio/features/pages/mappers
 *
 * @description
 * Studio cell form mappers, UI-safe normalizers, validation normalizers, and empty form factories.
 *
 * @remarks
 * - Keeps nested cell item collections safe for RHF field arrays.
 * - Separates UI-safe normalization from stricter validation normalization for optional structured-card media and CTA fields.
 * - Does not own draft/published state; callers provide the content-state context.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type {
  CardCollectionCardKind,
  CarouselItemKind,
} from "@compoz/core/domain/pages/entities/cell";
import { isContentIconKind } from "@compoz/ui/lib/icons/content-icons";
import { toCellShapeFromDTO } from "@compoz/ui/pages/mappers/cell-shape";
import type {
  ButtonItemFormValues,
  ButtonPresentationFormValues,
  CardCollectionCardKindFormValues,
  CardCollectionItemFormValues,
  CardItemFormValues,
  CarouselItemFormValues,
  CellFormValues,
  ExtendedCardItemFormValues,
  FormFieldFormValues,
  FormSubmitButtonFormValues,
  ImageEditorFormValues,
  SpacerCellFormValues,
  StepItemFormValues,
  StructuredCardItemFormValues,
  StructuredCardSectionFormValues,
  TestimonialItemFormValues,
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

function normalizeCssClassName(
  cssClassName: CellFormValues["cssClassName"] | undefined,
): CellFormValues["cssClassName"] {
  return String(cssClassName ?? "").trim();
}

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;

type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
type ButtonIconPosition = "before" | "after";

function normalizeButtonPresentation(
  button: ButtonPresentationFormValues | undefined,
  fallbackLabel: string,
): ButtonPresentationFormValues {
  const iconValue =
    button?.icon && isContentIconKind(button.icon) ? button.icon : null;

  const iconPosition: ButtonIconPosition =
    button?.iconPosition === "after" ? "after" : "before";

  const variant: ButtonVariant =
    button?.variant && BUTTON_VARIANTS.includes(button.variant)
      ? button.variant
      : "default";

  return {
    label: button?.label?.trim() ?? fallbackLabel,
    variant,
    icon: iconValue,
    iconPosition,
  };
}

function normalizeTestimonialItem(
  item: TestimonialItemFormValues,
): TestimonialItemFormValues {
  return {
    ...item,
    quote: item.quote?.trim() ?? "",
    authorName: item.authorName?.trim() ?? "",
    authorRole: item.authorRole?.trim() ? item.authorRole.trim() : undefined,
    authorImage: item.authorImage?.trim() ? item.authorImage.trim() : undefined,
    rating: item.rating,
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
    icon: null,
    iconPosition: "before",
  };
}

export function createEmptyFormSubmitButton(): FormSubmitButtonFormValues {
  return {
    label: "Envoyer",
    variant: "default",
    icon: null,
    iconPosition: "before",
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

export function createEmptyExtendedCardItem(): ExtendedCardItemFormValues {
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

export function createEmptyTestimonialItem(): TestimonialItemFormValues {
  return {
    id: createUiId(),
    quote: "",
    authorName: "",
    authorRole: undefined,
    authorImage: undefined,
    rating: undefined,
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

export function createEmptyCarouselItem(
  itemKind: CarouselItemKind,
): CarouselItemFormValues {
  if (itemKind === "image") {
    return createEmptyImageEditor();
  }

  if (itemKind === "card") {
    return createEmptyCardItem();
  }

  if (itemKind === "extendedCard") {
    return createEmptyExtendedCardItem();
  }

  return createEmptyStructuredCardItem();
}

export function createEmptyCardCollectionItem(
  cardKind: CardCollectionCardKindFormValues | CardCollectionCardKind,
): CardCollectionItemFormValues {
  if (cardKind === "card") {
    return createEmptyCardItem();
  }

  if (cardKind === "extendedCard") {
    return createEmptyExtendedCardItem();
  }

  return createEmptyStructuredCardItem();
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
      cssClassName: "",
      level: "h2",
      title: "",
      subtitle: null,
      align: "left",
      variant: "default",
      separator: false,
      idAnchor: null,
      reveal: false,
      highlights: [],
    };
  }

  if (kind === "richText") {
    return {
      id,
      kind: "richText",
      cssClassName: "",
      content: "",
      reveal: false,
    };
  }

  if (kind === "spacer") {
    return {
      id,
      kind: "spacer",
      cssClassName: "",
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
      cssClassName: "",
      align: "center",
      size: "md",
    };
  }

  if (kind === "buttons") {
    return {
      id,
      kind: "buttons",
      cssClassName: "",
      align: "left",
      gap: "md",
      items: [createEmptyButtonItem()],
    };
  }

  if (kind === "cardCollection") {
    return {
      id,
      kind: "cardCollection",
      cssClassName: "",
      cardKind: "card",
      columns: 3,
      align: "left",
      reveal: false,
      items: [createEmptyCardItem()],
    };
  }

  if (kind === "steps") {
    return {
      id,
      kind: "steps",
      cssClassName: "",
      variant: "vertical",
      items: [createEmptyStepItem()],
    };
  }

  if (kind === "testimonials") {
    return {
      id,
      kind: "testimonials",
      cssClassName: "",
      title: undefined,
      description: undefined,
      displayMode: "static",
      items: [createEmptyTestimonialItem()],
    };
  }

  if (kind === "timeline") {
    return {
      id,
      kind: "timeline",
      cssClassName: "",
      collapsible: true,
      items: [createEmptyTimelineItem()],
    };
  }

  if (kind === "form") {
    return {
      id,
      kind: "form",
      cssClassName: "",
      to: "",
      submitButton: createEmptyFormSubmitButton(),
      successMessage: null,
      errorMessage: null,
      fields: [createEmptyFormField()],
    };
  }

  if (kind === "image") {
    return {
      id,
      kind: "image",
      cssClassName: "",
      image: createEmptyImageEditor(),
      variant: "default",
      size: "full",
      reveal: false,
      zoomEnabled: false,
    };
  }

  if (kind === "carousel") {
    return {
      id,
      kind: "carousel",
      cssClassName: "",
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
    cssClassName: "",
    linksEnabled: false,
    maxColumns: 3,
    reveal: false,
    items: [createEmptyImageEditor()],
  };
}

export function toCellFormValuesFromDTO(cell: CellDTO): CellFormValues {
  return toCellShapeFromDTO(cell);
}

// Structured card item UI-safe normalization.
export function normalizeStructuredCardButton(
  button: StructuredCardItemFormValues["button"],
): StructuredCardItemFormValues["button"] {
  if (!button) {
    return createEmptyButtonItem();
  }

  return {
    ...button,
    ...normalizeButtonPresentation(button, ""),
    href: button.href?.trim() ?? "",
  };
}

export function normalizeStructuredCardImage(
  image: StructuredCardItemFormValues["image"],
): StructuredCardItemFormValues["image"] {
  if (!image) {
    return createEmptyImageEditor();
  }

  return {
    ...image,
    src: image.src?.trim() ?? "",
    alt: image.alt?.trim() ?? "",
    caption: image.caption?.trim() ? image.caption.trim() : null,
    href: image.href?.trim() ? image.href.trim() : null,
    width: typeof image.width === "number" && image.width > 0 ? image.width : 0,
    height:
      typeof image.height === "number" && image.height > 0 ? image.height : 0,
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

// Structured card item validation normalization.

export function toStructuredCardButtonForValidation(
  button: StructuredCardItemFormValues["button"],
): StructuredCardItemFormValues["button"] {
  if (!button) return null;

  const label = button.label?.trim() ?? "";
  const href = button.href?.trim() ?? "";
  const presentation = normalizeButtonPresentation(button, "");

  if (!label) {
    return null;
  }

  return {
    ...button,
    ...presentation,
    label,
    href,
  };
}

export function toStructuredCardImageForValidation(
  image: StructuredCardItemFormValues["image"],
): StructuredCardItemFormValues["image"] {
  if (!image) return null;

  const src = image.src?.trim() ?? "";
  const alt = image.alt?.trim() ?? "";
  const caption = image.caption?.trim() ? image.caption.trim() : null;
  const href = image.href?.trim() ? image.href.trim() : null;
  const width =
    typeof image.width === "number" && image.width > 0 ? image.width : 0;
  const height =
    typeof image.height === "number" && image.height > 0 ? image.height : 0;

  const isCompletelyEmpty =
    src.length === 0 &&
    alt.length === 0 &&
    !caption &&
    !href &&
    width <= 0 &&
    height <= 0;

  if (isCompletelyEmpty) {
    return null;
  }

  return {
    ...image,
    src,
    alt,
    caption,
    href,
    width,
    height,
  };
}

export function toStructuredCardItemForValidation(
  item: StructuredCardItemFormValues,
): StructuredCardItemFormValues {
  return {
    ...item,
    image: toStructuredCardImageForValidation(item.image),
    button: toStructuredCardButtonForValidation(item.button),
  };
}

// Carousel and card collection item normalization helpers.

function normalizeCarouselItem(
  itemKind: CarouselItemKind,
  item: CarouselItemFormValues,
): CarouselItemFormValues {
  if (itemKind === "structuredCard") {
    return normalizeStructuredCardItem(item as StructuredCardItemFormValues);
  }

  return item;
}

function normalizeCarouselItemForValidation(
  itemKind: CarouselItemKind,
  item: CarouselItemFormValues,
): CarouselItemFormValues {
  if (itemKind === "structuredCard") {
    return toStructuredCardItemForValidation(
      item as StructuredCardItemFormValues,
    );
  }

  return item;
}

function normalizeCardCollectionItem(
  cardKind: CardCollectionCardKind,
  item: CardCollectionItemFormValues,
): CardCollectionItemFormValues {
  if (cardKind === "structuredCard") {
    return normalizeStructuredCardItem(item as StructuredCardItemFormValues);
  }

  return item;
}

function normalizeCardCollectionItemForValidation(
  cardKind: CardCollectionCardKind,
  item: CardCollectionItemFormValues,
): CardCollectionItemFormValues {
  if (cardKind === "structuredCard") {
    return toStructuredCardItemForValidation(
      item as StructuredCardItemFormValues,
    );
  }

  return item;
}

export function toCellFormValuesForValidation(
  cell: CellFormValues,
): CellFormValues {
  const normalizedCssClassName = normalizeCssClassName(cell.cssClassName);

  if (cell.kind === "testimonials") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      title: cell.title?.trim() ? cell.title.trim() : undefined,
      description: cell.description?.trim()
        ? cell.description.trim()
        : undefined,
      items: cell.items.map(normalizeTestimonialItem),
    };
  }

  if (cell.kind === "form") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      submitButton: normalizeButtonPresentation(cell.submitButton, "Envoyer"),
    };
  }

  if (cell.kind === "buttons") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      items: cell.items.map((item) => ({
        ...item,
        ...normalizeButtonPresentation(item, ""),
        href: item.href?.trim() ?? "",
      })),
    };
  }

  if (cell.kind === "carousel") {
    const itemKind = cell.itemKind;

    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      itemKind,
      items: cell.items.map((item) =>
        normalizeCarouselItemForValidation(
          itemKind,
          item as CarouselItemFormValues,
        ),
      ),
    };
  }

  if (cell.kind === "cardCollection") {
    const cardKind = cell.cardKind;

    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      cardKind,
      items: cell.items.map((item) =>
        normalizeCardCollectionItemForValidation(
          cardKind,
          item as CardCollectionItemFormValues,
        ),
      ),
    };
  }

  if (cell.kind === "spacer") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      visibility: normalizeSpacerVisibility(cell.visibility),
    };
  }

  if (cell.kind === "image") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      zoomEnabled: cell.zoomEnabled ?? false,
    };
  }

  return {
    ...cell,
    cssClassName: normalizedCssClassName,
  };
}

export function normalizeCellFormValues(cell: CellFormValues): CellFormValues {
  const normalizedCssClassName = normalizeCssClassName(cell.cssClassName);

  if (cell.kind === "testimonials") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      title: cell.title?.trim() ? cell.title.trim() : undefined,
      description: cell.description?.trim()
        ? cell.description.trim()
        : undefined,
      items: cell.items.map(normalizeTestimonialItem),
    };
  }

  if (cell.kind === "form") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      submitButton: normalizeButtonPresentation(cell.submitButton, "Envoyer"),
    };
  }

  if (cell.kind === "buttons") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      items: cell.items.map((item) => ({
        ...item,
        ...normalizeButtonPresentation(item, ""),
        href: item.href?.trim() ?? "",
      })),
    };
  }

  if (cell.kind === "carousel") {
    const itemKind = cell.itemKind;

    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      itemKind,
      items: cell.items.map((item) =>
        normalizeCarouselItem(itemKind, item as CarouselItemFormValues),
      ),
    };
  }

  if (cell.kind === "cardCollection") {
    const cardKind = cell.cardKind;

    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      cardKind,
      items: cell.items.map((item) =>
        normalizeCardCollectionItem(
          cardKind,
          item as CardCollectionItemFormValues,
        ),
      ),
    };
  }

  if (cell.kind === "spacer") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      visibility: normalizeSpacerVisibility(cell.visibility),
    };
  }

  if (cell.kind === "image") {
    return {
      ...cell,
      cssClassName: normalizedCssClassName,
      zoomEnabled: cell.zoomEnabled ?? false,
    };
  }

  return {
    ...cell,
    cssClassName: normalizedCssClassName,
  };
}
