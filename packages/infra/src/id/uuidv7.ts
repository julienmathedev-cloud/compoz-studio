/**
 * @file packages/infra/src/id/uuidv7.ts
 * @layer infra/id
 *
 * @description
 * Implémentation infra du port `IdGenerator` utilisant UUID v7.
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import { v7 as uuidv7 } from "uuid";

/**
 * Crée un générateur d'ID basé sur UUID v7.
 */
export function createUuidV7IdGenerator(): IdGenerator {
  const nextId = () => uuidv7();

  return { nextId };
}
