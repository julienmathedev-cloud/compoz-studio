/**
 * @file packages/core/src/domain/site/helpers/replace-page-path-in-menus.test.ts
 * @layer core/domain/site/helpers
 * @description Unit tests for menu references updated after a page slug rename.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { replacePagePathInMenus } from "@compoz/core/domain/site/helpers/replace-page-path-in-menus";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

function settingsWithMenuHrefs(): SiteSettings {
  return {
    primaryMenu: {
      items: [
        {
          id: "about",
          label: "À propos",
          href: "/a-propos" as never,
          newTab: false,
          children: [
            {
              id: "journey",
              label: "Parcours",
              href: "/a-propos#parcours" as never,
              newTab: false,
              children: [],
            },
          ],
        },
        {
          id: "nearby",
          label: "Équipe",
          href: "/a-propos-equipe" as never,
          newTab: false,
          children: [],
        },
        {
          id: "external",
          label: "Externe",
          href: "https://example.com/a-propos" as never,
          newTab: true,
          children: [],
        },
      ],
    },
    legalMenu: {
      items: [
        {
          id: "legal-about",
          label: "Mentions",
          href: "/a-propos?source=menu" as never,
          newTab: false,
        },
        {
          id: "mail",
          label: "Email",
          href: "mailto:test@example.com" as never,
          newTab: false,
        },
      ],
    },
  } as unknown as SiteSettings;
}

function settingsWithHomeAlias(): SiteSettings {
  return {
    primaryMenu: {
      items: [
        {
          id: "home",
          label: "Accueil",
          href: `/${HOME_SLUG}#hero` as never,
          newTab: false,
          children: [],
        },
      ],
    },
    legalMenu: {
      items: [],
    },
  } as unknown as SiteSettings;
}

void test("updates every exact internal menu path and retains query strings and anchors", () => {
  const result = replacePagePathInMenus({
    settings: settingsWithMenuHrefs(),
    fromSlug: "a-propos",
    toSlug: "equipe",
  });

  assert.equal(result.changed, true);
  assert.equal(result.settings.primaryMenu.items[0]?.href, "/equipe");
  assert.equal(
    result.settings.primaryMenu.items[0]?.children[0]?.href,
    "/equipe#parcours",
  );
  assert.equal(result.settings.legalMenu.items[0]?.href, "/equipe?source=menu");
});

void test("does not rewrite neighboring paths, external URLs, special protocols, or unchanged slugs", () => {
  const settings = settingsWithMenuHrefs();
  const result = replacePagePathInMenus({
    settings,
    fromSlug: "a-propos",
    toSlug: "equipe",
  });

  assert.equal(result.settings.primaryMenu.items[1]?.href, "/a-propos-equipe");
  assert.equal(
    result.settings.primaryMenu.items[2]?.href,
    "https://example.com/a-propos",
  );
  assert.equal(
    result.settings.legalMenu.items[1]?.href,
    "mailto:test@example.com",
  );

  const unchanged = replacePagePathInMenus({
    settings,
    fromSlug: "a-propos",
    toSlug: "a-propos",
  });

  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.settings, settings);
});

void test("updates the historical home alias and retains its hash fragment", () => {
  const result = replacePagePathInMenus({
    settings: settingsWithHomeAlias(),
    fromSlug: HOME_SLUG,
    toSlug: "accueil",
  });

  assert.equal(result.changed, true);
  assert.equal(result.settings.primaryMenu.items[0]?.href, "/accueil#hero");
});
