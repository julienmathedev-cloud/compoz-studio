"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(legal)/cookies/page.tsx
 * @layer studio/app
 *
 * @description
 * Page « Cookies » (Studio) — politique relative aux cookies pour Compoz Studio.
 *
 * @remarks
 * - H1 SR-only (convention Studio : un seul H1 global).
 * - Structure via `SettingsSection`.
 * - Contenu statique i18n.
 * - Aucun tracking actuellement (V0.5 : zéro cookies marketing / analytics).
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

const CONTACT_EMAIL = "julien.mathe.dev@gmail.com" as const;

/**
 * Page Cookies (Studio).
 */
export default function CookiesPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      {/* H1 global SR-only */}
      <Heading as="h1" className="sr-only">
        {t("studio.legal.cookies.h1")}
      </Heading>

      <SettingsSection
        id="legal-cookies"
        title={t("studio.legal.cookies.title")}
        description={t("studio.legal.cookies.description")}
        showStatusBadge={false}
      >
        <div className="space-y-6">
          {/* ------------------------------------------------------------------ */}
          {/* Introduction                                                        */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.intro.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.intro.p1")}</Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Utilisation actuelle                                                */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.usage.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.usage.p1")}</Text>

            <Text as="p">{t("studio.legal.cookies.sections.usage.p2")}</Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Cookies nécessaires                                                 */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.technical.title")}
            </Heading>

            <Text as="p">
              {t("studio.legal.cookies.sections.technical.p1")}
            </Text>

            <Text as="p" variant="muted">
              {t("studio.legal.cookies.sections.technical.p2")}
            </Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Évolution                                                           */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.future.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.future.p1")}</Text>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Contact                                                             */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.contact.title")}
            </Heading>

            <Text as="p" variant="muted">
              {t.rich("studio.legal.cookies.sections.contact.p1", {
                emailAddress: CONTACT_EMAIL,
                email: (chunks) => (
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
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

CookiesPage.displayName = "CookiesPage";
