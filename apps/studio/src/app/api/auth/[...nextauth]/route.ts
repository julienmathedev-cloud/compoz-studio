/**
 * @file apps/studio/src/app/api/auth/[...nextauth]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio NextAuth route exposing the configured authentication handler.
 */
import "server-only";
import NextAuth from "next-auth";

import { authOptions } from "@compoz/studio/auth/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
