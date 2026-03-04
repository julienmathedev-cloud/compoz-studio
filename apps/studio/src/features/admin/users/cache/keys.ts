/**
 * @file apps/studio/src/features/admin/users/cache/keys.ts
 * @layer hooks/admin/users
 *
 * @description
 * Helpers pour construire des query keys React Query liées aux users (Studio).
 */

/**
 * ✅ Source de vérité : queryKey "users list"
 * Permet d’invalider la liste après create/update/delete.
 */
export function usersListKey() {
  return ["admin", "users", "list"] as const;
}

/**
 * ✅ Source de vérité : queryKey "user by id"
 * Permet de seed/patch le cache depuis les mutations.
 */
export function userByIdKey(userId: string) {
  const id = String(userId ?? "").trim();
  return ["admin", "users", "byId", id] as const;
}
