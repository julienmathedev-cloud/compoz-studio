/**
 * @file apps/studio/src/auth/auth.ts
 * @layer studio/auth
 *
 * @description
 * Configuration Auth.js (NextAuth) pour le Studio.
 *
 * @remarks
 * Responsabilités :
 * - Provider Credentials email/password via `UsersRepository`.
 * - Session JWT, sans adapter DB NextAuth.
 * - Injection RBAC + websiteIds + defaultWebsiteId dans le token et la session.
 * - Propagation éventuelle des métadonnées de sandbox démo dans le token
 *   et la session.
 *
 * Source of truth :
 * - Auth et CRUD admin lisent/écrivent dans le même repository Studio users.
 * - Aucun store auth séparé.
 */

import { STUDIO_SESSION_MAX_AGE_SECONDS } from "@compoz/studio/auth/session-cookies";
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { getUsersRepository } from "@compoz/infra/users";

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  secret: process.env["AUTH_SECRET"],
  session: {
    strategy: "jwt",
    maxAge: STUDIO_SESSION_MAX_AGE_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: STUDIO_SESSION_MAX_AGE_SECONDS,
  },

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

        const repo = getUsersRepository();

        const user = await repo.readByEmail(email);

        if (!user) {
          throw new Error("EMAIL_NOT_FOUND");
        }

        if (user.status !== "active") {
          throw new Error("USER_DISABLED");
        }

        const ok = await repo.verifyPassword(user.id, password);

        if (!ok) {
          throw new Error("INVALID_PASSWORD");
        }

        const rbac = user.rbac;

        if (
          !rbac ||
          (rbac.role !== "admin" && rbac.role !== "editor") ||
          !Array.isArray(rbac.websiteIds) ||
          rbac.websiteIds.length === 0 ||
          !rbac.defaultWebsiteId
        ) {
          throw new Error("USER_RBAC_MISSING");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: rbac.role,
          websiteIds: rbac.websiteIds,
          defaultWebsiteId: rbac.defaultWebsiteId,
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
        token.websiteIds = user.websiteIds;
        token.defaultWebsiteId = user.defaultWebsiteId;
        token.isDemo = user.isDemo;
        token.demoInstanceId = user.demoInstanceId;
        token.demoExpiresAt = user.demoExpiresAt;
      }

      /**
       * NextAuth renseigne souvent `token.sub = user.id`.
       * On garde ce fallback uniquement pour consolider `userId`.
       */
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
        websiteIds: token.websiteIds,
        defaultWebsiteId: token.defaultWebsiteId,
        isDemo: token.isDemo,
        demoInstanceId: token.demoInstanceId,
        demoExpiresAt: token.demoExpiresAt,
      };

      return session;
    },
  },
};

export default NextAuth(authOptions);
