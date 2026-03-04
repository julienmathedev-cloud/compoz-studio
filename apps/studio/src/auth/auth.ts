/**
 * @file apps/studio/src/auth/auth.ts
 * @layer app/auth
 * @description
 * Configuration Auth.js (NextAuth) pour le Studio.
 *
 * - Provider Credentials (email/password) contre KV via UsersRepository (KvUsersRepository).
 * - Session JWT (pas d’adapter DB).
 * - Injecte RBAC + tenantIds + defaultTenantId dans le token + session.
 *
 * @remarks
 * ✅ SoT unique "Studio users" :
 * - Auth et CRUD admin lisent/écrivent au même endroit.
 * - On supprime le double store `compoz:auth:*`.
 */

import type { NextAuthOptions, User } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

// ✅ On utilise le repo Studio users comme SoT unique.
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

        const repo = new KvUsersRepository();

        // ✅ SoT user = repo Studio users
        const user = await repo.readByEmail(email);
        if (!user) {
          throw new Error("EMAIL_NOT_FOUND");
        }

        // ✅ Password check via le même repo
        const ok = await repo.verifyPassword(user.id, password);
        if (!ok) {
          throw new Error("INVALID_PASSWORD");
        }

        // ✅ RBAC est stocké dans l'entité User (SoT unique)
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
        } as User;
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
      }
      // ✅ fallback : NextAuth met souvent token.sub = user.id
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
      } as User;

      return session;
    },
  },
};

// (optionnel) export du handler, utile si tu veux le réutiliser ailleurs
export default NextAuth(authOptions);
