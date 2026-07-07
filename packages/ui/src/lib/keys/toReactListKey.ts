/**
 * @file packages/ui/src/lib/keys/toReactListKey.ts
 * @layer ui/lib/keys
 * @description Builds stable and predictable React list keys from UI objects.
 * @remarks
 * UI-only helper: keys produced here must not be used for persistence or business logic.
 */

type KeyCandidate = {
  id?: string | number | null;
  keyId?: string | number | null;
  href?: string | null;
  label?: string | null;
};

function normalizeKeyPart(value: string | number | null | undefined): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "";
}

/**
 * Prefers stable ids, then readable content, then an index-only fallback.
 *
 * @remarks
 * Index suffixes guarantee uniqueness, but fallback keys are not perfectly stable when items are reordered.
 */
export function toReactListKey(item: KeyCandidate, index: number): string {
  const id = normalizeKeyPart(item.id);
  if (id) return `id:${id}`;

  const keyId = normalizeKeyPart(item.keyId);
  if (keyId) return `keyId:${keyId}`;

  const href = normalizeKeyPart(item.href);
  const label = normalizeKeyPart(item.label);

  const base = [href, label].filter(Boolean).join("|");

  if (base) {
    return `fallback:${base}:${index}`;
  }

  return `index:${index}`;
}
