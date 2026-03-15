"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewStatusDetailsTable.tsx
 * @layer ui/studio/overview
 *
 * @description
 * Table lazy des détails pages / blocs.
 *
 * @remarks
 * - UI-only.
 * - Lit les détails de status via `useSiteStatusDetails()`.
 * - Charge les blocs d’une page à l’ouverture de sa ligne.
 */

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo, useState, type KeyboardEventHandler } from "react";

import type {
  SiteDiffKindDTO,
  SiteStatusPageDetailsDTO,
} from "@compoz/core/domain/site/dto";
import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { BlockCellsDescription } from "@compoz/studio/features/pages/blocks/components/molecules/BlockCellsDescription";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { Badge } from "@compoz/ui/components/ui/badge";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@compoz/ui/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

export function OverviewStatusDetailsTable() {
  const t = useTranslations();
  const locale = useLocale();

  const [scope, setScope] = useState<"dirty" | "all">("dirty");
  const [openPageId, setOpenPageId] = useState<string | null>(null);

  const details = useSiteStatusDetails({
    enabled: true,
    scope,
    includeBlocks: true,
  });

  const hasData = Boolean(details.data?.pages?.length);
  const showInitialLoading = details.isLoading && !hasData;
  const showRefreshing = details.isFetching && hasData;

  const collator = useMemo(
    () => new Intl.Collator(locale, { sensitivity: "base" }),
    [locale],
  );

  const pagesSorted = useMemo(() => {
    const pages = details.data?.pages ?? [];
    if (pages.length <= 1) return pages;

    return [...pages].sort((a, b) => {
      const compareName = collator.compare(a.name ?? "", b.name ?? "");
      if (compareName !== 0) return compareName;
      return a.id.localeCompare(b.id);
    });
  }, [details.data?.pages, collator]);

  return (
    <Card variant="panel">
      <CardHeader className="flex items-center justify-between gap-4">
        <Heading as="h3">{t("studio.overviewSection.details.title")}</Heading>

        <Button
          variant="outline"
          onClick={() => {
            setOpenPageId(null);
            setScope((currentScope) =>
              currentScope === "dirty" ? "all" : "dirty",
            );
          }}
        >
          {scope === "dirty"
            ? t("studio.overviewSection.details.showAll")
            : t("studio.overviewSection.details.showDirty")}
        </Button>
      </CardHeader>

      <CardContent>
        {showInitialLoading ? (
          <LoadingStatus className="inline-flex" />
        ) : details.isError ? (
          <Text variant="muted" className="text-destructive">
            {t("common.error")}
          </Text>
        ) : !hasData ? (
          <Text variant="muted">
            {t("studio.overviewSection.details.empty")}
          </Text>
        ) : (
          <div
            className={showRefreshing ? "opacity-70 transition-opacity" : ""}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-accent/40">
                  <TableHead className="w-36">{t("common.status")}</TableHead>
                  <TableHead className="w-[120px] md:w-[260px]">
                    {t("studio.shared.entities.pages")}
                  </TableHead>
                  <TableHead>{t("studio.shared.entities.blocks")}</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {pagesSorted.map((page) => {
                  const isOpen = openPageId === page.id;
                  const canToggle = Boolean(page.blockItems?.length);

                  return (
                    <Fragment key={page.id}>
                      <PageRow
                        page={page}
                        isOpen={isOpen}
                        canToggle={canToggle}
                        onToggle={() => setOpenPageId(isOpen ? null : page.id)}
                      />

                      {isOpen ? <BlocksDetailsRows page={page} /> : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PageRowProps = Readonly<{
  page: SiteStatusPageDetailsDTO;
  isOpen: boolean;
  canToggle: boolean;
  onToggle: () => void;
}>;

function PageRow({ page, isOpen, canToggle, onToggle }: PageRowProps) {
  const t = useTranslations();

  const handleRowKeyDown: KeyboardEventHandler<HTMLTableRowElement> = (
    event,
  ) => {
    if (!canToggle) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <TableRow
      className={[
        "hover:bg-accent/40",
        canToggle
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : "",
      ].join(" ")}
      onClick={canToggle ? onToggle : undefined}
      onKeyDown={handleRowKeyDown}
      tabIndex={canToggle ? 0 : -1}
      role={canToggle ? "button" : undefined}
      aria-expanded={canToggle ? isOpen : undefined}
      aria-disabled={canToggle ? undefined : true}
    >
      <TableCell className="align-middle">
        <DiffStatusBadge
          kind={page.diff}
          publishedLabel={t("common.published")}
        />
      </TableCell>

      <TableCell className="align-middle">
        <Text className="font-medium" truncate>
          {page.name}
        </Text>
        <Text variant="muted" truncate>
          {formatPagePath(page.slug)}
        </Text>
      </TableCell>

      <TableCell className="align-middle">
        <BlocksSummary blocks={page.blocks} />
      </TableCell>

      <TableCell className="align-middle">
        {canToggle ? (
          isOpen ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/**
 * Sous-lignes de table pour les blocs.
 *
 * @remarks
 * - Col 1 : status du bloc.
 * - Col 2 : titre / description courte.
 * - Col 3 : badges descriptifs.
 * - Col 4 : vide (alignement).
 */
function BlocksDetailsRows({
  page,
}: Readonly<{ page: SiteStatusPageDetailsDTO }>) {
  const t = useTranslations();
  const { blocks, isLoading } = useListPageBlocks(page.id);

  const diffByBlockId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const output: Record<string, SiteDiffKindDTO> = {};

    for (const item of page.blockItems ?? []) {
      output[item.id] = item.diff;
    }

    return output;
  }, [page.blockItems]);

  if (isLoading) {
    return (
      <TableRow className="hover:bg-accent/40">
        <TableCell colSpan={4} className="bg-accent/30">
          <LoadingStatus />
        </TableCell>
      </TableRow>
    );
  }

  if (!blocks || blocks.length === 0) {
    return (
      <TableRow className="hover:bg-accent/40">
        <TableCell colSpan={4} className="bg-accent/30">
          <Text variant="muted">—</Text>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {blocks.map((block, index) => (
        <TableRow key={block.id} className="hover:bg-accent/40">
          <TableCell className="bg-accent/30 align-middle">
            <div className="flex items-center justify-center gap-2">
              <DiffStatusBadge
                kind={diffByBlockId[block.id]}
                publishedLabel={t("common.published")}
              />
            </div>
          </TableCell>

          <TableCell className="bg-accent/30 align-middle">
            <div className="min-w-0">
              <BlockCellsDescription block={block} index={index} mode="title" />
            </div>
          </TableCell>

          <TableCell className="bg-accent/30 align-middle">
            <BlockCellsDescription block={block} mode="badges" />
          </TableCell>

          <TableCell className="bg-accent/30" />
        </TableRow>
      ))}
    </>
  );
}

type BlocksSummaryProps = Readonly<{
  blocks: SiteStatusPageDetailsDTO["blocks"];
}>;

function BlocksSummary({ blocks }: BlocksSummaryProps) {
  const t = useTranslations();

  const next = Number(blocks.new ?? 0);
  const modified = Number(blocks.modified ?? 0);
  const deleted = Number(blocks.deleted ?? 0);
  const published = Number(blocks.published ?? 0);

  const items = [
    { key: "new", count: next, label: t("common.new") },
    { key: "modified", count: modified, label: t("common.modified") },
    { key: "deleted", count: deleted, label: t("common.deleted") },
    { key: "published", count: published, label: t("common.published") },
  ].filter((item) => item.count > 0);

  if (items.length === 0) {
    return <Text variant="muted">—</Text>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <Badge
          key={item.key}
          variant="outline"
          className="text-xs"
          aria-label={`${item.count} ${item.label}`}
        >
          {item.count} {item.label}
        </Badge>
      ))}
    </div>
  );
}

OverviewStatusDetailsTable.displayName = "OverviewStatusDetailsTable";
