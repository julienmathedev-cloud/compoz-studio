/**
 * @file packages/ui/src/site/components/organisms/SiteCardCollectionItem.tsx
 * @layer ui/site/components
 * @description Rendu d’un item homogène de CardCollectionCell.
 */

import type {
  CardCollectionCardKindShape,
  CardCollectionItemShape,
  CardItemShape,
  ExtendedCardItemShape,
  StructuredCardItemShape,
} from "@compoz/validation/pages/blocks/cells/cell";

import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { SiteCard } from "@compoz/ui/site/components/molecules/SiteCard";
import { SiteExtendedCard } from "@compoz/ui/site/components/molecules/SiteExtendedCard";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type {
  SiteExtendedCardUi,
  SiteCardUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type SiteCardCollectionItemProps = Readonly<{
  item: CardCollectionItemShape;
  cardKind: CardCollectionCardKindShape;
  align: "left" | "center";
  cardUi: SiteCardUi;
  extendedCardUi: SiteExtendedCardUi;
  structuredCardUi: SiteStructuredCardUi;
}>;

type PublicButtonIconPosition = "before" | "after";

function normalizePublicButtonIconPosition(
  iconPosition: string | null | undefined,
): PublicButtonIconPosition {
  return iconPosition === "after" ? "after" : "before";
}

export function SiteCardCollectionItem({
  item,
  cardKind,
  align,
  cardUi,
  extendedCardUi,
  structuredCardUi,
}: SiteCardCollectionItemProps) {
  if (cardKind === "card") {
    const card = item as CardItemShape;

    return (
      <SiteCard
        title={normalizeString(card.title, "")}
        description={normalizeString(card.description, "")}
        icon={
          card.icon
            ? renderContentIcon(card.icon, { className: cardUi.icon })
            : undefined
        }
        align={align}
        ui={cardUi}
      />
    );
  }

  if (cardKind === "extendedCard") {
    const card = item as ExtendedCardItemShape;
    const bullets = Array.isArray(card.bullets)
      ? card.bullets
          .map((bullet) => normalizeString(bullet, ""))
          .filter(Boolean)
      : [];

    return (
      <SiteExtendedCard
        title={normalizeString(card.title, "")}
        description={normalizeString(card.description, "")}
        bullets={bullets}
        footer={normalizeString(card.footer ?? "", "") || undefined}
        icon={
          card.icon
            ? renderContentIcon(card.icon, {
                className: extendedCardUi.icon,
              })
            : undefined
        }
        align={align}
        ui={extendedCardUi}
      />
    );
  }

  const card = item as StructuredCardItemShape;
  const sections = (card.sections ?? [])
    .map((section) => ({
      label: normalizeString(section.label, ""),
      content: normalizeString(section.content, ""),
    }))
    .filter((section) => Boolean(section.label && section.content));

  const imageSrc = normalizeString(card.image?.src ?? "", "");
  const image =
    card.image?.width && card.image.height && imageSrc
      ? {
          src: imageSrc,
          alt: normalizeString(card.image.alt, ""),
          width: card.image.width,
          height: card.image.height,
          caption: normalizeString(card.image.caption ?? "", "") || undefined,
        }
      : undefined;

  const buttonLabel = card.button ? normalizeString(card.button.label, "") : "";
  const buttonHref = card.button ? normalizeString(card.button.href, "") : "";

  const button =
    card.button && buttonLabel && buttonHref
      ? {
          label: buttonLabel,
          href: buttonHref,
          variant: card.button.variant,
          icon: card.button.icon,
          iconPosition: normalizePublicButtonIconPosition(
            card.button.iconPosition,
          ),
        }
      : undefined;

  return (
    <SiteStructuredCard
      title={normalizeString(card.title, "")}
      meta={normalizeString(card.meta ?? "", "") || undefined}
      sections={sections}
      image={image}
      button={button}
      ui={structuredCardUi}
    />
  );
}

SiteCardCollectionItem.displayName = "SiteCardCollectionItem";
