"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(legal)/cookies/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio cookies policy page with a screen-reader-only H1.
 *
 * @remarks
 * - Studio convention: the page owns the single global H1 as screen-reader-only text.
 * - Visible content is structured through `SettingsSection`, which provides the visible H2.
 * - V0.5 has no marketing or analytics cookies.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

const CONTACT_EMAIL = "julien.mathe.dev@gmail.com" as const;

export default function CookiesPage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
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
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.intro.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.intro.p1")}</Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.usage.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.usage.p1")}</Text>

            <Text as="p">{t("studio.legal.cookies.sections.usage.p2")}</Text>
          </div>

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

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.cookies.sections.future.title")}
            </Heading>

            <Text as="p">{t("studio.legal.cookies.sections.future.p1")}</Text>
          </div>

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
