/**
 * @file packages/ui/src/site/components/molecules/SiteStepCard.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Carte de step utilisée par la cellule `steps`.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteStepCardUi } from "@compoz/ui/site/site-ui.types";

export type SiteStepCardProps = Readonly<{
  step: number;
  title: string;
  description?: string;
  align?: "left" | "center";
  ui: SiteStepCardUi;
}>;

export function SiteStepCard({
  step,
  title,
  description,
  align = "left",
  ui,
}: SiteStepCardProps) {
  const isCentered = align === "center";
  const alignClassName = isCentered ? ui.align.center : ui.align.left;

  return (
    <Card className={ui.root}>
      <CardHeader className={cn(ui.header, alignClassName)}>
        <div className={ui.badge} aria-hidden="true">
          {step}
        </div>

        <CardTitle className={ui.title}>{title}</CardTitle>
      </CardHeader>

      {description ? (
        <CardContent className={cn(ui.content, alignClassName)}>
          <p className={ui.description}>{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

SiteStepCard.displayName = "SiteStepCard";
