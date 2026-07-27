/**
 * @file packages/core/src/domain/site/helpers/replace-page-path-in-menus.ts
 * @layer core/domain/site/helpers
 *
 * @description
 * Replaces exact internal page paths in primary and legal menu links.
 *
 * @remarks
 * Query strings and hash fragments are retained. Absolute and special-protocol
 * URLs are intentionally outside this page-path migration.
 */

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { toInternalPathFromSlug } from "@compoz/core/domain/slug/utils";
import type { PrimaryMenuItem } from "@compoz/core/domain/site/entities/primary-menu";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { asAssetUrl } from "@compoz/core/domain/urls/href";

type MenuPatchResult = Readonly<{
  settings: SiteSettings;
  changed: boolean;
}>;

function replaceExactInternalPath(args: {
  href: string;
  fromPath: string;
  toPath: string;
  fromSlug: string;
}): string | null {
  const href = String(args.href ?? "").trim();

  // Root-relative links are the only menu hrefs that identify a page within
  // this website. This rejects absolute URLs and protocol-relative references.
  if (!href.startsWith("/") || href.startsWith("//")) return null;

  try {
    const parsed = new URL(href, "https://compoz.invalid");
    const isHomeAlias =
      args.fromSlug === HOME_SLUG && parsed.pathname === `/${HOME_SLUG}`;

    if (parsed.pathname !== args.fromPath && !isHomeAlias) return null;

    return `${args.toPath}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function patchPrimaryItem(args: {
  item: PrimaryMenuItem;
  fromPath: string;
  toPath: string;
  fromSlug: string;
}): Readonly<{ item: PrimaryMenuItem; changed: boolean }> {
  const href = replaceExactInternalPath({
    href: args.item.href,
    fromPath: args.fromPath,
    toPath: args.toPath,
    fromSlug: args.fromSlug,
  });

  let childrenChanged = false;
  const children = args.item.children.map((child) => {
    const patched = patchPrimaryItem({ ...args, item: child });
    childrenChanged ||= patched.changed;
    return patched.item;
  });

  if (!href && !childrenChanged) return { item: args.item, changed: false };

  return {
    item: {
      ...args.item,
      ...(href ? { href: asAssetUrl(href) } : {}),
      ...(childrenChanged ? { children } : {}),
    },
    changed: true,
  };
}

/** Builds a new settings aggregate only when an exact internal page path changed. */
export function replacePagePathInMenus(args: {
  settings: SiteSettings;
  fromSlug: string;
  toSlug: string;
}): MenuPatchResult {
  const fromPath = toInternalPathFromSlug(args.fromSlug);
  const toPath = toInternalPathFromSlug(args.toSlug);

  if (fromPath === toPath) {
    return { settings: args.settings, changed: false };
  }

  let primaryChanged = false;
  const primaryItems = args.settings.primaryMenu.items.map((item) => {
    const patched = patchPrimaryItem({
      item,
      fromPath,
      toPath,
      fromSlug: args.fromSlug,
    });
    primaryChanged ||= patched.changed;
    return patched.item;
  });

  let legalChanged = false;
  const legalItems = args.settings.legalMenu.items.map((item) => {
    const href = replaceExactInternalPath({
      href: item.href,
      fromPath,
      toPath,
      fromSlug: args.fromSlug,
    });

    if (!href) return item;

    legalChanged = true;
    return { ...item, href: asAssetUrl(href) };
  });

  if (!primaryChanged && !legalChanged) {
    return { settings: args.settings, changed: false };
  }

  return {
    settings: {
      ...args.settings,
      primaryMenu: primaryChanged
        ? { ...args.settings.primaryMenu, items: primaryItems }
        : args.settings.primaryMenu,
      legalMenu: legalChanged
        ? { ...args.settings.legalMenu, items: legalItems }
        : args.settings.legalMenu,
    },
    changed: true,
  };
}
