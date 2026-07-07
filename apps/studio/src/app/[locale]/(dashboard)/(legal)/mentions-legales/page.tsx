"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(legal)/mentions-legales/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio legal notice page with a screen-reader-only H1.
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

const SIRET_PLACEHOLDER = "000 000 000 00000" as const;

export default function MentionsLegalesPage() {
  const t = useTranslations();

  // Replace once the real SIRET is available.
  const siret = SIRET_PLACEHOLDER;

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.legal.mentions.h1")}
      </Heading>

      <SettingsSection
        id="legal-mentions"
        title={t("studio.legal.mentions.title")}
        description={t("studio.legal.mentions.description")}
        showStatusBadge={false}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.editor.title")}
            </Heading>
            <Text as="p">{t("studio.legal.mentions.sections.editor.p1")}</Text>
            <Text as="p" variant="muted">
              {t("studio.legal.mentions.sections.editor.p2")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.legalStatus.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.mentions.sections.legalStatus.p1")}
            </Text>
            <Text as="p">
              {t("studio.legal.mentions.sections.legalStatus.p2", { siret })}
            </Text>
            <Text as="p" variant="muted">
              {t("studio.legal.mentions.sections.legalStatus.p3")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.publication.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.mentions.sections.publication.p1")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.hosting.title")}
            </Heading>
            <Text as="p">{t("studio.legal.mentions.sections.hosting.p1")}</Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.activity.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.mentions.sections.activity.p1")}
            </Text>
            <Text as="p" variant="muted">
              {t("studio.legal.mentions.sections.activity.p2")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.intellectual.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.mentions.sections.intellectual.p1")}
            </Text>
            <Text as="p" variant="muted">
              {t("studio.legal.mentions.sections.intellectual.p2")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.liability.title")}
            </Heading>
            <Text as="p">
              {t("studio.legal.mentions.sections.liability.p1")}
            </Text>
          </div>

          <div className="space-y-2">
            <Heading as="h3">
              {t("studio.legal.mentions.sections.data.title")}
            </Heading>
            <Text as="p">{t("studio.legal.mentions.sections.data.p1")}</Text>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

MentionsLegalesPage.displayName = "MentionsLegalesPage";
