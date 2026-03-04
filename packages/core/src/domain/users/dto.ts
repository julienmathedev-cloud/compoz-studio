/**
 * @file src/core/domain/users/dto.ts
 * @layer core/domain
 * @description
 * DTOs de lecture pour le module Users, alignés sur les entités du domaine.
 * Ces types représentent la forme stable exposée aux adapters (API/infra)
 * et restent immuables (`Readonly<>`).
 */

import type {
  User,
  UserMeta,
  UserOption,
  UserRbac,
  UserRole,
  UserStatus,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";

/**
 * DTO complet représentant un User.
 * Aligné strictement sur l’entité métier `User`.
 */
export type UserDTO = Readonly<User>;

/**
 * DTO résumé pour les listes/admin.
 * Correspond au type métier `UserSummary`.
 */
export type UserSummaryDTO = Readonly<UserSummary>;

/** DTO de type `UserOption`. */
export type UserOptionDTO = Readonly<UserOption>;

/** DTO du sous-objet `rbac`. */
export type UserRbacDTO = Readonly<UserRbac>;

/** DTO du sous-objet `meta`. */
export type UserMetaDTO = Readonly<UserMeta>;

/** DTO enum (type union) pour role. */
export type UserRoleDTO = UserRole;

/** DTO enum (type union) pour status. */
export type UserStatusDTO = UserStatus;
