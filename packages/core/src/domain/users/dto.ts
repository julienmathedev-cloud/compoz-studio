/**
 * @file packages/core/src/domain/users/dto.ts
 * @layer core/domain/users
 * @description DTO contracts exposed at user module boundaries.
 * @remarks
 * DTOs currently mirror domain entities through `Readonly`, but may diverge at API or infra boundaries later.
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

export type UserDTO = Readonly<User>;

export type UserSummaryDTO = Readonly<UserSummary>;

export type UserOptionDTO = Readonly<UserOption>;

export type UserRbacDTO = Readonly<UserRbac>;

export type UserMetaDTO = Readonly<UserMeta>;

export type UserRoleDTO = UserRole;

export type UserStatusDTO = UserStatus;
