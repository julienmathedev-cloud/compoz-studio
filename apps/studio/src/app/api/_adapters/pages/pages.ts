/**
 * @file apps/studio/src/app/api/_adapters/pages/pages.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateurs API Studio pour les pages : convertit les payloads de création et de mise à jour
 * (DTOs) en données partielles ou complètes utilisables par le domaine.
 *
 * Responsabilités :
 * - trimming défensif (ids, strings)
 * - propagation des champs optionnels (sémantique PATCH = présence de clé)
 * - normalisation sitemap (intents `null` -> domaine `undefined`)
 * - normalisation slug via SoT UI (`toSlugIntentInput`)
 * - le `state` est géré par la route, pas par l’adapter
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";
import { toSlugIntentInput } from "@compoz/ui/lib/routing/slug";

import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import type { CreatePageInput } from "@compoz/core/domain/pages/use-cases/create-page.types";
import type { UpdatePageInput } from "@compoz/core/domain/pages/use-cases/update-page.types";

/**
 * Patch d’update côté domaine, sans `pageId` (fourni par la route via params).
 */
type UpdatePagePatchInput = Omit<UpdatePageInput, "pageId">;

/**
 * Normalise le patch sitemap venant des intents API.
 * - Les intents autorisent `null` pour « unset » (ex: priority/changefreq).
 * - Le domaine utilise `undefined` (champ optionnel).
 */
function normalizeSitemapPatch(
  sitemap: CreatePageIntentDTO["sitemap"] | UpdatePageIntentDTO["sitemap"],
): UpdatePagePatchInput["sitemap"] | CreatePageInput["sitemap"] | undefined {
  if (!sitemap) return undefined;

  // On ne touche pas à `include` (boolean).
  // `null` => `undefined` pour rester conforme aux types domaine.
  return {
    ...sitemap,
    changefreq: sitemap.changefreq === null ? undefined : sitemap.changefreq,
    priority: sitemap.priority === null ? undefined : sitemap.priority,
  };
}

/**
 * Transforme un DTO de création de page en input domaine.
 *
 * Contrat :
 * - `name` toujours trimé et obligatoire.
 * - `seoTitle` trimé si fourni.
 * - `slug` optionnel : normalisé s’il est fourni, sinon logique fallback côté domaine.
 * - `sitemap` : si la clé est présente, on propage après normalisation (déjà validé par Zod).
 */
export function adaptCreatePagePayload(
  dto: CreatePageIntentDTO,
): CreatePageInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.create.start", {
    hasSlug: typeof dto.slug === "string",
    hasSeoTitle: typeof dto.seoTitle === "string",
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: CreatePageInput = {
    name: trimOrKeep(dto.name),
    parentId: dto.parentId,
    paginationEnabled: dto.parentId === null ? false : dto.paginationEnabled,
  };

  if ("seoTitle" in dto && typeof dto.seoTitle === "string") {
    out.seoTitle = trimOrKeep(dto.seoTitle);
  }

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = toSlugIntentInput(dto.slug);

    // create : si vide, on laisse le domaine appliquer son fallback.
    if (s.length > 0) out.slug = s;
  }

  if ("sitemap" in dto) {
    const normalized = normalizeSitemapPatch(dto.sitemap);
    if (normalized !== undefined) out.sitemap = normalized;
  }

  log.debug("studio.adapter.pages.create.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}

/**
 * Transforme un DTO de mise à jour de page en patch partiel domaine (sans `pageId`).
 *
 * Contrat :
 * - Un champ n’est posé que si la clé est présente dans le DTO.
 * - `state` est géré par la route.
 * - `sitemap` propagé si la clé est présente (y compris `{ include: false }`).
 * - `slug` : on garde "" comme signal explicite de reset.
 */
export function adaptUpdatePagePayload(
  dto: UpdatePageIntentDTO,
): UpdatePagePatchInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.update.start", {
    hasName: "name" in dto,
    hasSeoTitle: "seoTitle" in dto,
    hasSlug: "slug" in dto,
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: UpdatePagePatchInput = {};

  if ("name" in dto) {
    if (typeof dto.name === "string") {
      out.name = trimOrKeep(dto.name);
    }
  }

  if ("seoTitle" in dto) {
    if (typeof dto.seoTitle === "string") {
      out.seoTitle = trimOrKeep(dto.seoTitle);
    }
  }

  if ("slug" in dto) {
    if (typeof dto.slug === "string") {
      const s = toSlugIntentInput(dto.slug);

      // ✅ important : en update, "" est un reset explicite
      // HOME_SLUG est aussi une valeur valide (home)
      out.slug = s;
    }
  }

  // ✅ important : clé présente => on propage (même si null)
  if ("parentId" in dto) {
    out.parentId = dto.parentId;
  }

  // ✅ propager si la clé est présente
  if ("paginationEnabled" in dto) {
    out.paginationEnabled = dto.paginationEnabled;
  }

  if ("sitemap" in dto) {
    const normalized = normalizeSitemapPatch(dto.sitemap);
    if (normalized !== undefined) out.sitemap = normalized;
  }

  log.debug("studio.adapter.pages.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
