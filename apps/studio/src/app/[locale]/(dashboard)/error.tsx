"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/error.tsx
 * @layer studio/app
 *
 * @description
 * Error boundary du Dashboard Studio.
 *
 * @remarks
 * - Doit être un composant client (Next.js Error Boundary).
 * - Fournit une action "Réessayer" via `reset()`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM, STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

type StudioErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function StudioError({ error, reset }: StudioErrorProps) {
  const t = useTranslations();

  return (
    <>
      <Heading as="h1" className="sr-only">
        {t("studio.pages.error.title")}
      </Heading>

      <section
        aria-label={t("studio.pages.error.ariaLabel")}
        className={cn(STUDIO_SECTION)}
      >
        <Heading as="h2">{t("studio.pages.error.title")}</Heading>

        <Text variant="muted">{t("studio.pages.error.description")}</Text>

        {/* Optionnel : message utile (éviter d’exposer en prod) */}
        {process.env.NODE_ENV !== "production" && error?.message ? (
          <Text variant="meta" className="wrap-break-words">
            {error.message}
          </Text>
        ) : null}

        <div className={cn(ROW_SM)}>
          <Button type="button" variant="ghostStudio" onClick={reset}>
            {t("studio.pages.error.retry")}
          </Button>
        </div>
      </section>
    </>
  );
}

StudioError.displayName = "StudioError";
