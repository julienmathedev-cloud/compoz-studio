"use client";

/**
 * @file apps/studio/src/app/[locale]/dashboard/(legal)/confidentialite/page.tsx
 * @layer app/studio
 *
 * @description
 * Page « Confidentialité » (admin) — affiche les informations de confidentialité avec un H1 SR-only.
 *
 * @remarks
 * - Respecte la convention admin : H1 SR-only porté par la page (un seul H1 global).
 * - Le contenu visible est structuré via `SettingsSection` (H2 visible par défaut).
 * - UI-only : aucun fetch, aucun cookie, aucune logique métier.
 * - Contenu i18n via `next-intl`.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";

/**
 * Page Confidentialité (admin).
 */
export default function ConfidentialitePage() {
  const t = useTranslations();

  return (
    <div className={cn(ADMIN_SECTION)}>
      {/* ✅ H1 unique global : SR-only (SEO + accessibilité) */}
      <Heading as="h1" className="sr-only">
        {t("admin.legal.privacy.h1")}
      </Heading>

      <SettingsSection
        id="legal-privacy"
        title={t("admin.legal.privacy.title")}
        description={t("admin.legal.privacy.description")}
        // pages légales : pas de badge d’état
        showStatusBadge={false}
      >
        <div className="space-y-6">
          {/* ------------------------------------------------------------------ */}
          {/* Données collectées                                                 */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.privacy.sections.data.title")}
            </Heading>

            <Text as="p">{t("admin.legal.privacy.sections.data.p1")}</Text>
            <Text as="p" variant="muted">
              {t("admin.legal.privacy.sections.data.note")}
            </Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Finalités                                                          */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.privacy.sections.purposes.title")}
            </Heading>

            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              <li>{t("admin.legal.privacy.sections.purposes.items.0")}</li>
              <li>{t("admin.legal.privacy.sections.purposes.items.1")}</li>
              <li>{t("admin.legal.privacy.sections.purposes.items.2")}</li>
            </ul>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Conservation                                                       */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.privacy.sections.retention.title")}
            </Heading>
            <Text as="p">{t("admin.legal.privacy.sections.retention.p1")}</Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Vos droits                                                         */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.privacy.sections.rights.title")}
            </Heading>

            <Text as="p">{t("admin.legal.privacy.sections.rights.p1")}</Text>

            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              <li>{t("admin.legal.privacy.sections.rights.items.0")}</li>
              <li>{t("admin.legal.privacy.sections.rights.items.1")}</li>
              <li>{t("admin.legal.privacy.sections.rights.items.2")}</li>
              <li>{t("admin.legal.privacy.sections.rights.items.3")}</li>
            </ul>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Contact                                                            */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.privacy.sections.contact.title")}
            </Heading>
            <Text as="p" variant="muted">
              {t.rich("admin.legal.privacy.sections.contact.p1", {
                emailAdress: "julien.mathe.dev@gmail.com",
                email: (chunks) => (
                  <a
                    href="mailto:julien.mathe.dev@gmail.com"
                    className="underline underline-offset-4 hover:no-underline"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </Text>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

ConfidentialitePage.displayName = "ConfidentialitePage";
