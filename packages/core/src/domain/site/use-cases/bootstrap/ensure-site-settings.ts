/**
 * @file packages/core/src/domain/site/use-cases/bootstrap/ensure-site-settings.ts
 * @layer core/domain/site/use-cases/bootstrap
 * @description Ensures missing site settings sections are initialized with defaults.
 * @remarks
 * Existing persisted sections are preserved; only missing sections are written back.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  FooterSettings,
  HeaderSettings,
  IdentitySettings,
  LegalMenuSettings,
  PrimaryMenuSettings,
  SeoSettings,
  SocialSettings,
} from "@compoz/core/domain/site/entities";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

async function ensureSubSettings<
  T extends keyof Awaited<ReturnType<SiteRepository["readSettings"]>>,
>(
  repo: SiteRepository,
  defaults: Awaited<ReturnType<SiteRepository["readSettings"]>>[T],
  state: ContentState,
  key: T,
): Promise<Awaited<ReturnType<SiteRepository["readSettings"]>>[T]> {
  await repo.ensureBase();

  const current = await repo.readSettings(state);

  if (current[key]) {
    return current[key];
  }

  const next = {
    ...current,
    [key]: defaults,
  };

  await repo.putSettings(state, next);

  return defaults;
}

export async function ensureIdentitySettings(
  repo: SiteRepository,
  defaults: IdentitySettings,
  state: ContentState,
): Promise<IdentitySettings> {
  return ensureSubSettings(repo, defaults, state, "identity");
}

export async function ensureLegalMenuSettings(
  repo: SiteRepository,
  defaults: LegalMenuSettings,
  state: ContentState,
): Promise<LegalMenuSettings> {
  return ensureSubSettings(repo, defaults, state, "legalMenu");
}

export async function ensurePrimaryMenuSettings(
  repo: SiteRepository,
  defaults: PrimaryMenuSettings,
  state: ContentState,
): Promise<PrimaryMenuSettings> {
  return ensureSubSettings(repo, defaults, state, "primaryMenu");
}

export async function ensureSocialSettings(
  repo: SiteRepository,
  defaults: SocialSettings,
  state: ContentState,
): Promise<SocialSettings> {
  return ensureSubSettings(repo, defaults, state, "social");
}

export async function ensureHeaderSettings(
  repo: SiteRepository,
  defaults: HeaderSettings,
  state: ContentState,
): Promise<HeaderSettings> {
  return ensureSubSettings(repo, defaults, state, "header");
}

export async function ensureFooterSettings(
  repo: SiteRepository,
  defaults: FooterSettings,
  state: ContentState,
): Promise<FooterSettings> {
  return ensureSubSettings(repo, defaults, state, "footer");
}

export async function ensureSeoSettings(
  repo: SiteRepository,
  defaults: SeoSettings,
  state: ContentState,
): Promise<SeoSettings> {
  return ensureSubSettings(repo, defaults, state, "seo");
}
