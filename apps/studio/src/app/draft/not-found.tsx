/**
 * @file apps/studio/src/app/draft/not-found.tsx
 * @layer studio/app
 *
 * @description
 * 404 page for the `/draft` route in the Studio draft preview.
 *
 * @remarks
 * - `not-found.tsx` must remain a server component without `"use client"`.
 * - Dynamic UI rendering based on pathname/searchParams is delegated to a client component.
 * - V0.5 convention: draft preview uses `/draft`.
 */

import { StudioNotFoundClient } from "@compoz/studio/components/not-found/StudioNotFoundClient";

export default function DraftNotFound() {
  return <StudioNotFoundClient />;
}

DraftNotFound.displayName = "DraftNotFound";
