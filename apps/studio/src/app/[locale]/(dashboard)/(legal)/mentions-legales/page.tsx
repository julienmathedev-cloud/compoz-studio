"use client";

/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(legal)/mentions-legales/page.tsx
 * @layer app/studio
 *
 * @description
 * Page « Mentions légales » (admin) — informations légales relatives à l’outil Compoz Studio.
 *
 * @remarks
 * - H1 SR-only (convention admin : un seul H1 global).
 * - Structure via `SettingsSection`.
 * - Contenu statique i18n.
 */

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";

export default function MentionsLegalesPage() {
  const t = useTranslations();

  // ⚠️ À remplacer dès que tu as ton SIRET
  const siret = "000 000 000 00000";

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.legal.mentions.h1")}
      </Heading>

      <SettingsSection
        id="legal-mentions"
        title={t("admin.legal.mentions.title")}
        description={t("admin.legal.mentions.description")}
        showStatusBadge={false}
      >
        <div className="space-y-6">
          {/* Éditeur */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.editor.title")}
            </Heading>
            <Text as="p">{t("admin.legal.mentions.sections.editor.p1")}</Text>
            <Text as="p" variant="muted">
              {t("admin.legal.mentions.sections.editor.p2")}
            </Text>
          </div>

          {/* Statut juridique */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.legalStatus.title")}
            </Heading>
            <Text as="p">
              {t("admin.legal.mentions.sections.legalStatus.p1")}
            </Text>
            <Text as="p">
              {t("admin.legal.mentions.sections.legalStatus.p2", { siret })}
            </Text>
            <Text as="p" variant="muted">
              {t("admin.legal.mentions.sections.legalStatus.p3")}
            </Text>
          </div>

          {/* Responsable publication */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.publication.title")}
            </Heading>
            <Text as="p">
              {t("admin.legal.mentions.sections.publication.p1")}
            </Text>
          </div>

          {/* Hébergement */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.hosting.title")}
            </Heading>
            <Text as="p">{t("admin.legal.mentions.sections.hosting.p1")}</Text>
          </div>

          {/* Activité */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.activity.title")}
            </Heading>
            <Text as="p">{t("admin.legal.mentions.sections.activity.p1")}</Text>
            <Text as="p" variant="muted">
              {t("admin.legal.mentions.sections.activity.p2")}
            </Text>
          </div>

          {/* Propriété intellectuelle */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.intellectual.title")}
            </Heading>
            <Text as="p">
              {t("admin.legal.mentions.sections.intellectual.p1")}
            </Text>
            <Text as="p" variant="muted">
              {t("admin.legal.mentions.sections.intellectual.p2")}
            </Text>
          </div>

          {/* Responsabilité */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.liability.title")}
            </Heading>
            <Text as="p">
              {t("admin.legal.mentions.sections.liability.p1")}
            </Text>
          </div>

          {/* Données personnelles */}
          <div className="space-y-2">
            <Heading as="h3">
              {t("admin.legal.mentions.sections.data.title")}
            </Heading>
            <Text as="p">{t("admin.legal.mentions.sections.data.p1")}</Text>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

MentionsLegalesPage.displayName = "MentionsLegalesPage";
