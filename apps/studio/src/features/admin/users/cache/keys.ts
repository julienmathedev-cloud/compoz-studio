/**
 * @file apps/studio/src/features/admin/users/cache/keys.ts
 * @layer studio/features/admin/users/cache
 *
 * @description
 * React Query key helpers for Studio admin users.
 *
 * @remarks
 * - Do not change key shapes because mutations rely on them for cache invalidation and seeding.
 */

/** Source of truth for invalidating the users list after create, update, or delete mutations. */
export function usersListKey() {
  return ["studio", "users", "list"] as const;
}

/**
 * Source of truth for seeding or patching a single user cache entry from mutations.
 *
 * @remarks
 * - `userId` is only trimmed, not lowercased, to avoid hiding potentially case-sensitive IDs.
 */
export function userByIdKey(userId: string) {
  const id = String(userId ?? "").trim();
  return ["studio", "users", "byId", id] as const;
}
