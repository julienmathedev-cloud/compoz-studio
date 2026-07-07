/**
 * @file packages/infra/src/pages/in-memory-pages-repository.ts
 * @layer infra/pages
 * @description In-memory PagesRepository implementation for tests.
 * @remarks
 * Keeps DB-like slug indexing and defensive cloning while leaving domain validation outside infra.
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

/** Internal id-first store with a secondary slug index. */
type Store = Readonly<{
  byId: Map<string, Page>;
  slugToId: Map<string, string>;
}>;

function norm(value: unknown): string {
  return String(value ?? "").trim();
}

/** Defensive clone for serialized page entities stored in memory. */
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

  async ensureBase(): Promise<void> {}

  private getStore(state: ContentState): Store {
    return state === CONTENT_STATE.PUBLISHED ? this.published : this.draft;
  }

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

  async put(state: ContentState, page: Page): Promise<void> {
    const store = this.getStore(state);

    const id = norm(page?.id);
    const slug = norm(page?.slug);

    // Minimal infra guard: entries without id or slug are ignored.
    if (!id || !slug) return;

    // Keep the secondary slug index in sync when an id changes slug.
    const prev = store.byId.get(id);
    if (prev && prev.slug && prev.slug !== slug) {
      store.slugToId.delete(prev.slug);
    }

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

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = norm(pageId);
    if (!id) return;

    const store = this.getStore(state);
    const prev = store.byId.get(id);

    if (prev?.slug) {
      // Remove the slug mapping only when it still points to this id.
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

  async list(state: ContentState): Promise<PageSummary[]> {
    const store = this.getStore(state);
    const out: PageSummary[] = [];

    for (const p of store.byId.values()) {
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
