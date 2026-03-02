/**
 * @file packages/core/src/domain/site/use-cases/bootstrap/ensure-site-settings.ts
 * @desc Use-cases “ensure” pour les différents sous-ensembles de SiteSettings.
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

/* -------------------------------------------------------------------------- */
/* Generic helper                                                             */
/* -------------------------------------------------------------------------- */

async function ensureSubSettings<
  T extends keyof Awaited<ReturnType<SiteRepository["readSettings"]>>,
>(
  repo: SiteRepository,
  state: ContentState,
  key: T,
  seed: Awaited<ReturnType<SiteRepository["readSettings"]>>[T],
): Promise<Awaited<ReturnType<SiteRepository["readSettings"]>>[T]> {
  await repo.ensureBase();

  const current = await repo.readSettings(state);

  if (current[key]) {
    return current[key];
  }

  const next = {
    ...current,
    [key]: seed,
  };

  await repo.writeSettings(state, next);

  return seed;
}

/* -------------------------------------------------------------------------- */
/* Ensure wrappers                                                            */
/* -------------------------------------------------------------------------- */

export async function ensureIdentitySettings(
  repo: SiteRepository,
  seed: IdentitySettings,
  state: ContentState,
): Promise<IdentitySettings> {
  return ensureSubSettings(repo, state, "identity", seed);
}

export async function ensureLegalMenuSettings(
  repo: SiteRepository,
  seed: LegalMenuSettings,
  state: ContentState,
): Promise<LegalMenuSettings> {
  return ensureSubSettings(repo, state, "legalMenu", seed);
}

export async function ensurePrimaryMenuSettings(
  repo: SiteRepository,
  seed: PrimaryMenuSettings,
  state: ContentState,
): Promise<PrimaryMenuSettings> {
  return ensureSubSettings(repo, state, "primaryMenu", seed);
}

export async function ensureSocialSettings(
  repo: SiteRepository,
  seed: SocialSettings,
  state: ContentState,
): Promise<SocialSettings> {
  return ensureSubSettings(repo, state, "social", seed);
}

export async function ensureHeaderSettings(
  repo: SiteRepository,
  seed: HeaderSettings,
  state: ContentState,
): Promise<HeaderSettings> {
  return ensureSubSettings(repo, state, "header", seed);
}

export async function ensureFooterSettings(
  repo: SiteRepository,
  seed: FooterSettings,
  state: ContentState,
): Promise<FooterSettings> {
  return ensureSubSettings(repo, state, "footer", seed);
}

export async function ensureSeoSettings(
  repo: SiteRepository,
  seed: SeoSettings,
  state: ContentState,
): Promise<SeoSettings> {
  return ensureSubSettings(repo, state, "seo", seed);
}
