"use client";

/**
 * @file apps/studio/src/features/overview/OverviewStatusDetailsTable.tsx
 * @layer ui/overview
 *
 * @description
 * Table lazy des détails pages / blocs (draft vs published).
 */

import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";

import type {
  SiteDiffKindDTO,
  SiteStatusPageDetailsDTO,
} from "@compoz/core/domain/site/dto";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";

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

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";

import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { BlockCellsDescription } from "@compoz/studio/features/pages/blocks/components/molecules/BlockCellsDescription";
import { Badge } from "@compoz/ui/components/ui/badge";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
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
  const showInitialLoading = details.isLoading && !hasData; // 1er load seulement
  const showRefreshing = details.isFetching && hasData; // refetch / switch scope

  // ✅ Tri des pages par titre (locale-aware) pour un ordre “humain”.
  const collator = useMemo(
    () => new Intl.Collator(locale, { sensitivity: "base" }),
    [locale],
  );

  const pagesSorted = useMemo(() => {
    const pages = details.data?.pages ?? [];
    if (pages.length <= 1) return pages;

    return [...pages].sort((a, b) => {
      const cmp = collator.compare(a.title ?? "", b.title ?? "");
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    });
  }, [details.data?.pages, collator]);

  return (
    <Card variant="panel">
      <CardHeader className="flex items-center justify-between gap-4">
        <Heading as="h3">{t("admin.overviewSection.details.title")}</Heading>

        <Button
          variant="outline"
          onClick={() => {
            setOpenPageId(null);
            setScope((s) => (s === "dirty" ? "all" : "dirty"));
          }}
        >
          {scope === "dirty"
            ? t("admin.overviewSection.details.showAll")
            : t("admin.overviewSection.details.showDirty")}
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
            {t("admin.overviewSection.details.empty")}
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
                    {t("admin.shared.entities.pages")}
                  </TableHead>
                  <TableHead>{t("admin.shared.entities.blocks")}</TableHead>
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

function PageRow({
  page,
  isOpen,
  canToggle,
  onToggle,
}: {
  page: SiteStatusPageDetailsDTO;
  isOpen: boolean;
  canToggle: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations();

  const handleRowKeyDown: React.KeyboardEventHandler<HTMLTableRowElement> = (
    e,
  ) => {
    if (!canToggle) return;

    // Accessibilité clavier : Enter/Espace toggle.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
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
      // rendre la ligne focusable uniquement si interactive
      tabIndex={canToggle ? 0 : -1}
      role={canToggle ? "button" : undefined}
      aria-expanded={canToggle ? isOpen : undefined}
      aria-disabled={canToggle ? undefined : true}
    >
      {/* ✅ Col 1 — Status */}
      <TableCell className="align-middle">
        <DiffStatusBadge
          kind={page.diff}
          publishedLabel={t("common.published")}
        />
      </TableCell>

      {/* ✅ Col 2 — Page (title + slug) */}
      <TableCell className="align-middle">
        <Text className="font-medium" truncate>
          {page.title}
        </Text>
        <Text variant="muted" truncate>
          {formatPagePath(page.slug)}
        </Text>
      </TableCell>

      {/* ✅ Col 3 — Résumé blocs */}
      <TableCell className="align-middle">
        <BlocksSummary blocks={page.blocks} />
      </TableCell>

      {/* ✅ Col 4 — Chevron indicateur (reste cliquable, mais discret) */}
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
 * ✅ Sous-lignes de table pour les blocs.
 * - Col 1: Status (badge diff) + marqueur "└"
 * - Col 2: Titre (mode="title") indent
 * - Col 3: Badges (mode="badges")
 * - Col 4: vide
 */
function BlocksDetailsRows({ page }: { page: SiteStatusPageDetailsDTO }) {
  const t = useTranslations();
  const { blocks, isLoading } = useListPageBlocks(page.id);

  const diffByBlockId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const out: Record<string, SiteDiffKindDTO> = {};
    for (const it of page.blockItems ?? []) out[it.id] = it.diff;
    return out;
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
          {/* Col 1 — Status + marqueur discret */}
          <TableCell className="bg-accent/30 align-middle">
            <div className="flex items-center justify-center gap-2">
              <DiffStatusBadge
                kind={diffByBlockId[block.id]}
                publishedLabel={t("common.published")}
              />
            </div>
          </TableCell>

          {/* Col 2 — Titre (indent) */}
          <TableCell className="bg-accent/30 align-middle">
            <div className="min-w-0">
              <BlockCellsDescription block={block} index={index} mode="title" />
            </div>
          </TableCell>

          {/* Col 3 — Badges icônes (description) */}
          <TableCell className="bg-accent/30 align-middle">
            <BlockCellsDescription block={block} mode="badges" />
          </TableCell>

          {/* Col 4 — vide */}
          <TableCell className="bg-accent/30" />
        </TableRow>
      ))}
    </>
  );
}

function BlocksSummary({
  blocks,
}: {
  blocks: SiteStatusPageDetailsDTO["blocks"];
}) {
  const t = useTranslations();

  const next = Number(blocks.new ?? 0);
  const modified = Number(blocks.modified ?? 0);
  const deleted = Number(blocks.deleted ?? 0);
  const published = Number(blocks.published ?? 0);

  // ✅ Seulement les non-zéros : sinon ça devient du bruit visuel.
  const items = [
    { key: "new", count: next, label: t("common.new") },
    { key: "modified", count: modified, label: t("common.modified") },
    { key: "deleted", count: deleted, label: t("common.deleted") },
    { key: "published", count: published, label: t("common.published") },
  ].filter((x) => x.count > 0);

  if (items.length === 0) return <Text variant="muted">—</Text>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it) => (
        <Badge
          key={it.key}
          variant="outline"
          className="text-xs"
          aria-label={`${it.count} ${it.label}`}
        >
          {it.count} {it.label}
        </Badge>
      ))}
    </div>
  );
}

OverviewStatusDetailsTable.displayName = "OverviewStatusDetailsTable";
