/**
 * @file packages/infra/src/site/mappers/site-settings.mapper.ts
 * @layer infra/site
 * @description Maps Prisma SiteSettings JSON rows to domain settings and back to Prisma write data.
 * @remarks
 * Invalid persisted JSON object shapes fall back to domain defaults; legacy SEO structured data shapes are normalized here.
 */

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";

import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { Prisma } from "@compoz/infra/prisma/generated";

export type PrismaContentState = "draft" | "published";

export type PrismaSiteSettingsRow = {
  header: unknown;
  footer: unknown;
  primaryMenu: unknown;
  legalMenu: unknown;
  social: unknown;
  identity: unknown;
  seo: unknown;
  theme: unknown;
};

export type PrismaSiteSettingsUpdateData = {
  header: Prisma.InputJsonValue;
  footer: Prisma.InputJsonValue;
  primaryMenu: Prisma.InputJsonValue;
  legalMenu: Prisma.InputJsonValue;
  social: Prisma.InputJsonValue;
  identity: Prisma.InputJsonValue;
  seo: Prisma.InputJsonValue;
  theme: Prisma.InputJsonValue;
};

export type PrismaSiteSettingsCreateData = PrismaSiteSettingsUpdateData & {
  websiteId: string;
  state: PrismaContentState;
};

type PersistedSeoSettings = Omit<Partial<SeoSettings>, "structuredData"> & {
  structuredData?: SeoSettings["structuredData"] | boolean;
  structuredDataEnabled?: boolean;
};

function defaultSettings(): SiteSettings {
  return {
    header: { ...DEFAULT_HEADER_SETTINGS },
    footer: { ...DEFAULT_FOOTER_SETTINGS },
    primaryMenu: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
    legalMenu: { ...DEFAULT_LEGAL_MENU_SETTINGS },
    identity: { ...DEFAULT_IDENTITY_SETTINGS },
    social: { ...DEFAULT_SOCIAL_SETTINGS },
    seo: {
      ...DEFAULT_SEO_SETTINGS,
      structuredData: { ...DEFAULT_SEO_SETTINGS.structuredData },
    },
    theme: {
      ...DEFAULT_THEME_SETTINGS,
      lightTokens: { ...DEFAULT_THEME_SETTINGS.lightTokens },
      darkTokens: { ...DEFAULT_THEME_SETTINGS.darkTokens },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads object-shaped JSON settings and ignores invalid persisted shapes. */
function readObjectSetting<T extends object>(value: unknown, fallback: T): T {
  if (!isRecord(value)) return fallback;

  return value as T;
}

/** Centralizes the domain-to-Prisma JSON boundary cast. */
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeSeoSettings(seo: unknown): SeoSettings {
  const persisted = isRecord(seo) ? (seo as PersistedSeoSettings) : undefined;

  const legacyEnabled =
    typeof persisted?.structuredData === "boolean"
      ? persisted.structuredData
      : typeof persisted?.structuredDataEnabled === "boolean"
        ? persisted.structuredDataEnabled
        : undefined;

  const structuredData =
    persisted?.structuredData &&
    typeof persisted.structuredData === "object" &&
    !Array.isArray(persisted.structuredData)
      ? {
          ...DEFAULT_SEO_SETTINGS.structuredData,
          ...persisted.structuredData,
        }
      : {
          ...DEFAULT_SEO_SETTINGS.structuredData,
          enabled: legacyEnabled ?? DEFAULT_SEO_SETTINGS.structuredData.enabled,
        };

  const {
    structuredData: _legacyStructuredData,
    structuredDataEnabled: _legacyStructuredDataEnabled,
    ...current
  } = persisted ?? {};

  return {
    ...DEFAULT_SEO_SETTINGS,
    ...current,
    structuredData,
  };
}

function mergeThemeSettings(theme: unknown): SiteSettings["theme"] {
  const persisted = isRecord(theme)
    ? (theme as Partial<SiteSettings["theme"]>)
    : undefined;

  return {
    ...DEFAULT_THEME_SETTINGS,
    ...persisted,
    headingFont: persisted?.headingFont ?? null,
    lightTokens: {
      ...DEFAULT_THEME_SETTINGS.lightTokens,
      ...persisted?.lightTokens,
    },
    darkTokens: {
      ...DEFAULT_THEME_SETTINGS.darkTokens,
      ...persisted?.darkTokens,
    },
  };
}

export function toDomainSiteSettings(
  row: PrismaSiteSettingsRow | null | undefined,
): SiteSettings {
  const d = defaultSettings();

  if (!row) return d;

  return {
    header: readObjectSetting(row.header, d.header),
    footer: readObjectSetting(row.footer, d.footer),
    primaryMenu: readObjectSetting(row.primaryMenu, d.primaryMenu),
    legalMenu: readObjectSetting(row.legalMenu, d.legalMenu),
    identity: readObjectSetting(row.identity, d.identity),
    social: readObjectSetting(row.social, d.social),
    seo: normalizeSeoSettings(row.seo),
    theme: mergeThemeSettings(row.theme),
  };
}

export function toPrismaSiteSettingsCreateData(
  websiteId: string,
  state: PrismaContentState,
  settings: Readonly<SiteSettings>,
): PrismaSiteSettingsCreateData {
  return {
    websiteId,
    state,
    ...toPrismaSiteSettingsUpdateData(settings),
  };
}

export function toPrismaSiteSettingsUpdateData(
  settings: Readonly<SiteSettings>,
): PrismaSiteSettingsUpdateData {
  return {
    header: toJsonValue(settings.header),
    footer: toJsonValue(settings.footer),
    primaryMenu: toJsonValue(settings.primaryMenu),
    legalMenu: toJsonValue(settings.legalMenu),
    identity: toJsonValue(settings.identity),
    social: toJsonValue(settings.social),
    seo: toJsonValue(settings.seo),
    theme: toJsonValue(settings.theme),
  };
}

export function toDefaultSiteSettings(): SiteSettings {
  return defaultSettings();
}
