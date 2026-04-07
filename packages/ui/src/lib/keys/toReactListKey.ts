/**
 * @file packages/ui/src/lib/keys/toReactListKey.ts
 * @layer ui/lib/keys
 * @description
 * Helper canonique pour générer des clés React stables et prévisibles à partir
 * d’objets UI (menus, liens, options, etc.).
 *
 * ⚠️ Usage strictement UI : ne jamais utiliser pour la persistance ou la logique métier.
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
 * Construit une clé React sûre pour une liste UI.
 *
 * Priorité :
 * 1. identifiant métier / technique stable (`id`, `keyId`)
 * 2. fallback lisible basé sur le contenu
 * 3. suffixe index pour garantir l’unicité
 *
 * @remarks
 * - Si `id` ou `keyId` existe, la clé reste stable même en cas de reorder.
 * - Si aucun identifiant n’existe, on utilise `index` en suffixe :
 *   cela garantit l’unicité, mais pas une stabilité parfaite au reorder.
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
