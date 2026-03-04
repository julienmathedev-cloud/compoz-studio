/**
 * @file apps/studio/src/auth/next-auth.d.ts
 * @layer app/auth
 * @description
 * Module augmentation NextAuth/Auth.js :
 * - Ajoute les champs RBAC/tenants au User, Session et JWT.
 *
 * Important :
 * - Fichier .d.ts inclus par TypeScript (via tsconfig "include").
 */

import type { AuthRole } from "@compoz/infra/auth/kv-auth-users-repository";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: AuthRole;
    tenantIds: string[];
    defaultTenantId: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AuthRole;
      tenantIds: string[];
      defaultTenantId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role: AuthRole;
    tenantIds: string[];
    defaultTenantId: string;
  }
}
