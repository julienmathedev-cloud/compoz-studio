/**
 * @file apps/studio/src/features/admin/users/cache/keys.ts
 * @layer studio/features/admin/users/cache
 *
 * @description
 * Helpers pour construire les query keys React Query liées aux users (Studio).
 *
 * @remarks
 * - Ne pas changer la shape des keys : elles sont utilisées pour l’invalidation/seed de cache.
 * - Les segments incluent "admin" car ces queries appartiennent à l’espace admin du Studio.
 */

/**
 * Source de vérité : queryKey "users list".
 * Permet d’invalider la liste après create/update/delete.
 */
export function usersListKey() {
  return ["studio", "users", "list"] as const;
}

/**
 * Source de vérité : queryKey "user by id".
 * Permet de seed/patch le cache depuis les mutations.
 *
 * @remarks
 * - `userId` est normalisé en `trim()` uniquement (pas de lowercase) pour éviter
 *   de masquer des IDs case-sensitive éventuels.
 */
export function userByIdKey(userId: string) {
  const id = String(userId ?? "").trim();
  return ["studio", "users", "byId", id] as const;
}
