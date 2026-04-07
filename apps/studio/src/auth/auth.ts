/**
 * @file apps/studio/src/auth/auth.ts
 * @layer studio/auth
 *
 * @description
 * Configuration Auth.js (NextAuth) pour le Studio.
 *
 * Responsabilités :
 * - Provider Credentials (email/password) via `KvUsersRepository` (Studio users SoT).
 * - Session JWT (pas d’adapter DB).
 * - Injection RBAC + tenantIds + defaultTenantId dans le token + la session.
 * - Propagation éventuelle des métadonnées de sandbox démo dans le token + la session.
 *
 * @remarks
 * ✅ SoT unique "Studio users" :
 * - Auth et CRUD admin lisent/écrivent au même endroit.
 * - Suppression du double store `compoz:auth:*`.
 */

import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  secret: process.env["AUTH_SECRET"],
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // ✅ SoT unique : repo Studio users.
        const repo = new KvUsersRepository();

        const user = await repo.readByEmail(email);
        if (!user) {
          throw new Error("EMAIL_NOT_FOUND");
        }

        const ok = await repo.verifyPassword(user.id, password);
        if (!ok) {
          throw new Error("INVALID_PASSWORD");
        }

        // ✅ RBAC est stocké dans l'entité User (SoT unique).
        const rbac = user.rbac;
        if (
          !rbac ||
          (rbac.role !== "admin" && rbac.role !== "editor") ||
          !Array.isArray(rbac.tenantIds) ||
          !rbac.defaultTenantId
        ) {
          throw new Error("USER_RBAC_MISSING");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: rbac.role,
          tenantIds: rbac.tenantIds,
          defaultTenantId: rbac.defaultTenantId,
          isDemo: user.demo?.isDemo,
          demoInstanceId: user.demo?.demoInstanceId,
          demoExpiresAt: user.demo?.expiresAt,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.tenantIds = user.tenantIds;
        token.defaultTenantId = user.defaultTenantId;
        token.isDemo = user.isDemo;
        token.demoInstanceId = user.demoInstanceId;
        token.demoExpiresAt = user.demoExpiresAt;
      }

      // ✅ fallback : NextAuth renseigne souvent `token.sub = user.id`.
      if (!token.userId && token.sub) {
        token.userId = token.sub;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...(session.user ?? {}),
        id: String(token.userId ?? ""),
        role: token.role,
        tenantIds: token.tenantIds,
        defaultTenantId: token.defaultTenantId,
        isDemo: token.isDemo,
        demoInstanceId: token.demoInstanceId,
        demoExpiresAt: token.demoExpiresAt,
      };

      return session;
    },
  },
};

export default NextAuth(authOptions);
