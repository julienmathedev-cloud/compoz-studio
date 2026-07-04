/**
 * @file apps/studio/src/features/pages/blocks/cache/keys.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux blocks.
 *
 * @remarks
 * - Website-scoped : on préfixe par ["w", websiteId, ...]
 *   pour éviter les collisions de cache lors d'un switch Website.
 * - Le scope utilisé ici est Prisma Website.id.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export function pageBlocksKey(
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
    "blocks",
    "byId",
    pageIdKey,
    state,
  ] as const;
}
