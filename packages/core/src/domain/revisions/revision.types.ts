/**
 * @file packages/core/src/domain/revisions/revision.types.ts
 * @layer core/domain/revisions
 * @description Shared optimistic-concurrency contracts for revisioned resources.
 */

/** Details returned when a revision precondition no longer matches. */
export type RevisionConflictDetails = Readonly<{
  resourceId: string;
  expectedRevision: number;
  currentRevision: number;
  conflictingPaths: ReadonlyArray<string>;
}>;

/** Expected revision supplied by a client before a conditional write. */
export type RevisionPrecondition = Readonly<{
  expectedRevision: number;
}>;
