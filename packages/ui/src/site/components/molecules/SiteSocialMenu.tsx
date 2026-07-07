/**
 * @file packages/ui/src/site/components/molecules/SiteSocialMenu.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders the public site social menu as a list of icon links.
 *
 * @remarks
 * Returns nothing when no item is available; link rendering is delegated to `SiteIconLink` for accessible labels and href guardrails.
 */

import { renderSocialKindIcon } from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { SiteIconLink } from "@compoz/ui/site/components/atoms/SiteIconLink";
import type { SiteSocialMenuUi } from "@compoz/ui/site/site-ui.types";

export type SiteSocialMenuItem = Readonly<{
  id: string;
  kind: string;
  href: string;
}>;

export type SiteSocialMenuProps = Readonly<{
  settings?: Readonly<{ items?: ReadonlyArray<SiteSocialMenuItem> }>;
  ui: SiteSocialMenuUi;
}>;

export function SiteSocialMenu({ settings, ui }: SiteSocialMenuProps) {
  const items = settings?.items ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn(ui.list)}>
      {items.map((item) => (
        <li key={item.id} className={cn(ui.item)}>
          <SiteIconLink
            href={item.href}
            ariaLabel={item.kind}
            className={cn(ui.interactive)}
            linkClassName={cn(ui.link)}
            icon={renderSocialKindIcon(item.kind, {
              className: cn(ui.icon),
            })}
          />
        </li>
      ))}
    </ul>
  );
}

SiteSocialMenu.displayName = "SiteSocialMenu";
