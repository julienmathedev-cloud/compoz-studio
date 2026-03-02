"use client";

/**
 * @file apps/studio/src/app/[locale]/error.tsx
 * @layer app/studio/error
 *
 * @description
 * Error boundary de l’espace admin.
 *
 * @remarks
 * - Doit être un composant client (Next.js Error Boundary).
 * - Fournit une action "Réessayer" via `reset()`.
 */

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION, ROW_SM } from "@compoz/ui/styles/studio/layout";

type AdminErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AdminError({ error, reset }: AdminErrorProps) {
  const t = useTranslations();

  useEffect(() => {
    // Optionnel : logger ici si tu as un logger (mais pas obligatoire V0.5)
    // console.error(error);
  }, [error]);

  return (
    <>
      <Heading as="h1" className="sr-only">
        {t("admin.pages.error.title")}
      </Heading>
      <section
        aria-label={t("admin.pages.error.ariaLabel")}
        className={cn(ADMIN_SECTION)}
      >
        <Heading as="h2">{t("admin.pages.error.title")}</Heading>

        <Text variant="muted">{t("admin.pages.error.description")}</Text>

        {/* Optionnel : message utile (éviter d’exposer en prod) */}
        {process.env.NODE_ENV !== "production" && error?.message ? (
          <Text variant="meta" className="wrap-break-words">
            {error.message}
          </Text>
        ) : null}

        <div className={cn(ROW_SM)}>
          <Button type="button" variant="ghost" onClick={reset}>
            {t("admin.pages.error.retry")}
          </Button>
        </div>
      </section>
    </>
  );
}

AdminError.displayName = "AdminError";
