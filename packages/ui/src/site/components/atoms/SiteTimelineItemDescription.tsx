/**
 * @file packages/ui/src/site/components/atoms/SiteTimelineItemDescription.tsx
 * @layer ui/site/atoms
 *
 * @description
 * Description textuelle d’un item de timeline.
 *
 * @remarks
 * - UI-only.
 * - Tous les styles sont pilotés par `ui`.
 * - Affiche la période, le titre, le sous-titre, la description
 *   et les mots-clés éventuels.
 * - N’impose pas de balise heading pour éviter une hiérarchie HTML
 *   incohérente selon l’emplacement de la cellule dans la page.
 */

import { Badge } from "@compoz/ui/components/ui/badge";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteTimelineItemUi } from "@compoz/ui/site/site-ui.types";

export type SiteTimelineItemDescriptionProps = Readonly<{
  period: string;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: readonly string[];
  isLeft: boolean;
  ui: SiteTimelineItemUi;
}>;

export function SiteTimelineItemDescription({
  period,
  title,
  subtitle,
  description,
  keywords,
  isLeft,
  ui,
}: SiteTimelineItemDescriptionProps) {
  return (
    <div className={cn(ui.cardInner, isLeft ? ui.textLeft : ui.textRight)}>
      <p className={cn(ui.period)}>{period}</p>

      <div className={cn(ui.textBlock)}>
        <p className={cn(ui.title)}>{title}</p>

        {subtitle ? <p className={cn(ui.subtitle)}>{subtitle}</p> : null}

        {description ? (
          <p className={cn(ui.description)}>{description}</p>
        ) : null}

        {keywords?.length ? (
          <div
            className={cn(
              ui.keywordsWrap,
              isLeft ? ui.keywordsWrapLeft : ui.keywordsWrapRight,
            )}
          >
            {keywords.map((keyword, index) => (
              <Badge key={`${keyword}-${index}`} className={cn(ui.keyword)}>
                {keyword}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

SiteTimelineItemDescription.displayName = "SiteTimelineItemDescription";
