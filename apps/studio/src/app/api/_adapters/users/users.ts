/**
 * @file apps/studio/src/app/api/_adapters/users/users.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateurs API Studio pour les users : convertit les payloads de création et de mise à jour
 * (DTOs intents) en données utilisables par le domaine.
 *
 * @remarks
 * Responsabilités :
 * - trimming défensif (ids, strings)
 * - normalisation légère (email lower-case, websiteIds trim)
 * - propagation stricte des champs optionnels (clé présente => propagée)
 * - RBAC passé tel quel après validation Zod, avec normalisation légère des strings
 *
 * Le `state` est géré par la route, pas par l’adapter.
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
 * Patch d’update côté domaine, sans `userId` (fourni par la route via params).
 */
type UpdateUserPatchInput = Omit<UpdateUserInput, "userId">;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Transforme un DTO de création de user en input domaine.
 *
 * Contrat :
 * - email/name/password : trim (email lower-case)
 * - RBAC : propagé après normalisation légère des strings
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

/* -------------------------------------------------------------------------- */
/* Update                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Transforme un DTO de mise à jour user en patch domaine (sans `userId`).
 *
 * Contrat :
 * - Un champ n’est posé que si la clé est présente dans le DTO.
 * - password : si présent, propagé (trim), le use-case déclenche `setPassword`.
 * - RBAC : si présent, validé par Zod, puis normalisé légèrement.
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
    // Clé présente => propagation explicite du patch RBAC.
    out.rbac = normalizeRbac(dto.rbac) as UpdateUserPatchInput["rbac"];
  }

  log.debug("studio.adapter.users.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
