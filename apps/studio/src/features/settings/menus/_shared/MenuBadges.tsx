"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/MenuBadges.tsx
 * @layer ui/molecules
 *
 * @description
 * Badges (type + icône) décrivant un item de menu (groupe, externe, interne).
 *
 * @remarks
 * - Molecule UI : ne dépend que d’un modèle minimal (`href`, `children`).
 * - Détecte le type à partir de `href` + présence de `children`.
 * - Utilisable pour différents menus (menu principal, menu légal).
 * - Strictement UI-only : aucune logique métier.
 */

import { Badge } from "@compoz/ui/components/ui/badge";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";
import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { ExternalLink, FolderTree, Link } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

/**
 * Modèle minimal attendu pour déterminer les badges.
 */
type MenuItemForBadges = Readonly<{
  href: string;
  children?: ReadonlyArray<unknown>;
  hasChildren?: boolean;
}>;

/**
 * Types de badges supportés.
 */
type Kind = "group" | "external" | "internal";

/**
 * Détermine les badges à afficher à partir du `href` et de la présence d’enfants.
 *
 * @remarks
 * - `group` : l’item possède des `children`.
 * - `external` : `href` est détecté comme externe (http(s), //, mailto:, tel:, etc.).
 * - `internal` : tout le reste ("/", "/slug", "#anchor", etc.).
 */
function detectKind(href: string, hasChildren: boolean): Kind[] {
  const kinds: Kind[] = [];

  if (hasChildren) {
    kinds.push("group");
  }

  const flags = resolveLinkFlags(href);
  if (flags.rawExternal) {
    kinds.push("external");
  } else {
    kinds.push("internal");
  }

  return kinds;
}

/** Mapping `Kind` → icône (Lucide) rendue via `AdminIcon`. */
const ICONS: Record<Kind, ComponentType<SVGProps<SVGSVGElement>>> = {
  group: FolderTree,
  external: ExternalLink,
  internal: Link,
};

/**
 * Props du composant `MenuBadges`.
 */
type MenuBadgesProps = Readonly<{
  /** Item minimal utilisé pour déterminer les badges. */
  item: MenuItemForBadges;
  /** Classes additionnelles appliquées au conteneur. */
  className?: string;
}>;

/**
 * Affiche des badges décrivant la nature d’un item de menu (admin).
 */
export function MenuBadges({ item, className }: MenuBadgesProps) {
  const t = useTranslations();
  const hrefStr = String(item.href ?? "");
  const hasChildren =
    Boolean(item.hasChildren) ||
    (Array.isArray(item.children) && item.children.length > 0);

  const kinds = detectKind(hrefStr, hasChildren);
  const labels = kinds.map((k) => t(`admin.menuBadges.kinds.${k}`));
  const labelJoined = labels.join(", ");

  if (kinds.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-1", className)}
      aria-label={t("admin.menuBadges.ariaLabel", { types: labelJoined })}
    >
      {kinds.map((k, i) => {
        const Icon = ICONS[k];

        return (
          <Badge key={toStableUiKey({ label: k }, i)} variant="info">
            <AdminIcon icon={Icon} />
            <span>{t(`admin.menuBadges.kinds.${k}`)}</span>
          </Badge>
        );
      })}
    </div>
  );
}

MenuBadges.displayName = "MenuBadges";
