/**
 * @file apps/studio/src/auth/next-auth.d.ts
 * @layer studio/auth
 *
 * @description
 * Module augmentation NextAuth/Auth.js :
 * - Ajoute les champs RBAC/tenants au User, Session et JWT.
 *
 * @remarks
 * - Fichier .d.ts inclus par TypeScript (via tsconfig "include").
 */

import type { DefaultSession } from "next-auth";

/**
 * Rôle auth Studio (aligné sur la validation actuelle du Credentials provider).
 * TS-only : n’impacte pas le runtime.
 */
type AuthRole = "admin" | "editor";

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
