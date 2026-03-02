"use client";

/**
 * @file apps/studio/src/components/atoms/LoadingStatus.tsx
 * @layer ui/atoms
 *
 * @description
 * Statut de chargement accessible pour l’interface d’administration.
 *
 * @remarks
 * - Atome UI : aucune logique métier.
 * - Utilise `role="status"` + `aria-live="polite"` pour l’annonce.
 * - Peut afficher un spinner via `AdminIcon`.
 * - Le label SR est toujours rendu dans le DOM (à masquer via classes si nécessaire).
 */

import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Spinner } from "@compoz/ui/components/ui/spinner";
import { useTranslations } from "next-intl";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Props du composant `LoadingStatus`.
 */
export type LoadingStatusProps = Readonly<{
  label?: string;
  children?: ReactNode;
  withSpinner?: boolean;
  className?: string;
}> &
  HTMLAttributes<HTMLSpanElement>;

/**
 * Affiche un statut de chargement (admin).
 */
export function LoadingStatus({
  label,
  children,
  withSpinner = true,
  ...rest
}: LoadingStatusProps) {
  const t = useTranslations();
  const desc = label ?? t("common.loading");

  return (
    <span role="status" aria-live="polite" aria-atomic="true" {...rest}>
      {withSpinner && <AdminIcon icon={Spinner} />}

      {children && (
        <Text as="span" variant="muted">
          {children}
        </Text>
      )}

      {desc}
    </span>
  );
}

LoadingStatus.displayName = "LoadingStatus";
