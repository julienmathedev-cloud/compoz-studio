"use client";

/**
 * @file apps/studio/src/features/admin/website/WebsiteContext.tsx
 * @layer studio/features/admin/website
 *
 * @description
 * Client context and hooks for accessing the active Studio Website.
 *
 * @remarks
 * - The active Website is resolved server-side through `requireSessionWithWebsite()`.
 * - Injected into the Studio client providers.
 * - `websiteId` scopes internal Studio data such as query keys, mutations, and RBAC.
 * - `websiteSlug` is used for public fallback URLs under `/t/:websiteSlug`.
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
