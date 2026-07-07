"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/MenuBadges.tsx
 * @layer studio/features/settings/menus/shared
 *
 * @description
 * Shared studio badges describing a menu item as grouped, external, or internal.
 *
 * @remarks
 * - Uses only a minimal menu item shape so it can be reused by multiple menu settings forms.
 * - Link semantics are delegated to `resolveLinkFlags` to keep badge detection aligned with runtime link handling.
 */

import { ExternalLink, FolderTree, Link } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Badge } from "@compoz/ui/components/ui/badge";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { cn } from "@compoz/ui/lib/utils";

/** Minimal menu item shape required by badge detection. */
type MenuItemForBadges = Readonly<{
  href: string;
  children?: ReadonlyArray<unknown>;
  hasChildren?: boolean;
}>;

type Kind = "group" | "external" | "internal";

/**
 * Resolves all badges that should be shown for a menu item.
 *
 * @remarks
 * - A grouped item still receives a link-type badge because groups can also point to a target.
 * - `resolveLinkFlags` is the source of truth for external link detection.
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

/** Icons used by each badge kind. */
const ICONS: Record<Kind, ComponentType<SVGProps<SVGSVGElement>>> = {
  group: FolderTree,
  external: ExternalLink,
  internal: Link,
};

type MenuBadgesProps = Readonly<{
  item: MenuItemForBadges;
  className?: string;
}>;

export function MenuBadges({ item, className }: MenuBadgesProps) {
  const t = useTranslations();
  const hrefStr = String(item.href ?? "");
  const hasChildren =
    Boolean(item.hasChildren) ||
    (Array.isArray(item.children) && item.children.length > 0);

  const kinds = detectKind(hrefStr, hasChildren);
  const labels = kinds.map((kind) => t(`studio.menuBadges.kinds.${kind}`));
  const labelJoined = labels.join(", ");

  if (kinds.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-1", className)}
      aria-label={t("studio.menuBadges.ariaLabel", { types: labelJoined })}
    >
      {kinds.map((kind) => {
        const Icon = ICONS[kind];

        return (
          <Badge key={kind} variant="info" visualMode="studio">
            <StudioIcon icon={Icon} />
            <span>{t(`studio.menuBadges.kinds.${kind}`)}</span>
          </Badge>
        );
      })}
    </div>
  );
}

MenuBadges.displayName = "MenuBadges";
