/**
 * @file packages/infra/src/id/index.ts
 * @layer infra/id
 * @description Factory access to infrastructure ID generators.
 */
import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";

export function getIdGenerator() {
  return createUuidV7IdGenerator();
}
