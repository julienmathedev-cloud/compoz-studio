/**
 * @file packages/infra/src/pages/in-memory-pages-repository.ts
 * @layer infra/pages
 * @description
 * Implémentation InMemory du PagesRepository pour tests unitaires et e2e.
 *
 * Responsabilités :
 * - stockage en mémoire process-local par état (`draft`/`published`)
 * - indexation id-first (Map id -> Page)
 * - index secondaire slug -> id (résolution "DB-like")
 * - clonage structuré des pages pour éviter les mutations croisées
 * - respect strict de l’interface PagesRepository
 *
 * @remarks
 * - Aucune validation métier (slug/uniqueness) : c’est le domaine qui tranche.
 * - Comportement idempotent : delete sur page absente ne jette pas.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

/**
 * Store interne :
 * - byId : id -> Page
 * - slugToId : slug -> id
 */
type Store = Readonly<{
  byId: Map<string, Page>;
  slugToId: Map<string, string>;
}>;

/**
 * Normalise une entrée string (trim + fallback).
 * Contrat : retourne toujours une string.
 */
function norm(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Clone défensif d’une Page pour éviter les mutations croisées.
 *
 * @remarks
 * - Utilise `structuredClone` si disponible (Node 17+/browsers modernes).
 * - Fallback JSON sinon (suffisant pour nos entités sérialisables).
 */
function clonePage(page: Page): Page {
  const sc = (globalThis as { structuredClone?: unknown }).structuredClone;
  if (typeof sc === "function") {
    return (sc as (v: Page) => Page)(page);
  }
  return JSON.parse(JSON.stringify(page)) as Page;
}

export class InMemoryPagesRepository implements PagesRepository {
  private draft: Store = { byId: new Map(), slugToId: new Map() };
  private published: Store = { byId: new Map(), slugToId: new Map() };

  async ensureBase(): Promise<void> {
    // no-op (in-memory)
  }

  private getStore(state: ContentState): Store {
    return state === CONTENT_STATE.PUBLISHED ? this.published : this.draft;
  }

  /* -------------------------------------------------------------------------- */
  /* Reads                                                                      */
  /* -------------------------------------------------------------------------- */

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = norm(pageId);
    if (!id) return null;

    const p = this.getStore(state).byId.get(id);
    return p ? clonePage(p) : null;
  }

  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const s = norm(slug);
    if (!s) return null;

    const store = this.getStore(state);
    const id = store.slugToId.get(s);
    if (!id) return null;

    const p = store.byId.get(id);
    return p ? clonePage(p) : null;
  }

  /* -------------------------------------------------------------------------- */
  /* Writes                                                                     */
  /* -------------------------------------------------------------------------- */

  async put(state: ContentState, page: Page): Promise<void> {
    const store = this.getStore(state);

    const id = norm(page?.id);
    const slug = norm(page?.slug);

    // Contrat infra minimal : on ne persiste pas d’entrée sans id/slug.
    if (!id || !slug) return;

    // Si une page existait déjà avec ce même id et un autre slug, on nettoie l’index slug.
    const prev = store.byId.get(id);
    if (prev && prev.slug && prev.slug !== slug) {
      store.slugToId.delete(prev.slug);
    }

    // On écrase l’éventuelle entrée slug -> id précédente
    // (si un autre id utilisait ce slug, l’ancien mapping est remplacé).
    store.slugToId.set(slug, id);

    store.byId.set(id, clonePage(page));
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    if (pages.length === 0) return;

    for (const p of pages) {
      await this.put(state, p);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Deletes                                                                    */
  /* -------------------------------------------------------------------------- */

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = norm(pageId);
    if (!id) return;

    const store = this.getStore(state);
    const prev = store.byId.get(id);

    if (prev?.slug) {
      // On retire le mapping slug -> id uniquement s’il pointe vers cet id.
      const mapped = store.slugToId.get(prev.slug);
      if (mapped === id) store.slugToId.delete(prev.slug);
    }

    store.byId.delete(id);
  }

  async deleteBySlug(state: ContentState, slug: string): Promise<void> {
    const s = norm(slug);
    if (!s) return;

    const store = this.getStore(state);
    const id = store.slugToId.get(s);
    if (!id) return;

    await this.deleteById(state, id);
  }

  /* -------------------------------------------------------------------------- */
  /* Exists                                                                     */
  /* -------------------------------------------------------------------------- */

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = norm(pageId);
    if (!id) return false;
    return this.getStore(state).byId.has(id);
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const s = norm(slug);
    if (!s) return false;
    return this.getStore(state).slugToId.has(s);
  }

  /* -------------------------------------------------------------------------- */
  /* Bulk reads                                                                 */
  /* -------------------------------------------------------------------------- */

  async readManyById(
    state: ContentState,
    pageIds: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const store = this.getStore(state);

    return pageIds.map((pageId) => {
      const id = norm(pageId);
      if (!id) return null;

      const p = store.byId.get(id);
      return p ? clonePage(p) : null;
    });
  }

  /* -------------------------------------------------------------------------- */
  /* List                                                                       */
  /* -------------------------------------------------------------------------- */

  async list(state: ContentState): Promise<PageSummary[]> {
    const store = this.getStore(state);
    const out: PageSummary[] = [];

    for (const p of store.byId.values()) {
      // PageSummary "DB-like" : id + slug + title
      out.push({
        id: p.id,
        slug: p.slug,
        name: p.name,
        parentId: p.parentId,
      });
    }

    return out;
  }
}
