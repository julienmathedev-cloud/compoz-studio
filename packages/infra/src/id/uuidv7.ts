/**
 * @file packages/infra/src/id/uuidv7.ts
 * @layer infrastructure
 *
 * @description
 * Implémentation infra de génération d’ID via UUID v7.
 */
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import { v7 as uuidv7 } from "uuid";

export function createUuidV7IdGenerator(): IdGenerator {
  return {
    nextId: () => uuidv7(),
  };
}
