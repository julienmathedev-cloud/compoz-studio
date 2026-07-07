/**
 * @file packages/core/src/domain/ports/id-generator.ts
 * @layer core/domain
 * @description Domain port for generating stable persisted ids.
 * @remarks
 * IDs are opaque and immutable once created. The implementation is provided by infrastructure.
 */
export interface IdGenerator {
  nextId(): string;
}
