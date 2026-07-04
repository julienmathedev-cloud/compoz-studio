/**
 * @file apps/studio/src/features/pages/cache/keys.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux pages.
 *
 * @remarks
 * - Website-scoped : préfixe `["w", websiteId, ...]`
 *   pour éviter les collisions de cache lors d’un switch Website.
 * - Le scope utilisé ici est Prisma Website.id.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

/**
 * Source de vérité : query key "page by id".
 *
 * @remarks
 * Permet de seed / patch le cache depuis les mutations create / update / delete.
 */
export function pageByIdKey(
  websiteId: string,
  pageId: string,
  state: ContentState,
) {
  const websiteIdKey = String(websiteId ?? "").trim();
  const pageIdKey = String(pageId ?? "").trim();

  return [
    "w",
    websiteIdKey,
    "studio",
    "pages",
    "byId",
    pageIdKey,
    state,
  ] as const;
}
