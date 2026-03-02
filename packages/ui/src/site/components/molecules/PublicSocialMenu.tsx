"use client";

/**
 * @file packages/ui/src/site/components/molecules/PublicSocialMenu.tsx
 * @layer ui/public/molecules
 *
 * @description
 * Molecule public : menu social (liste de liens icônes) rendu depuis des items normalisés.
 *
 * @remarks
 * - Rend `null` si la liste est vide.
 * - Délègue le rendu du lien à `PublicIconLink` (a11y + garde-fous href).
 * - L’icône est rendue via `renderSocialKindIcon`.
 * - La clé de liste est stabilisée via `toStableUiKey`.
 * - Le style est fourni par le skin/template via `ui`.
 */

"use client";

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { renderSocialKindIcon } from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { PublicIconLink } from "@compoz/ui/site/components/atoms/PublicIconLink";
import type { PublicSocialMenuUi } from "@compoz/ui/site/public-ui.types";

export type PublicSocialMenuItem = Readonly<{ kind: string; href: string }>;

export type PublicSocialMenuProps = Readonly<{
  settings?: Readonly<{ items?: ReadonlyArray<PublicSocialMenuItem> }>;
  ui: PublicSocialMenuUi;
}>;

export function PublicSocialMenu({ settings, ui }: PublicSocialMenuProps) {
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
          <PublicIconLink
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

PublicSocialMenu.displayName = "PublicSocialMenu";
