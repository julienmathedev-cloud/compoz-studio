/**
 * @file src/core/domain/pages/use-cases/update-page.ts
 * @layer core/domain
 * @description
 * Use-case : mise à jour d’une page (title / slug / sitemap) via patch partiel.
 *
 * @remarks
 * - No-op : si rien ne change, aucune écriture n’est effectuée.
 * - Slug : si modifié, vérifie l’unicité.
 * - Sitemap : merge contrôlé + invariants (priority).
 *
 * ⚠️ Note (C1) :
 * - On accepte des slugs “UI” (`/`, `/home`, `/contact`) et on les canonicalise côté domaine :
 *   - "/" ou "/home" => "home"
 *   - "/slug" => "slug"
 * - La mise à jour des menus (href) lors d’un rename de slug est gérée **ici**
 *   si `site` est disponible dans les deps (voir `applySlugPatch`).
 */

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type {
  UpdatePageDeps,
  UpdatePageInput,
  UpdatePageResult,
} from "@compoz/core/domain/pages/use-cases/update-page.types";
import {
  applySitemapDefaults,
  assertPageSlug,
  assertPaginationEnabled,
  assertParentId,
  assertPriority,
  assertTitleRequired,
} from "@compoz/core/domain/pages/validators/pages";

type ChangedKey = keyof Pick<
  Page,
  "title" | "slug" | "parentId" | "sitemap" | "paginationEnabled"
>;

export function updatePage({
  pages,
  // ✅ optionnel : permet d’auto-mettre à jour les href des menus (B2/C1)
  site,
  // statusCache, // ❌ domain pur : invalidation déplacée en route API
  nowIso = () => new Date().toISOString(),
}: UpdatePageDeps) {
  return async function run(input: UpdatePageInput): Promise<UpdatePageResult> {
    const pageId = String(input.pageId ?? "").trim();
    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    const existing = await readExistingPageById({
      pages,
      state: WRITE_CONTENT_STATE,
      pageId,
    });

    const next: Page = { ...existing };
    const changed: ChangedKey[] = [];

    applyTitlePatch({ existing, next, changed, input });

    const slugChange = await applySlugPatch({
      existing,
      next,
      changed,
      input,
      pages,
      state: WRITE_CONTENT_STATE,
    });

    applyParentIdPatch({ existing, next, changed, input });
    applyPaginationEnabledPatch({ existing, next, changed, input });
    applySitemapPatch({ existing, next, changed, input });

    if (changed.length === 0) return { page: existing };

    next.meta = { ...existing.meta, updatedAt: nowIso() };
    await pages.put(WRITE_CONTENT_STATE, next);

    if (slugChange && site) {
      await tryUpdateMenusForSlugRename({
        site,
        state: WRITE_CONTENT_STATE,
        fromSlug: slugChange.from,
        toSlug: slugChange.to,
      });
    }

    // ✅ domain pur : plus d’invalidation KV ici
    return { page: next };
  };
}

/* -------------------------------------------------------------------------- */
/* Inline helpers                                                             */
/* -------------------------------------------------------------------------- */

async function readExistingPageById({
  pages,
  state,
  pageId,
}: {
  pages: UpdatePageDeps["pages"];
  state: ContentState;
  pageId: string;
}): Promise<Page> {
  await pages.ensureBase();
  const existing = await pages.readById(state, pageId);

  if (!existing) {
    throw new DomainError({
      code: EC.PAGE_NOT_FOUND,
      message: EC.PAGE_NOT_FOUND,
    });
  }

  return existing;
}

function applyTitlePatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (typeof input.title !== "string") return;

  const t = assertTitleRequired(input.title);
  if (t !== existing.title) {
    next.title = t;
    changed.push("title");
  }
}

type SlugChange = Readonly<{ from: string; to: string }>;

async function applySlugPatch({
  existing,
  next,
  changed,
  input,
  pages,
  state,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
  pages: UpdatePageDeps["pages"];
  state: ContentState;
}): Promise<SlugChange | null> {
  if (typeof input.slug !== "string") return null;

  const rawSlug = String(input.slug ?? "").trim();

  // Reset : slug vidé => on dérive depuis le titre courant (next.title si modifié)
  const baseSource =
    rawSlug.length === 0 ? next.title : normalizeSlugInput(rawSlug);

  const candidate = assertPageSlug(baseSource);

  if (candidate === existing.slug) return null;

  const other = await pages.readBySlug(state, candidate);
  if (other && other.id !== existing.id) {
    throw new DomainError({
      code: EC.PAGE_SLUG_CONFLICT,
      message: EC.PAGE_SLUG_CONFLICT,
    });
  }

  const from = existing.slug;
  next.slug = candidate;
  changed.push("slug");

  return { from, to: candidate };
}

