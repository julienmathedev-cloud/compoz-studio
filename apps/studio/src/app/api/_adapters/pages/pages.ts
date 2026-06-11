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
 * - normalisation sitemap alignée sur le domaine (`null` conservé)
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
 * Normalise le bloc sitemap venant des intents API.
 *
 * Contrat domaine actuel :
 * - `sitemap` peut être `null`
 * - `changefreq` peut être `null`
 * - `priority` peut être `null`
 * - en patch, l’absence de clé doit rester `undefined`
 */
function normalizeSitemap(
  sitemap:
    | CreatePageIntentDTO["sitemap"]
    | UpdatePageIntentDTO["sitemap"]
    | undefined,
): UpdatePagePatchInput["sitemap"] | CreatePageInput["sitemap"] | undefined {
  if (typeof sitemap === "undefined") return undefined;
  if (sitemap === null) return null;

  return {
    include: sitemap.include,
    changefreq: sitemap.changefreq,
    priority: sitemap.priority,
  };
}

/**
 * Transforme un DTO de création de page en input domaine.
 *
 * Contrat :
 * - `name` toujours trimé et obligatoire.
 * - `seoTitle` trimé si fourni, sinon `null`.
 * - `seoDescription` trimée si fournie et non vide, sinon `null`.
 * - `slug` optionnel : normalisé s’il est fourni, sinon logique fallback côté domaine.
 * - `sitemap` toujours propagé (`null` ou objet normalisé).
 */
export function adaptCreatePagePayload(
  dto: CreatePageIntentDTO,
): CreatePageInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.create.start", {
    hasSlug: typeof dto.slug === "string",
    hasSeoTitle: dto.seoTitle !== null,
    hasSeoDescription: dto.seoDescription !== null,
    hasSitemap: true,
    hasParentId: true,
  });

  const out: CreatePageInput = {
    name: trimOrKeep(dto.name),
    seoTitle: dto.seoTitle !== null ? trimOrKeep(dto.seoTitle) : null,
    seoDescription:
      dto.seoDescription !== null
        ? trimOrKeep(dto.seoDescription) || null
        : null,
    parentId: dto.parentId,
    sitemap: normalizeSitemap(dto.sitemap) ?? null,
    paginationEnabled: dto.parentId === null ? false : dto.paginationEnabled,
  };

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = toSlugIntentInput(dto.slug);

    // create : si vide, on laisse le domaine appliquer son fallback.
    if (s.length > 0) out.slug = s;
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
 * - `sitemap` propagé si la clé est présente (y compris `null`).
 * - `slug` : on garde "" comme signal explicite de reset.
 */
export function adaptUpdatePagePayload(
  dto: UpdatePageIntentDTO,
): UpdatePagePatchInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.update.start", {
    hasName: "name" in dto,
    hasSeoTitle: "seoTitle" in dto,
    hasSeoDescription: "seoDescription" in dto,
    hasSlug: "slug" in dto,
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: UpdatePagePatchInput = {};

  if ("name" in dto && typeof dto.name === "string") {
    out.name = trimOrKeep(dto.name);
  }

  if ("seoTitle" in dto) {
    out.seoTitle =
      dto.seoTitle !== null && typeof dto.seoTitle === "string"
        ? trimOrKeep(dto.seoTitle)
        : null;
  }

  if ("seoDescription" in dto) {
    out.seoDescription =
      dto.seoDescription !== null && typeof dto.seoDescription === "string"
        ? trimOrKeep(dto.seoDescription) || null
        : null;
  }

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = toSlugIntentInput(dto.slug);

    // en update, "" est un reset explicite
    out.slug = s;
  }

  if ("parentId" in dto) {
    out.parentId = dto.parentId;
  }

  if ("paginationEnabled" in dto) {
    out.paginationEnabled = dto.paginationEnabled;
  }

  if ("sitemap" in dto) {
    out.sitemap = normalizeSitemap(dto.sitemap);
  }

  log.debug("studio.adapter.pages.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
