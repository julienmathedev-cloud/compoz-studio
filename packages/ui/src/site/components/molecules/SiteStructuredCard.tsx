/**
 * @file packages/ui/src/site/components/molecules/SiteStructuredCard.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Carte publique utilisée pour afficher un item de type `structuredCard`.
 *
 * @remarks
 * - UI-only.
 * - Utilisé par `StructuredCardCellRenderer`.
 * - Utilise `SiteAppImage` pour rester cohérent avec le runtime site.
 * - Tous les styles sont pilotés par `ui`.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import { SiteButton } from "@compoz/ui/site/components/atoms/SiteButton";
import type { SiteStructuredCardUi } from "@compoz/ui/site/site-ui.types";

type SiteStructuredCardButton = Readonly<{
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}>;

export type SiteStructuredCardProps = Readonly<{
  title: string;
  meta?: string;
  sections: ReadonlyArray<
    Readonly<{
      label: string;
      content: string;
    }>
  >;
  image?: Readonly<{
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }>;
  button?: SiteStructuredCardButton;
  ui: SiteStructuredCardUi;
  className?: string;
}>;

export function SiteStructuredCard({
  title,
  meta,
  sections,
  image,
  button,
  ui,
  className,
}: SiteStructuredCardProps) {
  const normalizedImage =
    image?.src?.trim() && image.width && image.height ? image : undefined;

  const visibleSections = sections.filter(
    (section) => section.label.trim() && section.content.trim(),
  );

  const normalizedButton = button?.label?.trim() ? button : undefined;

  return (
    <Card className={cn(ui.card, className)}>
      {normalizedImage ? (
        <div className={cn(ui.imageWrapper)}>
          <SiteAppImage
            image={{
              src: normalizedImage.src,
              alt: normalizedImage.alt,
              width: normalizedImage.width,
              height: normalizedImage.height,
            }}
            sizes="(max-width: 768px) 100vw, 1200px"
            className={cn(ui.image)}
          />
        </div>
      ) : null}

      <CardHeader className={cn(ui.header)}>
        <CardTitle className={cn(ui.title)}>{title}</CardTitle>

        {meta ? <p className={cn(ui.caption)}>{meta}</p> : null}

        {!meta && normalizedImage?.caption ? (
          <p className={cn(ui.caption)}>{normalizedImage.caption}</p>
        ) : null}
      </CardHeader>

      <CardContent className={cn(ui.content)}>
        <div className={cn(ui.sections)}>
          {visibleSections.map((section) => (
            <section
              key={`${section.label}-${section.content}`}
              className={cn(ui.section)}
            >
              <h3 className={cn(ui.sectionTitle)}>{section.label}</h3>
              <p className={cn(ui.sectionText)}>{section.content}</p>
            </section>
          ))}
        </div>

        {normalizedButton ? (
          <div className={cn(ui.buttonWrapper)}>
            <SiteButton
              label={normalizedButton.label}
              href={normalizedButton.href}
              variant={normalizedButton.variant}
              className={cn(ui.button)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

SiteStructuredCard.displayName = "SiteStructuredCard";
