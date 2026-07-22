/**
 * @file packages/ui/src/site/components/molecules/SiteCard.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders a simple public site card for marketing-oriented cell grids.
 *
 * @remarks
 * Uses shared card primitives while leaving alignment and visual styling to the parent-provided skin classes.
 */

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import {
  SiteButton,
  type SiteButtonProps,
} from "@compoz/ui/site/components/atoms/SiteButton";
import type { SiteCardUi } from "@compoz/ui/site/site-ui.types";

export type SiteCardAlign = "left" | "center";

type SiteCardButton = Pick<
  SiteButtonProps,
  "label" | "href" | "variant" | "icon" | "iconPosition"
>;

export type SiteCardProps = Readonly<{
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  button?: SiteCardButton;
  align?: SiteCardAlign;
  ui: SiteCardUi;
  className?: string;
}>;

export function SiteCard({
  eyebrow,
  title,
  description,
  icon,
  button,
  align = "left",
  ui,
  className,
}: SiteCardProps) {
  const normalizedButton = button?.label?.trim() ? button : undefined;

  return (
    <Card className={cn(ui.card, className)}>
      <CardHeader className={cn(ui.header, ui.align[align])}>
        <div className={cn(ui.headerTop, ui.align[align])}>
          {icon ? (
            <div aria-hidden="true" className={ui.iconContainer}>
              {icon}
            </div>
          ) : null}

          <div className={cn(ui.headerTitle, "min-w-0")}>
            {eyebrow ? <p className={ui.eyebrow}>{eyebrow}</p> : null}

            <CardTitle className={ui.title}>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(ui.content, ui.align[align])}>
        <p className={ui.description}>{description}</p>

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
      </CardContent>
    </Card>
  );
}

SiteCard.displayName = "SiteCard";
