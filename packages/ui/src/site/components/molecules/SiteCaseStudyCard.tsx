/**
 * @file packages/ui/src/site/components/molecules/SiteCaseStudyCard.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Carte publique utilisée pour afficher une étude de cas
 * dans la cell `caseStudyCard`.
 *
 * @remarks
 * - UI-only.
 * - Utilisé par `CaseStudyCardCellRenderer`.
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
import type { SiteCaseStudyCardUi } from "@compoz/ui/site/site-ui.types";

export type SiteCaseStudyCardProps = Readonly<{
  title: string;
  context: string;
  solution: string;
  result: string;
  image?: Readonly<{
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }>;
  ui: SiteCaseStudyCardUi;
  className?: string;
}>;

export function SiteCaseStudyCard({
  title,
  context,
  solution,
  result,
  image,
  ui,
  className,
}: SiteCaseStudyCardProps) {
  const normalizedImage =
    image?.src?.trim() && image.width && image.height ? image : undefined;

  return (
    <Card className={cn(ui.card, className)}>
      {normalizedImage ? (
        <div className={cn(ui.mediaWrap)}>
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

        {normalizedImage?.caption ? (
          <p className={cn(ui.caption)}>{normalizedImage.caption}</p>
        ) : null}
      </CardHeader>

      <CardContent className={cn(ui.content)}>
        <section className={cn(ui.section)}>
          <h3 className={cn(ui.sectionTitle)}>{ui.labels.context}</h3>
          <p className={cn(ui.sectionText)}>{context}</p>
        </section>

        <section className={cn(ui.section)}>
          <h3 className={cn(ui.sectionTitle)}>{ui.labels.solution}</h3>
          <p className={cn(ui.sectionText)}>{solution}</p>
        </section>

        <section className={cn(ui.section)}>
          <h3 className={cn(ui.sectionTitle)}>{ui.labels.result}</h3>
          <p className={cn(ui.sectionText)}>{result}</p>
        </section>
      </CardContent>
    </Card>
  );
}

SiteCaseStudyCard.displayName = "SiteCaseStudyCard";
