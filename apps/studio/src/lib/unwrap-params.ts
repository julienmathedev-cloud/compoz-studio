/**
 * @file apps/studio/src/lib/unwrap-params.ts
 * @layer studio/lib
 *
 * @description
 * Helper for normalizing Next.js App Router `params` values.
 *
 * @remarks
 * - Accepts either direct params or Promise-wrapped params, then resolves to the same shape.
 */
export async function unwrapParams<T>(params: T | Promise<T>): Promise<T> {
  return await params;
}
