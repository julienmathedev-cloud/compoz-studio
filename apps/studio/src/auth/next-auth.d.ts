/**
 * @file apps/studio/src/auth/next-auth.d.ts
 * @layer studio/auth
 *
 * @description
 * Module augmentation NextAuth/Auth.js.
 *
 * @remarks
 * - Ajoute les champs RBAC websites au User, Session et JWT.
 * - Ajoute aussi les champs de session liés aux sandboxes démo.
 * - Fichier .d.ts inclus par TypeScript via tsconfig.
 */

import type { DefaultSession } from "next-auth";

/**
 * Rôle auth Studio.
 *
 * TS-only : n’impacte pas le runtime.
 */
type AuthRole = "admin" | "editor";

declare module "next-auth" {
  interface User {
    id: string;
    role: AuthRole;
    websiteIds: string[];
    defaultWebsiteId: string;
    isDemo?: boolean;
    demoInstanceId?: string;
    demoExpiresAt?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AuthRole;
      websiteIds: string[];
      defaultWebsiteId: string;
      isDemo?: boolean;
      demoInstanceId?: string;
      demoExpiresAt?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role: AuthRole;
    websiteIds: string[];
    defaultWebsiteId: string;
    isDemo?: boolean;
    demoInstanceId?: string;
    demoExpiresAt?: string;
  }
}
