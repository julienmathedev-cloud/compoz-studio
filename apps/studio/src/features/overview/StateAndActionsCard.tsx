"use client";

/**
 * @file apps/studio/src/features/overview/OverviewStatsRow.tsx
 * @layer ui/overview
 *
 * @description
 * Carte “Publication & état” : résumé (publié + dernière publication + changements) + actions + warnings.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";

import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";

import type {
  PublishSiteResultDTO,
  SiteStatusDTO,
} from "@compoz/core/domain/site/dto";

import { PublicationStatusBadge } from "@compoz/studio/components/atoms/badges/PublicationStatusBadge";

import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { getPublicSiteOrigin } from "@compoz/studio/config/siteOrigin";
import { usePublishSite } from "@compoz/studio/features/site/publish/usePublishSite";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@compoz/ui/components/ui/dropdown-menu";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN, STACK_MD } from "@compoz/ui/styles/studio/layout";
import Link from "next/link";

type StateAndActionsCardProps = Readonly<{
  data?: SiteStatusDTO;
  isError?: boolean;
  className?: string;
}>;

type AnyWarningLike = Readonly<{
  code?: string;
  path?: string[];
}>;

function formatLastPublishedAt(input?: string): string {
  const iso = String(input ?? "").trim();
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleString();
}

type PublicationKind = Parameters<typeof PublicationStatusBadge>[0]["kind"];

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

export function StateAndActionsCard({
  data,
  isError,
  className,
}: StateAndActionsCardProps) {
  const t = useTranslations();

  const { publish, isPublishing } = usePublishSite();
  const [last, setLast] = useState<PublishSiteResultDTO | null>(null);

  /** Warnings renvoyés par le use-case publish (post action) */
  const [publishWarnings, setPublishWarnings] = useState<
    ReadonlyArray<PublishSiteResultDTO["warnings"][number]>
  >([]);

  const hasData = Boolean(data);
  const publishedExists = Boolean(data?.published?.exists);
  const lastPublishedLabel = formatLastPublishedAt(
    data?.published?.lastPublishedAt,
  );

  const siteHasChanges = Boolean(data?.hasChanges?.site);

  const changesSummary = useMemo(() => {
    if (!data) return "";

    const parts: string[] = [];

    if (data.hasChanges?.settings) {
      parts.push(t("admin.shared.entities.settings"));
    }
    if (data.hasChanges?.pages) {
      parts.push(t("admin.shared.entities.pages"));
    }

    const blocksModified = data.counts?.blocks?.modified ?? 0;
    const blocksNew = data.counts?.blocks?.new ?? 0;
    const blocksDeleted = data.counts?.blocks?.deleted ?? 0;

    const blocksHasChanges = blocksModified + blocksNew + blocksDeleted > 0;
    if (blocksHasChanges) {
      parts.push(t("admin.shared.entities.blocks"));
    }

    return parts.length > 0
      ? parts.join(" • ")
      : t("admin.overviewSection.globalStatus.clean");
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
    (w: AnyWarningLike): string => {
      const code = String(w?.code ?? "UNKNOWN");
      const path = Array.isArray(w?.path) ? w.path.join(".") : undefined;
      const key = `errors.${code}`;

      try {
        const msg = t(key as never);
        return path ? `${msg} (${path})` : msg;
      } catch {
        return path ? `${code} (${path})` : code;
      }
    },
    [t],
  );

  /** Pré-check warnings (avant publish) */
  const prePublishWarningHints = useMemo(() => {
    const warnings = data?.prePublishWarnings ?? [];
    return warnings.map((w) => toWarningHint(w as AnyWarningLike));
  }, [data?.prePublishWarnings, toWarningHint]);

  /** Warnings renvoyés par publish (après action) */
  const postPublishWarningHints = useMemo(
    () => publishWarnings.map((w) => toWarningHint(w as AnyWarningLike)),
    [publishWarnings, toWarningHint],
  );

  async function handlePublish() {
    setPublishWarnings([]);

    const res = await publish();
    if (!res) return;

    setLast(res);
    setPublishWarnings(res.warnings ?? []);
  }

  const warningsCount =
    postPublishWarningHints.length === 0
      ? prePublishWarningHints.length
      : postPublishWarningHints.length;

  const warningsLabel =
    warningsCount > 0
      ? t("admin.shared.warningsPanel.labelWithCount", { count: warningsCount })
      : t("admin.shared.warningsPanel.label");

  return (
    <Card
      variant="panel"
      data-state={isError ? "error" : undefined}
      className={className}
    >
      <CardHeader>
        <Heading as="h3">{t("admin.overviewSection.publish.title")}</Heading>
        <Text as="p" variant="muted">
          {t("admin.overviewSection.publish.description")}
        </Text>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-10 w-full lg:flex-row lg:items-stretch",
        )}
      >
        {/* LEFT — Summary */}
        <div className={cn(STACK_MD, "flex-1")}>
          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("admin.overviewSection.globalStatus.publicationStatusLabel")}
            </Text>

            <PublicationStatusBadge kind={publicationStateKind} />
          </div>

          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("admin.overviewSection.publish.currentState")}
            </Text>

            <PublicationStatusBadge kind={pipelineKind} />
          </div>

          <Text as="p" variant="muted">
            {data
              ? changesSummary
              : t("admin.overviewSection.globalStatus.payloadInvalidHint")}
          </Text>

          <div className={cn(ROW_BETWEEN, "gap-3")}>
            <Text as="span" variant="muted" className="font-medium">
              {t("admin.overviewSection.globalStatus.lastPublishedLabel")}
            </Text>

            <Text as="span" variant="base" className="text-right">
              {publishedExists && lastPublishedLabel
                ? lastPublishedLabel
                : t("admin.overviewSection.globalStatus.never")}
            </Text>
          </div>
        </div>

        <Separator
          orientation="vertical"
          className="hidden lg:block self-stretch h-30"
        />

        {/* RIGHT — Actions */}
        <div className={cn(STACK_MD, "flex flex-1 flex-col")}>
          <ExpandableLayout
            id="publish-warnings"
            label={warningsLabel}
            disabled={warningsCount === 0}
          >
            {postPublishWarningHints.length === 0 &&
            prePublishWarningHints.length > 0 ? (
              <HintList
                variant="warning"
                title={t("admin.shared.warningsPanel.title")}
                hints={prePublishWarningHints}
              />
            ) : null}

            {postPublishWarningHints.length > 0 ? (
              <HintList
                variant="warning"
                title={t("admin.shared.warningsPanel.title")}
                hints={postPublishWarningHints}
              />
            ) : null}
          </ExpandableLayout>

          {last ? (
            <Text as="p" variant="muted">
              {t("admin.overviewSection.publish.last", {
                pages: last.pagesCopied,
                settings: last.settingsCopied
                  ? t("admin.overviewSection.publish.settingsUpdated")
                  : t("admin.overviewSection.publish.settingsUnchanged"),
              })}
            </Text>
          ) : null}

          <div className={cn(ROW_BETWEEN, "gap-3 mt-auto")}>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <LoadingStatus
                  label={t("admin.overviewSection.publish.inProgress")}
                  className="inline-flex items-center gap-2"
                />
              ) : (
                t("admin.overviewSection.publish.action")
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t("admin.overviewSection.publish.view")}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-24">
                <DropdownMenuLabel>
                  {t("admin.overviewSection.publish.view")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/draft" target="_blank" rel="noopener noreferrer">
                    {t("admin.shared.visualize.draft")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href={`${getPublicSiteOrigin()}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("admin.shared.visualize.published")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

StateAndActionsCard.displayName = "StateAndActionsCard";
