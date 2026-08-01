/**
 * @file packages/core/src/domain/users/ports/admin-user-provisioning-transaction.ts
 * @layer core/domain/users/ports
 * @description Atomic persistence boundary for administration-driven user access provisioning.
 *
 * @remarks
 * This is deliberately separate from `UsersRepository`: demo users and other
 * internal flows must not implicitly provision standard Websites.
 */

import type {
  User,
  UserRole,
  UserStatus,
} from "@compoz/core/domain/users/entities/user";

export type AdminUserScalarChanges = Readonly<{
  email?: string;
  name?: string;
  status?: UserStatus;
}>;

export type AdminUserRbacChange = Readonly<{
  role: UserRole;
  websiteIds: ReadonlyArray<string>;
  defaultWebsiteId: string;
}>;

export type UpdateAdminUserProvisioningInput = Readonly<{
  userId: string;
  scalarChanges?: AdminUserScalarChanges;
  rbacChange?: AdminUserRbacChange;
  password?: string;
  updatedAt: string;
}>;

export interface AdminUserProvisioningTransaction {
  createUserWithWebsiteProvisioning(input: {
    user: User;
    password: string;
  }): Promise<User>;

  updateUserWithWebsiteProvisioning(
    input: UpdateAdminUserProvisioningInput,
  ): Promise<User>;
}
