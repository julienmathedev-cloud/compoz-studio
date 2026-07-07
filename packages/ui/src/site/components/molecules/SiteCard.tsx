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
import type { SiteCardUi } from "@compoz/ui/site/site-ui.types";

export type SiteCardAlign = "left" | "center";

export type SiteCardProps = Readonly<{
  title: string;
  description: string;
  icon?: ReactNode;
  align?: SiteCardAlign;
  ui: SiteCardUi;
  className?: string;
}>;

export function SiteCard({
  title,
  description,
  icon,
  align = "left",
  ui,
  className,
}: SiteCardProps) {
  return (
    <Card className={cn(ui.card, className)}>
      <CardHeader className={cn(ui.header, ui.align[align])}>
        <div className={cn(ui.headerTop, ui.align[align])}>
          {icon ? (
            <div aria-hidden="true" className={ui.iconContainer}>
              {icon}
            </div>
          ) : null}

          <CardTitle className={ui.title}>{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className={cn(ui.content, ui.align[align])}>
        <p className={ui.description}>{description}</p>
      </CardContent>
    </Card>
  );
}

SiteCard.displayName = "SiteCard";
