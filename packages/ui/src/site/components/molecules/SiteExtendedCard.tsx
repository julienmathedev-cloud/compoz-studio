/**
 * @file packages/ui/src/site/components/molecules/SiteExtendedCard.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders an extended public site card with optional icon, bullets, footer, and alignment.
 */

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteExtendedCardUi } from "@compoz/ui/site/site-ui.types";

export type SiteExtendedCardProps = Readonly<{
  title: string;
  description?: string;
  icon?: ReactNode;
  bullets?: readonly string[];
  footer?: string;
  align?: "left" | "center";
  ui: SiteExtendedCardUi;
  className?: string;
}>;

export function SiteExtendedCard({
  title,
  description,
  icon,
  bullets,
  footer,
  align = "left",
  ui,
  className,
}: SiteExtendedCardProps) {
  return (
    <Card className={cn(ui.card, className)}>
      <CardHeader className={cn(ui.header, ui.align[align])}>
        <div className={cn(ui.headerTop, ui.align[align])}>
          {icon ? <div aria-hidden="true">{icon}</div> : null}

          <CardTitle className={ui.title}>{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className={cn(ui.content, ui.align[align])}>
        {description ? <p className={ui.description}>{description}</p> : null}

        {bullets && bullets.length > 0 ? (
          <ul className={cn(ui.bulletsList, ui.bulletsAlign[align])}>
            {bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      {footer ? (
        <CardFooter className={cn(ui.footer, ui.footerAlign[align])}>
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

SiteExtendedCard.displayName = "SiteExtendedCard";
