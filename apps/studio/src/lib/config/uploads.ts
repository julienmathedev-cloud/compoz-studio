/**
 * @file apps/studio/src/lib/config/uploads.ts
 * @layer studio/lib/config
 *
 * @description
 * Public client-side media upload configuration.
 *
 * @remarks
 * - Exposes UI validation limits derived from public environment variables.
 * - The client-side limit must stay aligned with the server upload limit.
 */

/**
 * Maximum image upload size accepted by the Studio UI, in bytes.
 *
 * @remarks
 * - `undefined` disables UI-side size validation when the public env value is missing or invalid.
 */
export const MAX_IMAGE_UPLOAD_BYTES: number | undefined = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_UPLOAD_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
})();
