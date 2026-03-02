/**
 * @file src/infrastructure/id/index.ts
 * @layer infrastructure
 *
 * @description
 * Factory d’accès aux services infra liés aux IDs.
 */
import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";

export function getIdGenerator() {
  return createUuidV7IdGenerator();
}
