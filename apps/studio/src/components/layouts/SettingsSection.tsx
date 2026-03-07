"use client";

/**
 * @file apps/studio/src/components/layouts/SettingsSection.tsx
 * @layer studio/layouts
 *
 * @description
 * Wrapper standard pour une section de réglages (studio).
 *
 * @remarks
 * - Encapsule une structure accessible : `<section>` + ARIA (label/description/busy).
 * - Affiche un titre via `Heading` (niveau configurable, visible ou SR-only).
 * - Affiche une description optionnelle via `Text`.
 * - Peut afficher un badge de statut (clean / dirty / saving) à côté du titre.
 * - `isLoading` remplace uniquement la zone `children` par un loader.
 * - UI-only : aucune logique métier.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  SectionFormStatusBadge,
  type SectionFormStatusKind,
} from "@compoz/studio/components/atoms/badges/SectionFormStatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

/**
 * Props du composant `SettingsSection`.
 */
type SettingsSectionProps = Readonly<{
  /** Identifiant logique (base des IDs aria : `${id}-title`, `${id}-desc`). */
  id: string;

  /** Titre de la section (utilisé dans le Heading). */
  title: string;

  /** Description optionnelle rendue via `Text` (as="p"). */
  description?: string;

  /** Charge initial : remplace uniquement `children` par un loader. */
  isLoading?: boolean;

  /** Libellé du loader (fallback i18n basé sur le titre). */
  loadingLabel?: string;

  /** Propage `aria-busy` sur la section. */
  isBusy?: boolean;

  /** Indique si la section courante contient des changements non sauvegardés. */
  isDirty?: boolean;

  blockingErrorsCount?: number;

  /** Niveau du heading HTML (défaut: "h1"). */
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  /** Masque visuellement le titre (SR-only). */
  visuallyHiddenTitle?: boolean;

  /** Affiche le badge de statut à côté du titre (défaut: true). */
  showStatusBadge?: boolean;

  /** Contenu de la section (formulaire, liste, etc.). */
  children: ReactNode;

  /** Classes additionnelles sur la `<section>`. */
  className?: string;
}>;

/**
 * Section de réglages standardisée (studio).
 */
export function SettingsSection({
  id,
  title,
  description,
  isLoading,
  loadingLabel,
  isBusy,
  isDirty,
  blockingErrorsCount = 0,
  headingLevel = "h2",
  visuallyHiddenTitle = false,
  showStatusBadge = true,
  children,
  className,
}: SettingsSectionProps) {
  const t = useTranslations();

  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  const loaderLabel =
    loadingLabel ??
    t("studio.shared.loading.section", { title: title.toLowerCase() });

  const statusKind: SectionFormStatusKind =
    useMemo((): SectionFormStatusKind => {
      if (
        id === "overview" ||
        id === "pages-list" ||
        id === "blocks" ||
        id === "page-blocks"
      )
        return "none";
      if (isBusy) return "saving";
      if (blockingErrorsCount > 0) return "error";
      if (isDirty) return "modified";
      return "saved";
    }, [isBusy, isDirty, id, blockingErrorsCount]);

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-busy={isBusy || isLoading || undefined}
      className={cn(STACK_MD, className)}
    >
      {/* Header section (titre + badge) */}
      <div className="flex items-center gap-6">
        <Heading
          id={titleId}
          as={headingLevel}
          visuallyHidden={visuallyHiddenTitle}
        >
          {title}
        </Heading>

        {showStatusBadge && !visuallyHiddenTitle ? (
          <div className="shrink-0">
            <SectionFormStatusBadge
              kind={statusKind}
              count={statusKind === "error" ? blockingErrorsCount : 0}
            />
          </div>
        ) : null}
      </div>

      {description && (
        <Text id={descId} as="p">
          {description}
        </Text>
      )}

      {isLoading ? (
        <SectionLoader label={loaderLabel} />
      ) : (
        <div className={cn(STACK_MD)}>{children}</div>
      )}
    </section>
  );
}

SettingsSection.displayName = "SettingsSection";
