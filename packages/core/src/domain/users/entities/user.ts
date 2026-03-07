/**
 * @file src/core/domain/users/entities/user.ts
 * @layer core/domain
 * @description
 * Entité métier représentant un utilisateur Studio : identité, statut, RBAC,
 * et rattachement multi-tenant.
 *
 * Invariant : ce fichier définit uniquement la forme canonique (types).
 */

export type UserRole = "admin" | "editor";
export type UserStatus = "active" | "disabled";

/** Métadonnées de l'utilisateur (timestamps ISO 8601). */
export interface UserMeta {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
}

/**
 * RBAC + multi-tenant associé à un utilisateur.
 *
 * Remarques :
 * - tenantIds peut contenir "*" pour signifier accès global (super-admin).
 * - defaultTenantId : tenant "principal" utilisé par défaut (login + fallback).
 */
export interface UserRbac {
  readonly role: UserRole;
  readonly tenantIds: ReadonlyArray<string>;
  readonly defaultTenantId: string;
}

/**
 * Entité principale représentant un utilisateur du Studio.
 *
 * Notes :
 * - Le mot de passe n'appartient pas au domaine (stockage/crypto = infra).
 * - L'email est canonisé en lower-case côté infra/validation.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly status: UserStatus;
  readonly rbac: UserRbac;
  readonly meta: UserMeta;
}

export type UserSummary = Pick<User, "id" | "email" | "name" | "status">;

export type UserOption = Readonly<{
  label: string;
  value: string; // userId
  email: string;
}>;
