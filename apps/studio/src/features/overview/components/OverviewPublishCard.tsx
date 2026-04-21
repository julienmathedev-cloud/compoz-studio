"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewPublishCard.tsx
 * @layer ui/studio/overview
 *
 * @description
 * Carte “Publication & état” : résumé (publié + dernière publication + changements)
 * + actions + warnings.
 *
 * @remarks
 * - UI-only : lit `SiteStatusDTO` et déclenche `usePublishSite`.
 * - Les warnings de pré-publication proviennent du status.
 * - Les warnings post-publication proviennent du use-case de publish.
 */

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type {
  PublishSiteResultDTO,
  SiteStatusDTO,
} from "@compoz/core/domain/site/dto";
import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { PublicationStatusBadge } from "@compoz/studio/components/atoms/badges/PublicationStatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { getPublishedSiteUrl } from "@compoz/studio/config/siteOrigin";
import { StudioHintsPanel } from "@compoz/studio/features/_shared/components/StudioHintsPanel";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { usePublishSite } from "@compoz/studio/features/site/publish/usePublishSite";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@compoz/ui/components/ui/dropdown-menu";
import { Separator } from "@compoz/ui/components/ui/separator";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN, STACK_MD } from "@compoz/ui/styles/studio/layout";

type OverviewPublishCardProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
  className?: string;
  publishedBaseUrl?: string | null;
  isDemo?: boolean;
}>;

type AnyWarningLike = Readonly<{
  code?: string;
  path?: string[];
}>;

type PublicationKind = Parameters<typeof PublicationStatusBadge>[0]["kind"];

function formatLastPublishedAt(input?: string): string {
  const iso = String(input ?? "").trim();
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString();
}

function getPublicationStateKind(params: {
  isError: boolean;
  hasData: boolean;
  publishedExists: boolean;
}): PublicationKind {
  const { isError, hasData, publishedExists } = params;

  if (isError || !hasData) return "error";
  return publishedExists ? "published" : "never";
}

function getPipelineKind(params: {
  isError: boolean;
  hasData: boolean;
  isPublishing: boolean;
  siteHasChanges: boolean;
}): PublicationKind {
  const { isError, hasData, isPublishing, siteHasChanges } = params;

  if (isPublishing) return "publishing";
  if (isError || !hasData) return "error";
  return siteHasChanges ? "changesPending" : "upToDate";
}

