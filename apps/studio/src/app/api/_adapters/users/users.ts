/**
 * @file apps/studio/src/app/api/_adapters/users/users.ts
 * @layer api/adapters
 * @description
 * Adaptateurs API Admin pour les users : convertit les payloads de création et de mise à jour
 * (DTOs intents) en données utilisables par le domaine.
 *
 * Responsabilités :
 * - trim / normalisation (email lower-case)
 * - propagation stricte des champs optionnels (clé présente => propagée)
 * - rbac passé tel quel (déjà validé par Zod), avec normalisation légère des strings
 *
 * Le `state` est géré par la route, pas par l’adapter.
 */

import { log } from "@compoz/infra/lib/log";

import type {
  CreateUserIntentDTO,
  UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

import type { CreateUserInput } from "@compoz/core/domain/users/use-cases/create-user.types";
import type { UpdateUserInput } from "@compoz/core/domain/users/use-cases/update-user.types";

/**
 * Patch d’update côté domaine, sans `userId` (fourni par la route via params).
 */
type UpdateUserPatchInput = Omit<UpdateUserInput, "userId">;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeEmail(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

function normalizeName(raw: unknown): string {
  return String(raw ?? "").trim();
}

function normalizeTenantIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) =>
      String(t ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

function normalizeRbac(
  rbac: CreateUserIntentDTO["rbac"] | UpdateUserIntentDTO["rbac"],
) {
  if (!rbac) return rbac;

  return {
    ...rbac,
    role: String(rbac.role ?? "")
      .trim()
      .toLowerCase() as typeof rbac.role,
    tenantIds: normalizeTenantIds(rbac.tenantIds),
    defaultTenantId: String(rbac.defaultTenantId ?? "")
      .trim()
      .toLowerCase(),
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
 * - rbac : propagé (normalisation légère des strings)
 */
export function adaptCreateUserPayload(
  dto: CreateUserIntentDTO,
): CreateUserInput {
  const started = Date.now();

  log.debug("admin.adapter.users.create.start", {
    hasEmail: "email" in dto,
    hasName: "name" in dto,
    hasPassword: "password" in dto,
    hasRbac: "rbac" in dto,
  });

  const out: CreateUserInput = {
    email: normalizeEmail(dto.email),
    name: normalizeName(dto.name),
    password: String(dto.password ?? "").trim(),
    rbac: normalizeRbac(dto.rbac) as CreateUserInput["rbac"],
  };

  log.debug("admin.adapter.users.create.end", {
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
 * - rbac : si présent, validé par Zod, puis normalisé légèrement.
 */
export function adaptUpdateUserPayload(
  dto: UpdateUserIntentDTO,
): UpdateUserPatchInput {
  const started = Date.now();

  log.debug("admin.adapter.users.update.start", {
    hasEmail: "email" in dto,
    hasName: "name" in dto,
    hasPassword: "password" in dto,
    hasRbac: "rbac" in dto,
  });

  const out: UpdateUserPatchInput = {};

  if ("email" in dto) {
    if (typeof dto.email === "string") {
      out.email = normalizeEmail(dto.email);
    }
  }

  if ("name" in dto) {
    if (typeof dto.name === "string") {
      out.name = normalizeName(dto.name);
    }
  }

  if ("password" in dto) {
    if (typeof dto.password === "string") {
      out.password = dto.password.trim();
    }
  }

  if ("rbac" in dto) {
    // ✅ important : clé présente => on propage (même si l’objet est “vide” côté UI,
    // mais Zod devrait empêcher un shape invalide)
    out.rbac = normalizeRbac(dto.rbac) as UpdateUserPatchInput["rbac"];
  }

  log.debug("admin.adapter.users.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
