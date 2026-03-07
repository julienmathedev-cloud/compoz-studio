/**
 * @file apps/site/src/lib/unwrap-params.ts
 * @layer site/lib/next
 *
 * @description
 * Normalise `params` (Next.js App Router) pour accepter :
 * - un objet direct
 * - une Promise retournée par certains handlers/pages.
 *
 * @remarks
 * Next peut parfois typer `params` comme `Promise<Params>` selon
 * le contexte (route handlers, generateMetadata, etc.).
 * Ce helper garantit une valeur résolue.
 */
export async function unwrapParams<T>(params: T | Promise<T>): Promise<T> {
  return await params;
}
