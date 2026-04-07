/**
 * @file apps/studio/src/components/molecules/feedback/EmptyState.tsx
 * @layer studio/molecules
 *
 * @description
 * État vide générique pour l’interface Studio (icône + texte).
 *
 * @remarks
 * - Molecule UI : compose `StudioIcon`, `Text` et la primitive `Empty` (UI shared).
 * - Fournit un message non bloquant pour les listes ou sections sans contenu.
 * - Icône optionnelle, normalisée via `StudioIcon`.
 * - Strictement UI-only : aucune logique métier.
 */

import type { StudioIconProps } from "@compoz/studio/components/atoms/StudioIcon";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Empty, EmptyDescription } from "@compoz/ui/components/ui/empty";
import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `EmptyState`.
 */
type EmptyStateProps = Readonly<{
  /** Texte principal affiché dans l’état vide. */
  text?: string;

  /** Icône optionnelle rendue via `StudioIcon`. */
  icon?: StudioIconProps["icon"];

  /** Classes additionnelles appliquées au conteneur. */
  className?: string;
}>;

/**
 * Affiche un état vide standardisé (Studio).
 */
export function EmptyState({ text, icon, className }: EmptyStateProps) {
  return (
    <Empty className={cn(className)} visualMode="studio">
      {/* Description centralisée, typographiée via Text */}
      <EmptyDescription>
        {/* Icône grisée si fournie */}
        {icon && <StudioIcon icon={icon} />}

        {text && (
          <Text as="span" variant="muted" className="text-center">
            {text}
          </Text>
        )}
      </EmptyDescription>
    </Empty>
  );
}

EmptyState.displayName = "EmptyState";
