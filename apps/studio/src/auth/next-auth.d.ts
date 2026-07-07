/**
 * @file apps/studio/src/auth/next-auth.d.ts
 * @layer studio/auth
 *
 * @description
 * NextAuth/Auth.js module augmentation for Studio authentication data.
 *
 * @remarks
 * - Adds Website RBAC fields to User, Session, and JWT.
 * - Adds session fields related to demo sandboxes.
 * - This `.d.ts` file is included by TypeScript through tsconfig.
 */

import type { DefaultSession } from "next-auth";

/**
 * Studio auth role.
 *
 * TS-only: does not affect runtime.
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
