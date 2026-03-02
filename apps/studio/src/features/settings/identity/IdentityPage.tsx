"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentityPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page « Identité » (admin) — affiche la section Identity avec un H1 SR-only.
 *
 * @remarks
 * - Le H1 est porté par la page (SR-only) pour garantir un seul H1 global.
 * - `IdentitySection` rend un H2 visible via `SettingsSection` (headingLevel="h2" par défaut).
 * - La logique dirty/warnings/upload est encapsulée dans `IdentitySection`.
 */

import { IdentitySection } from "@compoz/studio/features/settings/identity/IdentitySection";
import { useTranslations } from "next-intl";

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";

/**
 * Page Identity (admin).
 */
export function IdentityPage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.identity")}
      </Heading>

      <IdentitySection />
    </div>
  );
}

IdentityPage.displayName = "IdentityPage";
