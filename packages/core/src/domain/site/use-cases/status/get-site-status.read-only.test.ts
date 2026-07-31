/**
 * @file packages/core/src/domain/site/use-cases/status/get-site-status.read-only.test.ts
 * @layer core/domain/site/use-cases/status
 * @description Verifies status reads do not provision Website storage.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { getSiteStatus } from "@compoz/core/domain/site/use-cases/status/get-site-status";
import { getSiteStatusDetails } from "@compoz/core/domain/site/use-cases/status/get-site-status-details";

const SETTINGS = {
  header: DEFAULT_HEADER_SETTINGS,
  footer: DEFAULT_FOOTER_SETTINGS,
  identity: DEFAULT_IDENTITY_SETTINGS,
  primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
  legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
  social: DEFAULT_SOCIAL_SETTINGS,
  seo: DEFAULT_SEO_SETTINGS,
  theme: DEFAULT_THEME_SETTINGS,
};

function dependencies() {
  let pagesEnsureBaseCalls = 0;
  let siteEnsureBaseCalls = 0;
  const pages = {
    ensureBase: async () => {
      pagesEnsureBaseCalls += 1;
    },
    readManyById: async () => [],
  } as unknown as PagesRepository;
  const site = {
    ensureBase: async () => {
      siteEnsureBaseCalls += 1;
    },
    readIndex: async () => ({ pages: [], updatedAt: "" }),
    readSettings: async () => SETTINGS,
  } as unknown as SiteRepository;
  const cache = {
    readStatusSnapshot: async () => null,
    putStatusSnapshot: async () => undefined,
    readStatusDetailsSnapshot: async () => null,
    putStatusDetailsSnapshot: async () => undefined,
  } as unknown as SiteStatusCachePort;

  return {
    pages,
    site,
    cache,
    ensureBaseCalls: () => ({ pages: pagesEnsureBaseCalls, site: siteEnsureBaseCalls }),
  };
}

void test("status cache misses do not provision Pages or Site storage", async () => {
  const deps = dependencies();

  await getSiteStatus(deps)();

  assert.deepEqual(deps.ensureBaseCalls(), { pages: 0, site: 0 });
});

void test("status details cache misses do not provision Pages or Site storage", async () => {
  const deps = dependencies();

  await getSiteStatusDetails(deps)({ scope: "all", includeBlocks: false });

  assert.deepEqual(deps.ensureBaseCalls(), { pages: 0, site: 0 });
});
