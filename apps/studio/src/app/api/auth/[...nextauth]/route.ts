/**
 * @file apps/studio/src/app/api/auth/[...nextauth]/route.ts
 * @layer api/routes
 */

import { authOptions } from "@compoz/studio/auth/auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
