/**
 * @file apps/studio/src/auth/session-cookies.ts
 * @layer studio/auth
 *
 * @description
 * Cookie constants for the Studio session context.
 */

export const ACTIVE_WEBSITE_COOKIE = "compoz_active_website" as const;
export const LEGACY_ACTIVE_TENANT_COOKIE = "compoz_active_tenant" as const;

export const STUDIO_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Best-effort cleanup list for Auth.js/NextAuth cookies.
 *
 * The exact cookie set depends on the environment, security prefix,
 * and provider flow.
 */
export const NEXTAUTH_STUDIO_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce",
] as const;
