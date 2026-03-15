/**
 * @file packages/ui/src/site/components/molecules/SiteExtendedCard.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Carte étendue utilisée pour afficher des contenus riches
 * dans les cells `cardsExtended`.
 *
 * @remarks
 * - UI-only.
 * - Utilisé par `CardsExtendedCellRenderer`.
 * - Supporte :
 *   - icon
 *   - title
 *   - description
 *   - bullets
 *   - footer
 */

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";

export type SiteExtendedCardProps = Readonly<{
  title: string;
  description?: string;
  icon?: string;
  bullets?: readonly string[];
  footer?: string;
  align?: "left" | "center";
  className?: string;
}>;

export function SiteExtendedCard({
  title,
  description,
  icon,
  bullets,
  footer,
  align = "left",
  className,
}: SiteExtendedCardProps) {
  const isCentered = align === "center";

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader
        className={cn(
          "flex flex-col gap-2",
          isCentered && "items-center text-center",
        )}
      >
        {icon ? <div className="text-2xl">{icon}</div> : null}

        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-3",
          isCentered && "items-center text-center",
        )}
      >
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}

        {bullets && bullets.length > 0 ? (
          <ul
            className={cn(
              "flex flex-col gap-1 text-sm",
              isCentered ? "items-center" : "items-start",
            )}
          >
            {bullets.map((bullet, index) => (
              <li key={index}>• {bullet}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      {footer ? (
        <CardFooter
          className={cn(
            "text-sm text-muted-foreground",
            isCentered && "justify-center text-center",
          )}
        >
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

SiteExtendedCard.displayName = "SiteExtendedCard";
