/**
 * @file apps/studio/src/lib/unwrap-params.ts
 * @layer studio/lib
 *
 * @description
 * Normalise `params` (Next.js App Router) : accepte une valeur ou une Promise.
 * Utile quand certains handlers/pages reçoivent `params` typés en Promise.
 */
export async function unwrapParams<T>(params: T | Promise<T>): Promise<T> {
  return Promise.resolve(params);
}
