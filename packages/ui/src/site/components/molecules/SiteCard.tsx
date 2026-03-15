"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteCard.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Carte publique simple utilisée par les cellules marketing du site.
 *
 * @remarks
 * - Repose sur les primitives Card ShadCN.
 * - Sert de brique UI pour les grilles de type `cards`.
 * - Gère un titre, une description et une icône textuelle optionnelle.
 * - L’alignement est piloté par le parent via prop `align`.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";

export type SiteCardAlign = "left" | "center";

export type SiteCardProps = Readonly<{
  title: string;
  description: string;
  icon?: string;
  align?: SiteCardAlign;
  className?: string;
}>;

export function SiteCard({
  title,
  description,
  icon,
  align = "left",
  className,
}: SiteCardProps) {
  const isCentered = align === "center";

  return (
    <Card
      className={cn(
        "h-full border-border/60 bg-background/80 shadow-sm",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "space-y-3",
          isCentered ? "items-center text-center" : "items-start text-left",
        )}
      >
        {icon ? (
          <div
            className={cn(
              "text-2xl leading-none",
              isCentered ? "text-center" : "text-left",
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}

        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
      </CardHeader>

      <CardContent className={cn(isCentered ? "text-center" : "text-left")}>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

SiteCard.displayName = "SiteCard";
