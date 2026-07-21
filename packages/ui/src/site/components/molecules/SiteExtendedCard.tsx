/**
 * @file packages/ui/src/site/components/molecules/SiteExtendedCard.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders an extended public site card with optional icon, bullets, footer, button, and alignment.
 */
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import {
  SiteButton,
  type SiteButtonProps,
} from "@compoz/ui/site/components/atoms/SiteButton";
import type { SiteExtendedCardUi } from "@compoz/ui/site/site-ui.types";
import type { ReactNode } from "react";
type SiteExtendedCardButton = Pick<
  SiteButtonProps,
  "label" | "href" | "variant" | "icon" | "iconPosition"
>;
export type SiteExtendedCardProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  bullets?: readonly string[];
  footer?: string;
  button?: SiteExtendedCardButton;
  align?: "left" | "center";
  ui: SiteExtendedCardUi;
  className?: string;
}>;
export function SiteExtendedCard({
  eyebrow,
  title,
  description,
  icon,
  bullets,
  footer,
  button,
  align = "left",
  ui,
  className,
}: SiteExtendedCardProps) {
  const normalizedButton = button?.label?.trim() ? button : undefined;
  return (
    <Card className={cn(ui.card, className)}>
      <CardHeader className={cn(ui.header, ui.align[align])}>
        <div className={cn(ui.headerTop, ui.align[align])}>
          {icon ? <div aria-hidden="true">{icon}</div> : null}
          <div className="min-w-0">
            {eyebrow ? <p className={ui.eyebrow}>{eyebrow}</p> : null}
            <CardTitle className={ui.title}>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(ui.content, ui.align[align])}>
        {description ? <p className={ui.description}>{description}</p> : null}
        {bullets?.length ? (
          <ul className={cn(ui.bulletsList, ui.bulletsAlign[align])}>
            {bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      {footer || normalizedButton ? (
        <CardFooter className={cn(ui.footer, ui.footerAlign[align])}>
          {footer ? <span>{footer}</span> : null}
          {normalizedButton ? (
            <div className={ui.buttonWrapper}>
              <SiteButton
                label={normalizedButton.label}
                href={normalizedButton.href}
                variant={normalizedButton.variant}
                icon={normalizedButton.icon}
                iconPosition={normalizedButton.iconPosition}
                className={cn(ui.button)}
                ui={ui.buttonUi}
              />
            </div>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
SiteExtendedCard.displayName = "SiteExtendedCard";
