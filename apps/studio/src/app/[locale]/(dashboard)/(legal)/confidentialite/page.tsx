"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(legal)/confidentialite/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio privacy page with a screen-reader-only H1.
 *
 * @remarks
 * - Studio convention: the page owns the single global H1 as screen-reader-only text.
 * - Visible content is structured through `SettingsSection`, which provides the visible H2.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

const CONTACT_EMAIL = "julien.mathe.dev@gmail.com" as const;

export default function ConfidentialitePage() {
  const t = useTranslations();

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.legal.privacy.h1")}
      </Heading>

      <SettingsSection
        id="legal-privacy"
        title={t("studio.legal.privacy.title")}
        description={t("studio.legal.privacy.description")}
        // Legal pages do not expose a form status badge.
        showStatusBadge={false}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.privacy.sections.data.title")}
            </Heading>

            <Text as="p">{t("studio.legal.privacy.sections.data.p1")}</Text>
            <Text as="p" variant="muted">
              {t("studio.legal.privacy.sections.data.note")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.privacy.sections.purposes.title")}
            </Heading>

            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              <li>{t("studio.legal.privacy.sections.purposes.items.0")}</li>
              <li>{t("studio.legal.privacy.sections.purposes.items.1")}</li>
              <li>{t("studio.legal.privacy.sections.purposes.items.2")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.privacy.sections.retention.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.privacy.sections.retention.p1")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.privacy.sections.rights.title")}
            </Heading>

            <Text as="p">{t("studio.legal.privacy.sections.rights.p1")}</Text>

            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              <li>{t("studio.legal.privacy.sections.rights.items.0")}</li>
              <li>{t("studio.legal.privacy.sections.rights.items.1")}</li>
              <li>{t("studio.legal.privacy.sections.rights.items.2")}</li>
              <li>{t("studio.legal.privacy.sections.rights.items.3")}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.privacy.sections.contact.title")}
            </Heading>
            <Text as="p" variant="muted">
              {t.rich("studio.legal.privacy.sections.contact.p1", {
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

ConfidentialitePage.displayName = "ConfidentialitePage";
