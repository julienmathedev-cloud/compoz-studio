"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageListItem.tsx
 * @layer ui/molecules
 *
 * @description
 * Ligne compacte pour afficher une page (titre + slug) avec des actions rapides.
 *
 * @remarks
 * - Molecule UI : compose `Text`, `TooltipButton`, `DeleteButton`, `AdminButtonGroup`.
 * - Les callbacks sont fournis par le parent (orchestration via hooks/sections).
 * - Supporte un état occupé local (`isDeleting`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
 */

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { cn } from "@compoz/ui/lib/utils";
import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";

import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { AdminButtonGroup } from "@compoz/studio/components/molecules/controls/AdminButtonGroup";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { FileText, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Props du composant `PageListItem`.
 */
type PageListItemProps = Readonly<{
  /** Référence minimaliste de la page (titre + slug). */
  page: PageSummaryDTO;

  /** Status draft vs published (clean/new/dirty/deleted). */
  statusKind?: SiteDiffKindDTO;

  /** Action : éditer les métadonnées (id). */
  onEditMeta?: (pageId: string) => void;

  /** Action : éditer le contenu (id). */
  onEditContent?: (pageId: string) => void;

  /** Action : suppression (confirmation + I/O gérées par le parent). */
  onDelete?: () => void;

  /** Indique une suppression en cours (désactive les actions concernées). */
  isDeleting?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;
}>;

/**
 * Ligne UI d’une page dans la liste (admin).
 *
 * @remarks
 * Ne rend pas de `<li>` : le conteneur parent gère la sémantique de liste.
 */
export function PageListItem({
  page,
  statusKind,
  onEditMeta,
  onEditContent,
  onDelete,
  isDeleting = false,
  disabled = false,
}: PageListItemProps) {
  const t = useTranslations();

  const isBusy = isDeleting;
  const baseDisabled = disabled || isBusy;

  const canEditMeta = Boolean(onEditMeta) && !baseDisabled;
  const canEditContent = Boolean(onEditContent) && !disabled; // reste dispo si pas de verrou global
  const canDelete = Boolean(onDelete) && !baseDisabled;

  return (
    <div
      className={cn(
        "grid items-center gap-3",
        "grid-cols-[max-content_auto_1fr_auto]",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      {/* Col 1 — Texte (taille au contenu) */}
      <div className="flex min-w-[12ch] items-center justify-center">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      {/* Col 2 — Badge (proche du titre) */}
      <div>
        <Text as="p" truncate className="mb-0!">
          {page.title}
        </Text>

        <Text as="p" variant="meta" truncate>
          {formatPagePath(page.slug)}
        </Text>
      </div>

      {/* Col 4 — Actions (à droite) */}
      <div className="shrink-0 justify-self-end">
        <AdminButtonGroup className="shrink-0">
          <TooltipButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEditMeta?.(page.id)}
            disabled={!canEditMeta}
            aria-label={t("admin.pageListItem.editMeta")}
            tooltip={
              !canEditMeta
                ? t("common.actionUnavailable")
                : t("admin.pageListItem.editMeta")
            }
          >
            <AdminIcon icon={Settings} />
          </TooltipButton>

          <TooltipButton
            type="button"
            size="icon"
            onClick={() => onEditContent?.(page.id)}
            disabled={!canEditContent}
            aria-label={t("admin.pageListItem.editContent")}
            tooltip={
              !canEditContent
                ? t("common.actionUnavailable")
                : t("admin.pageListItem.editContent")
            }
          >
            <AdminIcon icon={FileText} />
          </TooltipButton>

          <DeleteButton
            size="icon"
            disabled={!canDelete}
            isDeleting={isDeleting}
            onConfirmDelete={async () => onDelete?.()}
            ariaLabel={t("admin.pageListItem.deletePage")}
            title={t("admin.pageListItem.deletePage")}
          />
        </AdminButtonGroup>
      </div>
    </div>
  );
}

PageListItem.displayName = "PageListItem";
