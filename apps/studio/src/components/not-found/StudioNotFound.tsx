"use client";

/**
 * @file apps/studio/src/components/not-found/StudioNotFound.tsx
 * @layer studio/components
 *
 * @description
 * Page 404 de l’espace Studio.
 *
 * @remarks
 * - Affichée lorsque la route Studio demandée n’existe pas.
 * - UI-only : aucune logique métier.
 * - Fournit une action de retour vers l’accueil Studio.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Affiche la page “Not Found” pour le Studio.
 */
export function StudioNotFound() {
  const t = useTranslations();

  return (
    <>
      <Heading as="h1" className="sr-only">
        {t("studio.pages.notFound.title")}
      </Heading>

      <section
        aria-label={t("studio.pages.notFound.ariaLabel")}
        className={cn(STUDIO_SECTION)}
      >
        <Heading as="h2">{t("studio.pages.notFound.title")}</Heading>

        <Text variant="muted">{t("studio.pages.notFound.description")}</Text>
      </section>
    </>
  );
}

StudioNotFound.displayName = "StudioNotFound";
