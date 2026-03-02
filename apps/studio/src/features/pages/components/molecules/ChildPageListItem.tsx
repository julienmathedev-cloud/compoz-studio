"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/ChildPageListItem.tsx
 * @layer ui/molecules
 *
 * @description
 * Ligne compacte pour afficher une page enfant (titre + slug) avec des actions de réordonnancement.
 *
 * @remarks
 * - Molecule UI : calquée sur `PageListItem` pour conserver le même rythme visuel (grid/colonnes/espacements).
 * - Les callbacks sont fournis par le parent (orchestration via hooks/sections).
 * - Supporte un état occupé local (`isReordering`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
 */
import { cn } from "@compoz/ui/lib/utils";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { AdminButtonGroup } from "@compoz/studio/components/molecules/controls/AdminButtonGroup";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Props du composant `ChildPageListItem`.
 */
type ChildPageListItemProps = Readonly<{
  /** Référence minimaliste de la page enfant (titre + slug). */
  page: PageSummaryDTO;

  /** Status draft vs published (optionnel, pour conserver la cohérence UI si tu veux l’afficher). */
  statusKind?: SiteDiffKindDTO;

  /** Index courant de l’item dans la liste. */
  index: number;

  /** Taille totale de la liste (sert aux limites haut/bas). */
  total: number;

  /** Action : monter l’item (réordonnancement). */
  onMoveUp?: () => void;

  /** Action : descendre l’item (réordonnancement). */
  onMoveDown?: () => void;

  /** Indique un réordonnancement en cours (désactive les actions concernées). */
  isReordering?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;
}>;

/**
 * Ligne UI d’une page enfant dans la liste (admin).
 *
 * @remarks
 * Ne rend pas de `<li>` : le conteneur parent gère la sémantique de liste.
 */
export function ChildPageListItem({
  page,
  statusKind,
  index,
  total,
  onMoveUp,
  onMoveDown,
  isReordering = false,
  disabled = false,
}: ChildPageListItemProps) {
  const t = useTranslations();

  const isBusy = isReordering;
  const baseDisabled = disabled || isBusy;

  // Limites de réordonnancement (UX)
  const isFirst = index <= 0;
  const isLast = index >= total - 1;

  const canMoveUp = Boolean(onMoveUp) && !baseDisabled && !isFirst;
  const canMoveDown = Boolean(onMoveDown) && !baseDisabled && !isLast;

  return (
    <div
      className={cn(
        "grid items-center gap-3",
        "grid-cols-[max-content_auto_1fr_auto]",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      {/* Col 1 — Badge (taille au contenu) */}
      <div className="flex min-w-[12ch] items-center justify-center">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.upToDate")}
          />
        ) : null}
      </div>

      {/* Col 2 — Texte (titre + slug) */}
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
            onClick={() => onMoveUp?.()}
            disabled={!canMoveUp}
            aria-label={t("common.moveUp")}
            tooltip={
              !canMoveUp ? t("common.actionUnavailable") : t("common.moveUp")
            }
          >
            <ChevronUp />
          </TooltipButton>

          <TooltipButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMoveDown?.()}
            disabled={!canMoveDown}
            aria-label={t("common.moveDown")}
            tooltip={
              !canMoveDown
                ? t("common.actionUnavailable")
                : t("common.moveDown")
            }
          >
            <ChevronDown />
          </TooltipButton>
        </AdminButtonGroup>
      </div>
    </div>
  );
}

ChildPageListItem.displayName = "ChildPageListItem";
