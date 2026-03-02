"use client";

/**
 * @file apps/studio/src/components/not-found/StudioNotFound.tsx
 * @layer app/components
 *
 * @description
 * Page 404 de l’espace studio.
 *
 * @remarks
 * - Affichée lorsque la route studio demandée n’existe pas.
 * - UI-only : aucune logique métier.
 * - Fournit une action de retour vers l’accueil studio.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";

export function StudioNotFound() {
  const t = useTranslations();

  return (
    <>
      <Heading as="h1" className="sr-only">
        {t("admin.pages.notFound.title")}
      </Heading>
      <section
        aria-label={t("admin.pages.notFound.ariaLabel")}
        className={cn(ADMIN_SECTION)}
      >
        <Heading as="h2">{t("admin.pages.notFound.title")}</Heading>

        <Text variant="muted">{t("admin.pages.notFound.description")}</Text>
      </section>
    </>
  );
}

StudioNotFound.displayName = "StudioNotFound";
