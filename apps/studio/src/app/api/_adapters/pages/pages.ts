/**
 * @file apps/studio/src/app/api/_adapters/pages/pages.ts
 * @layer api/adapters
 * @description
 * Adaptateurs API Admin pour les pages : convertit les payloads de création et de mise à jour
 * (DTOs) en données partielles ou complètes utilisables par le domaine.
 *
 * Responsabilités : trim des chaînes, propagation des champs optionnels, passage de sitemap inchangé.
 * Le `state` est géré par la route, pas par l’adapter.
 */

import { log } from "@compoz/infra/lib/log";

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
 * - `title` toujours trimé et obligatoire.
 * - `slug` optionnel : trimé s’il est fourni, sinon logique fallback côté domaine.
 * - `sitemap` : si la clé est présente, on recopie tel quel (déjà validé par Zod).
 */
export function adaptCreatePagePayload(
  dto: CreatePageIntentDTO,
): CreatePageInput {
  const started = Date.now();

  log.debug("admin.adapter.pages.create.start", {
    hasSlug: typeof dto.slug === "string",
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: CreatePageInput = {
    title: dto.title.trim(),
    parentId: dto.parentId,
    paginationEnabled: dto.parentId === null ? false : dto.paginationEnabled,
  };

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = dto.slug.trim();
    if (s === "/") out.slug = "home";
    else if (s.length > 0) out.slug = s;
  }

  if ("sitemap" in dto) {
    const normalized = normalizeSitemapPatch(dto.sitemap);
    if (normalized !== undefined) out.sitemap = normalized;
  }

  log.debug("admin.adapter.pages.create.end", {
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
 * - `sitemap` recopié tel quel si la clé est présente (y compris `{ include: false }`).
 */
export function adaptUpdatePagePayload(
  dto: UpdatePageIntentDTO,
): UpdatePagePatchInput {
  const started = Date.now();

  log.debug("admin.adapter.pages.update.start", {
    hasTitle: "title" in dto,
    hasSlug: "slug" in dto,
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: UpdatePagePatchInput = {};

  if ("title" in dto) {
    if (typeof dto.title === "string") {
      out.title = dto.title.trim();
    }
  }

  if ("slug" in dto) {
    if (typeof dto.slug === "string") {
      const s = dto.slug.trim();
      // ✅ on garde "" comme signal explicite de reset
      out.slug = s === "/" ? "home" : s;
    }
  }

  // ✅ important : clé présente => on propage (même si null)
  if ("parentId" in dto) {
    out.parentId = dto.parentId;
  }

  // ✅ nouveau : propager si la clé est présente
  if ("paginationEnabled" in dto) {
    out.paginationEnabled = dto.paginationEnabled;
  }

  if ("sitemap" in dto) {
    const normalized = normalizeSitemapPatch(dto.sitemap);
    if (normalized !== undefined) out.sitemap = normalized;
  }

  log.debug("admin.adapter.pages.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
