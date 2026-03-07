"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteSocialMenu.tsx
 * @layer ui/site/components
 *
 * @description
 * Molecule site : menu social (liste de liens icônes) rendu depuis des items normalisés.
 *
 * @remarks
 * - Rend `null` si la liste est vide.
 * - Délègue le rendu du lien à `SiteIconLink` (a11y + garde-fous href).
 * - L’icône est rendue via `renderSocialKindIcon`.
 * - La clé de liste est stabilisée via `toStableUiKey`.
 * - Le style est fourni par le skin/template via `ui`.
 */

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { renderSocialKindIcon } from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { SiteIconLink } from "@compoz/ui/site/components/atoms/SiteIconLink";
import type { SiteSocialMenuUi } from "@compoz/ui/site/site-ui.types.ts";

export type SiteSocialMenuItem = Readonly<{ kind: string; href: string }>;

export type SiteSocialMenuProps = Readonly<{
  settings?: Readonly<{ items?: ReadonlyArray<SiteSocialMenuItem> }>;
  ui: SiteSocialMenuUi;
}>;

export function SiteSocialMenu({ settings, ui }: SiteSocialMenuProps) {
  const items = settings?.items ?? [];
  if (items.length === 0) return null;

  return (
    <ul className={cn(ui.list)}>
      {items.map((it, idx) => (
        <li
          key={toStableUiKey(
            { keyId: `${it.kind}:${idx}`, href: it.href },
            idx,
          )}
          className={cn(ui.item)}
        >
          <SiteIconLink
            href={it.href}
            ariaLabel={it.kind}
            className={cn(ui.interactive)}
            linkClassName={cn(ui.link)}
            icon={renderSocialKindIcon(it.kind, { className: cn(ui.icon) })}
          />
        </li>
      ))}
    </ul>
  );
}

SiteSocialMenu.displayName = "SiteSocialMenu";
