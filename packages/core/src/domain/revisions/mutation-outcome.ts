/**
 * @file packages/core/src/domain/revisions/mutation-outcome.ts
 * @layer core/domain/revisions
 * @description Shared outcome for revisioned mutations that may converge without a write.
 */

export type MutationOutcome = "updated" | "noChanges";
