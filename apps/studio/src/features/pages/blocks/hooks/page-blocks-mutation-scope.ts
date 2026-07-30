/**
 * @file apps/studio/src/features/pages/blocks/hooks/page-blocks-mutation-scope.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Stable per-Website/per-Page serialization scope for all block mutations.
 */

export function pageBlocksMutationScope(
  websiteId: string,
  pageId: string,
): string {
  return `page-blocks:${String(websiteId ?? "").trim()}:${String(pageId ?? "").trim()}`;
}
