/**
 * @file apps/studio/src/features/pages/lib/page-slug-auto-sync.ts
 * @layer studio/features/pages/lib
 *
 * @description
 * Pure state transitions for the page form's initial slug auto-generation.
 *
 * @remarks
 * A persisted or explicitly supplied slug is always authoritative. Only a
 * genuinely empty create form can derive its slug from the page title.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";

import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type SlugAutoSyncState = {
  locked: boolean;
  lastAutoSlug: string;
};

export function createSlugAutoSyncState(args: {
  initialValues: PageFormValues;
  mode: "create" | "edit";
}): SlugAutoSyncState {
  const initialSlug = String(args.initialValues.slug ?? "").trim();

  return {
    // An edit form may briefly render while its page is loading; it must never
    // derive a replacement slug from that temporary empty form state.
    locked: args.mode === "edit" || initialSlug.length > 0,
    lastAutoSlug:
      initialSlug === SITE_PATH.home
        ? SITE_PATH.home
        : normalizeSlug(initialSlug),
  };
}

/** Returns a derived slug only while the form is still in its empty create state. */
export function getAutoSlugFromName(args: {
  name: string;
  slug: string;
  state: SlugAutoSyncState;
}): string | null {
  const slug = String(args.slug ?? "").trim();

  // The home path is a real, persisted root-page value rather than an
  // uninitialized slug.
  if (slug === SITE_PATH.home) return null;

  const nextAutoSlug = normalizeSlug(String(args.name ?? "").trim());
  const canAutoSync =
    !args.state.locked &&
    (slug.length === 0 || slug === args.state.lastAutoSlug);

  if (!canAutoSync) return null;

  args.state.lastAutoSlug = nextAutoSlug;

  return slug === nextAutoSlug ? null : nextAutoSlug;
}
