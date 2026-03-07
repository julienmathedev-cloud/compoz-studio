/**
 * @file apps/studio/src/lib/config/uploads.ts
 * @layer studio/lib/config
 *
 * @description
 * Configuration publique liée aux uploads de médias côté client.
 *
 * Source de vérité UI :
 * - Taille max des fichiers uploadés (doit matcher la config serveur).
 *
 * @remarks
 * - V0.5 : volontairement simple, sans logique métier (elle reste côté API).
 * - Pensé pour être consommé par les composants UI / hooks client.
 */

/**
 * Taille maximale autorisée pour les uploads d’images côté UI (en octets).
 *
 * - Lue depuis `NEXT_PUBLIC_MAX_IMAGE_UPLOAD_BYTES`
 * - `undefined` si absente ou invalide (désactive la validation UI)
 *
 * ⚠️ Doit matcher `MAX_IMAGE_UPLOAD_BYTES` côté serveur.
 */
export const MAX_IMAGE_UPLOAD_BYTES: number | undefined = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_UPLOAD_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
})();
