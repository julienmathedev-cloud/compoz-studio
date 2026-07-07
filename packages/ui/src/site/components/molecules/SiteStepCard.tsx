/**
 * @file packages/ui/src/site/components/molecules/SiteStepCard.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders a public site step card with a numbered badge, title, optional description, and alignment variant.
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
        {isCentered ? (
          <div className={ui.headerBalanced}>
            <div className={ui.headerBadgeSlot}>
              <div className={ui.badge} aria-hidden="true">
                {step}
              </div>
            </div>

            <CardTitle className={ui.title}>{title}</CardTitle>

            <div className={ui.headerSpacerSlot} aria-hidden="true" />
          </div>
        ) : (
          <>
            <div className={ui.badge} aria-hidden="true">
              {step}
            </div>

            <CardTitle className={ui.title}>{title}</CardTitle>
          </>
        )}
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
