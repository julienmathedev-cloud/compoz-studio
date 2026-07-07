/**
 * @file packages/core/src/domain/users/entities/user.ts
 * @layer core/domain/users/entities
 * @description Canonical Studio user domain types.
 * @remarks
 * Password storage and cryptography belong to infra, not the user domain entity.
 */

export type UserRole = "admin" | "editor";
export type UserStatus = "active" | "disabled";

export interface UserMeta {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
}

/** Demo sandbox metadata for temporary Studio users. */
export interface UserDemoMeta {
  readonly isDemo: boolean;
  readonly demoInstanceId: string;
  readonly expiresAt: string;
}

/**
 * User role and website access scope.
 * @remarks
 * `websiteIds` may contain `"*"` to represent global admin access.
 */
export interface UserRbac {
  readonly role: UserRole;
  readonly websiteIds: ReadonlyArray<string>;
  readonly defaultWebsiteId: string;
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly status: UserStatus;
  readonly rbac: UserRbac;
  readonly meta: UserMeta;
  readonly demo?: UserDemoMeta;
}

export type UserSummary = Pick<User, "id" | "email" | "name" | "status">;

export type UserOption = Readonly<{
  label: string;
  value: string; // user id
  email: string;
}>;
