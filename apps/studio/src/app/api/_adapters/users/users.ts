/**
 * @file apps/studio/src/app/api/_adapters/users/users.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapters for user create and update intents.
 *
 * @remarks
 * - Normalizes email casing and trims user strings before domain writes.
 * - Preserves PATCH semantics by only propagating fields whose keys are present.
 * - Leaves `state` handling to the route.
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { CreateUserInput } from "@compoz/core/domain/users/use-cases/create-user.types";
import type { UpdateUserInput } from "@compoz/core/domain/users/use-cases/update-user.types";
import type {
  CreateUserIntentDTO,
  UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

/**
 * Domain update patch without `userId`, which is provided by route params.
 */
type UpdateUserPatchInput = Omit<UpdateUserInput, "userId">;

function toTrimmedLower(raw: unknown): string {
  return trimOrKeep(String(raw ?? "")).toLowerCase();
}

function normalizeEmail(raw: unknown): string {
  return toTrimmedLower(raw);
}

function normalizeName(raw: unknown): string {
  return trimOrKeep(String(raw ?? ""));
}

function normalizePassword(raw: unknown): string {
  return trimOrKeep(String(raw ?? ""));
}

function normalizeWebsiteId(raw: unknown): string {
  return trimOrKeep(String(raw ?? ""));
}

function normalizeWebsiteIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeWebsiteId)
    .filter((websiteId): websiteId is string => websiteId.length > 0);
}

function normalizeDefaultWebsiteId(raw: unknown): string {
  return normalizeWebsiteId(raw);
}

function normalizeRbac(
  rbac: CreateUserIntentDTO["rbac"] | UpdateUserIntentDTO["rbac"],
) {
  if (!rbac) return rbac;

  return {
    ...rbac,
    role: toTrimmedLower(rbac.role) as typeof rbac.role,
    websiteIds: normalizeWebsiteIds(rbac.websiteIds),
    defaultWebsiteId: normalizeDefaultWebsiteId(rbac.defaultWebsiteId),
  };
}

/**
 * Converts a user creation DTO into domain input.
 *
 * Contract:
 * - email/name/password: trim, with email lowercased.
 * - RBAC: propagated after lightweight string normalization.
 */
export function adaptCreateUserPayload(
  dto: CreateUserIntentDTO,
): CreateUserInput {
  const started = Date.now();

  log.debug("studio.adapter.users.create.start", {
    hasEmail: "email" in dto,
    hasName: "name" in dto,
    hasPassword: "password" in dto,
    hasRbac: "rbac" in dto,
  });

  const out: CreateUserInput = {
    email: normalizeEmail(dto.email),
    name: normalizeName(dto.name),
    password: normalizePassword(dto.password),
    rbac: normalizeRbac(dto.rbac) as CreateUserInput["rbac"],
  };

  log.debug("studio.adapter.users.create.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}

/**
 * Converts a user update DTO into a domain patch without `userId`.
 *
 * Contract:
 * - A field is set only when its key is present in the DTO.
 * - password: when present, it is propagated trimmed; the use case triggers `setPassword`.
 * - RBAC: when present, it is validated by Zod, then lightly normalized.
 */
export function adaptUpdateUserPayload(
  dto: UpdateUserIntentDTO,
): UpdateUserPatchInput {
  const started = Date.now();

  log.debug("studio.adapter.users.update.start", {
    hasEmail: "email" in dto,
    hasName: "name" in dto,
    hasPassword: "password" in dto,
    hasRbac: "rbac" in dto,
  });

  const out: UpdateUserPatchInput = {};

  if ("email" in dto && typeof dto.email === "string") {
    out.email = normalizeEmail(dto.email);
  }

  if ("name" in dto && typeof dto.name === "string") {
    out.name = normalizeName(dto.name);
  }

  if ("password" in dto && typeof dto.password === "string") {
    out.password = normalizePassword(dto.password);
  }

  if ("rbac" in dto) {
    // Present key => explicit RBAC patch propagation.
    out.rbac = normalizeRbac(dto.rbac) as UpdateUserPatchInput["rbac"];
  }

  log.debug("studio.adapter.users.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
