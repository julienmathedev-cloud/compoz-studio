/**
 * @file packages/core/src/domain/pages/validators/pages.ts
 * @layer core/domain/pages/validators
 * @description
 * Invariants métier des pages : validation title/slug, defaults sitemap et contrôle de priority.
 * Ce module reste purement domaine (pas de Zod/HTTP/UI).
 */

import {
  ERROR_CODES as EC,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import {
  DomainError,
  isDomainErrorLike,
} from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { assertSlug } from "@compoz/core/domain/slug/validator";

/**
 * Valide qu’un titre de page est non vide une fois trimé.
 *
 * @param title - Titre brut (éventuellement undefined).
 * @param path  - Chemin logique de l’erreur (pour `details.path`).
 * @throws DomainError(EC.PAGE_TITLE_REQUIRED) si le titre est vide après trim.
 * @returns Le titre normalisé (trimé).
 */
export function assertTitleRequired(
  title: string | undefined,
  path: (string | number)[] = ["title"],
): string {
  const t = (title ?? "").trim();
  if (!t) {
    throw new DomainError({
      code: EC.PAGE_TITLE_REQUIRED,
      message: EC.PAGE_TITLE_REQUIRED,
      details: { path },
    });
  }
  return t;
}

/**
 * Valide et normalise le slug d’une page.
 *
 * @param raw  - Slug brut (ou undefined).
 * @param path - Chemin logique pour `details.path` (par défaut `"slug"`).
 *
 * @returns Le slug **normalisé** (kebab-case) si tout est valide.
 *
 * @throws DomainError
 * - EC.PAGE_SLUG_REQUIRED        : slug vide après normalisation.
 * - EC.PAGE_SLUG_RESERVED        : slug appartenant aux réservés.
 * - EC.PAGE_SLUG_INVALID_FORMAT  : format invalide (hors kebab-case).
 *
 * @remarks
 * Cette fonction s’appuie sur `assertSlug` (slug générique) puis
 * remappe les erreurs `VALIDATION_ERROR` vers des codes spécialisés
 * pour le domaine Pages.
 */
export function assertPageSlug(
  raw: string | undefined,
  path: (string | number)[] = ["slug"],
): string {
  try {
    // Slug générique : normalisation + contrôles de base
    return assertSlug(raw, path);
  } catch (e) {
    // Si ce n'est pas une DomainError, on relaie tel quel
    if (!isDomainErrorLike(e)) {
      throw e;
    }

    // On remappe uniquement les codes liés au slug générique
    let mappedCode: ErrorCode | undefined;

    switch (e.code) {
      case EC.SLUG_REQUIRED:
        mappedCode = EC.PAGE_SLUG_REQUIRED;
        break;
      case EC.SLUG_RESERVED:
        mappedCode = EC.PAGE_SLUG_RESERVED;
        break;
      case EC.SLUG_INVALID_FORMAT:
        mappedCode = EC.PAGE_SLUG_INVALID_FORMAT;
        break;
      default:
        // Toute autre erreur (technique, autre validation) est relayée telle quelle
        throw e;
    }

    // On jette une nouvelle DomainError spécialisée Pages,
    // en conservant le `details` et en chaînant la cause.
    throw new DomainError({
      code: mappedCode,
      message: mappedCode,
      details: { path },
      cause: e,
    });
  }
}

/**
 * Valide `paginationEnabled` au regard de `parentId`.
 *
 * Règle métier :
 * - parentId === null => paginationEnabled doit être false
 * - parentId !== null => paginationEnabled peut être true/false
 */
export function assertPaginationEnabled(args: {
  parentId: string | null;
  paginationEnabled: unknown;
  path?: (string | number)[];
}): boolean {
  const { parentId, paginationEnabled, path = ["paginationEnabled"] } = args;

  if (typeof paginationEnabled !== "boolean") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  if (parentId === null && paginationEnabled === true) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path, meta: { reason: "root_page_cannot_paginate" } },
    });
  }

  return paginationEnabled;
}

/**
 * Valide que la priorité du sitemap, si fournie, est dans [0, 1].
 *
 * @param p    - Valeur de priorité éventuelle.
 * @param path - Chemin logique de l’erreur (par défaut `["sitemap","priority"]`).
 * @throws DomainError(EC.VALIDATION_ERROR) si la valeur est hors intervalle.
 */
export function assertPriority(
  p?: number,
  path: (string | number)[] = ["sitemap", "priority"],
): void {
  if (p === undefined) return;
  if (typeof p !== "number" || p < 0 || p > 1) {
    throw new DomainError({
      code: EC.VALIDATION_ERROR,
      message: EC.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE,
      details: { path, meta: { priority: p } },
    });
  }
}

/**
 * Valide `parentId` :
 * - `null` => page racine
 * - `string` non vide => id d’une page parente
 *
 * @param parentId - Valeur brute.
 * @param path - Chemin logique de l’erreur.
 * @throws DomainError(EC.INVALID_ARGUMENT) si la valeur est invalide.
 * @returns La valeur normalisée (`null` ou string trimée).
 */
export function assertParentId(
  parentId: unknown,
  path: (string | number)[] = ["parentId"],
): string | null {
  if (parentId === null) return null;

  if (typeof parentId !== "string") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  const v = parentId.trim();
  if (!v) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path },
    });
  }

  return v;
}

export function assertPage(p: Page): void {
  assertTitleRequired(p.title, ["page", "title"]);
  assertPageSlug(p.slug, ["page", "slug"]);

  // ✅ parentId obligatoire : null ou string non vide
  const normalizedParentId = assertParentId(p.parentId, ["page", "parentId"]);

  // ✅ invariant simple : pas d’auto-référence
  if (normalizedParentId !== null && normalizedParentId === p.id) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: ["page", "parentId"], meta: { reason: "self_parent" } },
    });
  }

  assertPriority(p.sitemap?.priority, ["page", "sitemap", "priority"]);
  assertPaginationEnabled({
    parentId: normalizedParentId,
    paginationEnabled: p.paginationEnabled,
    path: ["page", "paginationEnabled"],
  });
}
