"use client";

/**
 * @file apps/studio/src/components/molecules/feedback/EmptyState.tsx
 * @layer ui/molecules
 *
 * @description
 * État vide générique pour l’interface d’administration (icône + texte).
 *
 * @remarks
 * - Molecule UI : compose `AdminIcon`, `Text` et la primitive `Empty` (UI shared).
 * - Fournit un message non bloquant pour les listes ou sections sans contenu.
 * - Icône optionnelle, normalisée via `AdminIcon`.
 * - Strictement UI-only : aucune logique métier.
 */

import {
  AdminIcon,
  type AdminIconProps,
} from "@compoz/studio/components/atoms/AdminIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Empty, EmptyDescription } from "@compoz/ui/components/ui/empty";
import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `EmptyState`.
 */
type EmptyStateProps = Readonly<{
  /** Texte principal affiché dans l’état vide. */
  text?: string;
  /** Icône optionnelle rendue via `AdminIcon`. */
  icon?: AdminIconProps["icon"];

  /** Classes additionnelles appliquées au conteneur. */
  className?: string;
}>;

/**
 * Affiche un état vide standardisé (admin).
 */
export function EmptyState({ text, icon, className }: EmptyStateProps) {
  return (
    <Empty className={cn(className)}>
      {/* Description centralisée, typographiée via Text */}
      <EmptyDescription>
        {/* Icône grisée si fournie */}
        {icon && <AdminIcon icon={icon} />}
        {text && (
          <Text as="p" variant="muted" className="text-center">
            {text}
          </Text>
        )}
      </EmptyDescription>
    </Empty>
  );
}

EmptyState.displayName = "EmptyState";
