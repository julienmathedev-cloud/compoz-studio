/**
 * @file apps/studio/src/features/conflicts/occ-notifications.ts
 * @layer studio/features/conflicts
 * @description Pure OCC revision decisions.
 */

/**
 * A final revision one step after the expected revision is a normal mutation.
 * A larger jump means a concurrent revision was incorporated automatically.
 */
export function isAutomaticRevisionMerge(
  expectedRevision: number,
  finalRevision: number,
): boolean {
  return finalRevision > expectedRevision + 1;
}