function normalizeSlugInput(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  if (raw === "/") return "home";

  const stripped = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!stripped) return "home";
  if (stripped === "home") return "home";

  return stripped;
}

function toInternalPathFromSlug(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s || s === "home") return "/";
  return `/${s.replace(/^\/+/, "")}`;
}

function applySitemapPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (typeof input.sitemap !== "object" || input.sitemap === null) return;

  const prev = existing.sitemap ?? applySitemapDefaults();

  const nextChangefreq =
    "changefreq" in input.sitemap
      ? input.sitemap.changefreq === null
        ? undefined
        : input.sitemap.changefreq
      : prev.changefreq;

  const nextPriority =
    "priority" in input.sitemap
      ? input.sitemap.priority === null
        ? undefined
        : input.sitemap.priority
      : prev.priority;

  const sNext = {
    include: input.sitemap.include ?? prev.include ?? true,
    changefreq: nextChangefreq,
    priority: nextPriority,
  };

  assertPriority(sNext.priority);

  const changedSitemap =
    sNext.include !== (prev.include ?? true) ||
    sNext.changefreq !== prev.changefreq ||
    sNext.priority !== prev.priority;

  if (changedSitemap) {
    next.sitemap = sNext;
    changed.push("sitemap");
  }
}

function applyParentIdPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (!("parentId" in input)) return;

  const pid = assertParentId(input.parentId, ["parentId"]);

  if (pid !== existing.parentId) {
    if (pid !== null && pid === existing.id) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["parentId"], meta: { reason: "self_parent" } },
      });
    }

    next.parentId = pid;
    changed.push("parentId");
  }
}

function applyPaginationEnabledPatch({
  existing,
  next,
  changed,
  input,
}: {
  existing: Page;
  next: Page;
  changed: ChangedKey[];
  input: UpdatePageInput;
}): void {
  if (!("paginationEnabled" in input)) return;

  const isRoot = next.parentId === null;

  const value = isRoot
    ? false
    : assertPaginationEnabled({
        parentId: next.parentId,
        paginationEnabled: input.paginationEnabled,
        path: ["paginationEnabled"],
      });

  if (value !== existing.paginationEnabled) {
    next.paginationEnabled = value;
    changed.push("paginationEnabled");
  }
}

/* -------------------------------------------------------------------------- */
/* Menu auto-update (slug rename)                                             */
/* -------------------------------------------------------------------------- */

async function tryUpdateMenusForSlugRename(args: {
  site: NonNullable<UpdatePageDeps["site"]>;
  state: ContentState;
  fromSlug: string;
  toSlug: string;
}): Promise<void> {
  const { site, state, fromSlug, toSlug } = args;

  const fromPath = toInternalPathFromSlug(fromSlug);
  const toPath = toInternalPathFromSlug(toSlug);

  if (fromPath === toPath) return;

  try {
    await site.ensureBase();

    const settings = await site.readSettings(state);

    function patchItems<T extends { href: string }>(
      items: ReadonlyArray<T> | undefined,
    ) {
      const list = items ?? [];
      let changed = false;

      const nextItems = list.map((it) => {
        const href = String(it.href ?? "").trim();

        if (href === fromPath) {
          changed = true;
          return { ...it, href: toPath };
        }

        if (fromSlug === "home" && (href === "/home" || href === "home")) {
          changed = true;
          return { ...it, href: "/" };
        }

        return it;
      });

      return { nextItems, changed } as const;
    }

    const primary = patchItems(settings.primaryMenu?.items);
    const legal = patchItems(settings.legalMenu?.items);

    if (!primary.changed && !legal.changed) return;

    const nextSettings = {
      ...settings,

      primaryMenu: settings.primaryMenu
        ? { ...settings.primaryMenu, items: primary.nextItems }
        : settings.primaryMenu,

      legalMenu: settings.legalMenu
        ? { ...settings.legalMenu, items: legal.nextItems }
        : settings.legalMenu,
    };

    await site.writeSettings(state, nextSettings);
  } catch {
    return;
  }
}
