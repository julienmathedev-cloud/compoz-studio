/**
 * @file packages/infra/src/id/uuidv7.ts
 * @layer infra/id
 *
 * @description UUIDv7 implementation of the Core IdGenerator port.
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import { v7 as uuidv7 } from "uuid";

export function createUuidV7IdGenerator(): IdGenerator {
  const nextId = () => uuidv7();

  return { nextId };
}
