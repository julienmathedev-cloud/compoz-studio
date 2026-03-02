/**
 * @file apps/site/src/lib/pages/public-page-loaders.ts
 * @layer public/lib/pages
 *
 * @description
 * Loaders server (Next/React) pour les pages publiques basées sur l’index :
 * - request-dedupe via `cache()`
 * - résolution slug -> pageId via helpers core
 *
 * @remarks
 * - Dépend volontairement de React (`cache`) et du runtime server.
 * - Ne doit pas aller dans `@compoz/core`.
 */

import { cache } from "react";
import "server-only";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { resolvePageIdFromIndex } from "@compoz/core/domain/pages/helpers/resolve-page-id-from-index";
import { getPagesRepository } from "@compoz/infra/pages";
import { getSiteRepository } from "@compoz/infra/site";

/* -------------------------------------------------------------------------- */
/* PUBLISHED                                                                   */
/* -------------------------------------------------------------------------- */

export const getPublishedSettings = cache(async () => {
  const repo = getSiteRepository();
  return repo.readSettings(CONTENT_STATE.PUBLISHED);
});

export const getPublishedIndex = cache(async () => {
  const repo = getSiteRepository();
  return repo.readIndex(CONTENT_STATE.PUBLISHED);
});

export const getPublishedPageBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s || s === "home") return null;

  const pagesRepo = getPagesRepository();
  const index = await getPublishedIndex();
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: s, index });
  if (!pageId) return null;

  return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
});

export const getPublishedHomePage = cache(async () => {
  const pagesRepo = getPagesRepository();
  const index = await getPublishedIndex();
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: "home", index });
  if (!pageId) return null;

  return pagesRepo.readById(CONTENT_STATE.PUBLISHED, pageId);
});

/* -------------------------------------------------------------------------- */
/* DRAFT                                                                       */
/* -------------------------------------------------------------------------- */

export const getDraftSettings = cache(async () => {
  const repo = getSiteRepository();
  return repo.readSettings(CONTENT_STATE.DRAFT);
});

export const getDraftIndex = cache(async () => {
  const repo = getSiteRepository();
  return repo.readIndex(CONTENT_STATE.DRAFT);
});

export const getDraftPageBySlug = cache(async (slug: string) => {
  const s = String(slug ?? "").trim();
  if (!s || s === "home") return null;

  const pagesRepo = getPagesRepository();
  const index = await getDraftIndex();
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: s, index });
  if (!pageId) return null;

  return pagesRepo.readById(CONTENT_STATE.DRAFT, pageId);
});

export const getDraftHomePage = cache(async () => {
  const pagesRepo = getPagesRepository();
  const index = await getDraftIndex();
  if (!index) return null;

  const pageId = resolvePageIdFromIndex({ slug: "home", index });
  if (!pageId) return null;

  return pagesRepo.readById(CONTENT_STATE.DRAFT, pageId);
});
