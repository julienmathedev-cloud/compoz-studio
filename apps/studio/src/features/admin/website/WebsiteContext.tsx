"use client";

/**
 * @file apps/studio/src/features/admin/website/WebsiteContext.tsx
 * @layer studio/features/admin/context
 *
 * @description
 * Context + hooks client pour accéder au Website actif.
 *
 * @remarks
 * - Le Website actif est résolu côté server via `requireSessionWithWebsite()`.
 * - Injecté dans les providers client du Studio.
 * - `websiteId` sert au scope interne Studio : queryKeys, mutations, RBAC.
 * - `websiteSlug` sert aux URLs publiques fallback `/t/:websiteSlug`.
 */

import { createContext, useContext } from "react";

export type WebsiteContextValue = Readonly<{
  websiteId: string;
  websiteSlug: string;
  websiteName?: string;
}>;

export const WebsiteContext = createContext<WebsiteContextValue | null>(null);

function requireNonEmptyString(value: unknown, field: string): string {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`${field} is required`);
  }

  return normalized;
}

export function useWebsiteContext(): WebsiteContextValue {
  const ctx = useContext(WebsiteContext);

  if (!ctx) {
    throw new Error("WebsiteContext is required");
  }

  return {
    websiteId: requireNonEmptyString(ctx.websiteId, "WebsiteContext.websiteId"),
    websiteSlug: requireNonEmptyString(
      ctx.websiteSlug,
      "WebsiteContext.websiteSlug",
    ),
    websiteName: ctx.websiteName,
  };
}

export function useWebsiteId(): string {
  return useWebsiteContext().websiteId;
}

export function useWebsiteSlug(): string {
  return useWebsiteContext().websiteSlug;
}
