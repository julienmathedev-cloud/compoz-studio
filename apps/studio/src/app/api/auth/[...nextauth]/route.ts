/**
 * @file apps/studio/src/app/api/auth/[...nextauth]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route NextAuth (Studio) : endpoints d’authentification (GET/POST).
 *
 * @remarks
 * - App Router : expose le handler NextAuth sur GET et POST.
 * - La configuration (providers, callbacks, etc.) est définie dans `authOptions`.
 */
import "server-only";
import NextAuth from "next-auth";

import { authOptions } from "@compoz/studio/auth/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
