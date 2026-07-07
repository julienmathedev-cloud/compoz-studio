/**
 * @file packages/infra/src/id/uuidv7.ts
 * @layer infra/id
 *
 * @description Factory access to infrastructure ID generators.
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import { v7 as uuidv7 } from "uuid";

export function createUuidV7IdGenerator(): IdGenerator {
  const nextId = () => uuidv7();

  return { nextId };
}
