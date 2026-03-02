/**
 * @file packages/ui/src/lib/keys/toStableUiKey.ts
 * @layer ui/lib/keys
 * @description
 * Helper canonique pour générer des clés React stables et prévisibles à partir
 * d’objets UI (menus, liens, options, etc.).
 *
 * ⚠️ Usage strictement UI : ne jamais utiliser pour la persistance ou la logique métier.
 */

type KeyCandidate = {
  id?: unknown;
  keyId?: unknown;
  href?: unknown;
  label?: unknown;
};

export function toStableUiKey(
  item: KeyCandidate,
  index: number,
  order: Array<keyof KeyCandidate> = ["id", "keyId", "href", "label"],
): string {
  for (const key of order) {
    const value = item[key];

    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number") return String(value);
  }

  return String(index);
}