export function OverviewPublishCard({
  data,
  isError,
  className,
  publishedBaseUrl,
  isDemo = false,
}: OverviewPublishCardProps) {
  const t = useTranslations();
  const tenantId = useTenantId();
  const confirmList = useConfirmList();

  const { publish, isPublishing } = usePublishSite();
  const [last, setLast] = useState<PublishSiteResultDTO | null>(null);
  const [publishWarnings, setPublishWarnings] = useState<
    ReadonlyArray<PublishSiteResultDTO["warnings"][number]>
  >([]);

  const hasData = Boolean(data);
  const publishedExists = Boolean(data?.published?.exists);
  const lastPublishedLabel = formatLastPublishedAt(
    data?.published?.lastPublishedAt,
  );
  const siteHasChanges = Boolean(data?.hasChanges?.site);

  const publishedUrl = useMemo(
    () =>
      getPublishedSiteUrl({
        tenantId,
        publishedBaseUrl,
      }),
    [tenantId, publishedBaseUrl],
  );

  const changesSummary = useMemo(() => {
    if (!data) {
      return t("studio.overviewSection.globalStatus.payloadInvalidHint");
    }

    const parts: string[] = [];

    if (data.hasChanges?.settings) {
      parts.push(t("studio.shared.entities.settings"));
    }

    if (data.hasChanges?.pages) {
      parts.push(t("studio.shared.entities.pages"));
    }

    const blocksModified = data.counts?.blocks?.modified ?? 0;
    const blocksNew = data.counts?.blocks?.new ?? 0;
    const blocksDeleted = data.counts?.blocks?.deleted ?? 0;
    const blocksHasChanges = blocksModified + blocksNew + blocksDeleted > 0;

    if (blocksHasChanges) {
      parts.push(t("studio.shared.entities.blocks"));
    }

    return parts.length > 0
      ? parts.join(" • ")
      : t("studio.overviewSection.globalStatus.clean");
  }, [data, t]);

  const publicationStateKind = getPublicationStateKind({
    isError: Boolean(isError),
    hasData,
    publishedExists,
  });

  const pipelineKind = getPipelineKind({
    isError: Boolean(isError),
    hasData,
    isPublishing,
    siteHasChanges,
  });

  const toWarningHint = useCallback(
    (warning: AnyWarningLike): string => {
      const code = String(warning?.code ?? "UNKNOWN");
      const path = Array.isArray(warning?.path)
        ? warning.path.join(".")
        : undefined;
      const key = `errors.${code}`;

      try {
        const message = t(key);
        return path ? `${message} (${path})` : message;
      } catch {
        return path ? `${code} (${path})` : code;
      }
    },
    [t],
  );

  const prePublishWarningHints = useMemo(() => {
    const warnings = data?.prePublishWarnings ?? [];
    return warnings.map((warning) => toWarningHint(warning as AnyWarningLike));
  }, [data?.prePublishWarnings, toWarningHint]);

  const postPublishWarningHints = useMemo(
    () =>
      publishWarnings.map((warning) =>
        toWarningHint(warning as AnyWarningLike),
      ),
    [publishWarnings, toWarningHint],
  );

  const visibleWarningHints =
    postPublishWarningHints.length > 0
      ? postPublishWarningHints
      : prePublishWarningHints;

  const handlePublish = useCallback(async () => {
    if (isPublishing || isDemo) return;

    setPublishWarnings([]);

    if (prePublishWarningHints.length > 0) {
      const ok = await confirmList({
        title: t("studio.shared.confirm.publishDespiteWarnings.title"),
        intro: t("studio.shared.confirm.publishDespiteWarnings.intro"),
        items: prePublishWarningHints,
        confirmLabel: t(
          "studio.shared.confirm.publishDespiteWarnings.confirmLabel",
        ),
        cancelLabel: t("common.cancel"),
        requireAckLabel: t(
          "studio.shared.confirm.publishDespiteWarnings.requireAckLabel",
        ),
        tone: "default",
      });

      if (!ok) return;
    }

    const result = await publish();
    if (!result) return;

    setLast(result);
    setPublishWarnings(result.warnings ?? []);
  }, [confirmList, isDemo, isPublishing, prePublishWarningHints, publish, t]);

  return (
    <Card
      variant="panel"
      visualMode="studio"
      data-state={isError ? "error" : undefined}
      className={className}
    >
      <CardHeader>
        <Heading as="h3">{t("studio.overviewSection.publish.title")}</Heading>
        <Text as="p" variant="muted">
          {t("studio.overviewSection.publish.description")}
        </Text>
      </CardHeader>

      <CardContent className={cn("flex w-full flex-col gap-10 lg:flex-row")}>
        <div className={cn(STACK_MD, "flex-1")}>
          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("studio.overviewSection.globalStatus.publicationStatusLabel")}
            </Text>

            <PublicationStatusBadge kind={publicationStateKind} />
          </div>

          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("studio.overviewSection.publish.currentState")}
            </Text>

            <PublicationStatusBadge kind={pipelineKind} />
          </div>

          <Text as="p" variant="muted">
            {changesSummary}
          </Text>

          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("studio.overviewSection.globalStatus.lastPublishedLabel")}
            </Text>

            <Text as="span" variant="base" className="text-right">
              {publishedExists && lastPublishedLabel
                ? lastPublishedLabel
                : t("studio.overviewSection.globalStatus.never")}
            </Text>
          </div>
        </div>

        <Separator
          orientation="vertical"
          className="hidden h-30 self-stretch lg:block"
        />

        <div className={cn(STACK_MD, "flex flex-1 flex-col")}>
          <StudioHintsPanel
            id="publish-warnings"
            hints={visibleWarningHints}
            variant="warning"
          />

          {last ? (
            <Text as="p" variant="muted">
              {t("studio.overviewSection.publish.last", {
                pages: last.pagesCopied,
                settings: last.settingsCopied
                  ? t("studio.overviewSection.publish.settingsUpdated")
                  : t("studio.overviewSection.publish.settingsUnchanged"),
              })}
            </Text>
          ) : null}

          <div className={cn(ROW_BETWEEN, "mt-auto gap-3")}>
            <Button
              variant="default"
              visualMode="studio"
              onClick={handlePublish}
              disabled={isPublishing || isDemo}
            >
              {isPublishing ? (
                <LoadingStatus
                  label={t("studio.overviewSection.publish.inProgress")}
                  className="inline-flex items-center gap-2"
                />
              ) : (
                t("studio.overviewSection.publish.action")
              )}
            </Button>

            {isDemo ? (
              <Button variant="outline" visualMode="studio" asChild>
                <Link href="/draft" target="_blank" rel="noopener noreferrer">
                  {t("studio.shared.visualize.draft")}
                </Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" visualMode="studio">
                    {t("studio.overviewSection.publish.view")}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  visualMode="studio"
                  align="end"
                  className="w-24"
                >
                  <DropdownMenuLabel visualMode="studio">
                    {t("studio.overviewSection.publish.view")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem visualMode="studio" asChild>
                    <Link
                      href="/draft"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("studio.shared.visualize.draft")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem visualMode="studio" asChild>
                    <Link
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("studio.shared.visualize.published")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

OverviewPublishCard.displayName = "OverviewPublishCard";
