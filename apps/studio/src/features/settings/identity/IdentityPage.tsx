"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentityPage.tsx
 * @layer ui/studio/settings/identity/pages
 *
 * @description
 * Page « Identité » (studio) — affiche la section Identity avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `IdentitySection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 * - La logique dirty / warnings / upload est encapsulée dans `IdentitySection`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { IdentitySection } from "@compoz/studio/features/settings/identity/IdentitySection";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Page Identity (studio).
 */
export function IdentityPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.identity")}
      </Heading>

      <IdentitySection />
    </div>
  );
}

IdentityPage.displayName = "IdentityPage";
