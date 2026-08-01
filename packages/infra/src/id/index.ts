/**
 * @file packages/infra/src/id/index.ts
 * @layer infra/id
 * @description Factory access to infrastructure ID generators.
 */
import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

/** Public factory for the production Core ID generator. */
export function getIdGenerator(): IdGenerator {
  return createUuidV7IdGenerator();
}
