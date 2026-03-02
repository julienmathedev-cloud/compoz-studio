/**
 * @file packages/infra/src/pages/file-system-pages-repository.ts
 * @layer infra/pages
 * @description
 * Implémentation FileSystem du PagesRepository : lecture, écriture, suppression,
 * et listing de pages JSON sur disque.
 *
 * Stockage V1-like (Option 1) :
 * - Fichier = `<pageId>.json` (id stable, slug modifiable)
 * - Le JSON contient toujours `id`, `slug`, `title`, etc.
 *
 * Responsabilités : défense contre ids non sûrs, gestion ENOENT,
 * JSON invalide, dossiers draft/published, journaux et erreurs.
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type {
  Block,
  LayoutSectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type {
  Page,
  PageMeta,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

import { isENOENT } from "@compoz/infra/lib/errors";
import {
  ensureDirForFile,
  InvalidJsonFileError,
  readJsonFile,
  writeFileAtomic,
} from "@compoz/infra/lib/fs";
import { log, logSpan } from "@compoz/infra/lib/log";

import { PageSchema, type PageShape } from "@compoz/validation/pages/page";

const lg = log.child({ ns: "infra:pages", kind: "fs" });

/**
 * Défense FS : un id ne doit pas permettre de traversée de chemin.
 *
 * @remarks
 * - On reste permissif (uuid/cuid/nanoid possibles) : alnum + `_` + `-`
 * - Si tu figes UUIDv7 uniquement, on pourra renforcer.
 */
function assertSafePageId(pageId: string) {
  const id = String(pageId ?? "").trim();
  const ok = /^[a-zA-Z0-9_-]+$/.test(id);
  if (!ok) {
    throw new Error(`Unsafe pageId: "${pageId}"`);
  }
}

function assertSafeSlugForComparisons(slug: string) {
  // Ici on ne touche pas au FS avec le slug (id-first),
  // on le compare seulement.
  return String(slug ?? "").trim();
}

/**
 * Convertit une shape frontière (Zod) en entité domaine (`Page`).
 *
 * @remarks
 * La frontière (`PageShape`) utilise des `string` simples (ex: `id: string`).
 * Le domaine utilise des types plus stricts (ex: ids brandés, readonly arrays).
 * Ici on fait uniquement l’adaptation de types, sans introduire de logique métier.
 */
function toDomainPage(p: PageShape): Page {
  const meta: PageMeta = {
    createdAt: p.meta.createdAt,
    updatedAt: p.meta.updatedAt,
  };

  const blocks: ReadonlyArray<Block> = p.blocks.map((b) => {
    const block: LayoutSectionBlock = {
      ...b,
      id: b.id,
      containerMode: b.containerMode ?? "contained",
      cells: b.cells as ReadonlyArray<Cell>,
      title: b.title as LayoutSectionBlock["title"],
    };
    return block;
  });

  return {
    id: p.id,
    parentId: p.parentId,
    slug: p.slug,
    title: p.title,
    blocks,
    meta,
    sitemap: p.sitemap,
    paginationEnabled: p.paginationEnabled,
  };
}

/**
 * Implémentation FileSystem du dépôt des pages.
 */
export class FileSystemPagesRepository implements PagesRepository {
  /** Racine des contenus (ex: /app/content). */
  private readonly root: string;

  constructor(contentRoot = join(process.cwd(), "content")) {
    this.root = contentRoot;
  }

  /**
   * Retourne le dossier `<root>/<state>/pages`.
   */
  private dir(state: ContentState) {
    return join(this.root, state, "pages");
  }

  /**
   * Retourne le chemin complet du fichier JSON pour un pageId donné.
   * Exemple : /.../content/draft/pages/01H....json
   */
  private fileById(state: ContentState, pageId: string) {
    assertSafePageId(pageId);
    return join(this.dir(state), `${pageId}.json`);
  }

  /**
   * Crée les dossiers nécessaires pour draft et published.
   * Contrat : idempotent, ré-exécutable sans effet secondaire.
   */
  async ensureBase(): Promise<void> {
    return logSpan(
      "infra.pages.fs.ensureBase",
      { ns: "infra:pages", kind: "fs" },
      async () => {
        try {
          await ensureDirForFile(
            this.fileById(CONTENT_STATE.DRAFT, "placeholder"),
          );
          await ensureDirForFile(
            this.fileById(CONTENT_STATE.PUBLISHED, "placeholder"),
          );

          lg.debug("ensureBase.ok");
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          lg.warn("ensureBase.failed", { msg });
          throw e;
        }
      },
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Read                                                                    */
  /* ---------------------------------------------------------------------- */

  async readById(state: ContentState, pageId: string): Promise<Page | null> {
    const id = String(pageId ?? "").trim();
    if (!id) return null;

    const path = this.fileById(state, id);

    return logSpan(
      "infra.pages.fs.readById",
      { state, pageId: id },
      async () => {
        try {
          const raw = await readJsonFile<unknown>(path);
          const parsed = PageSchema.parse(raw);

          // Défense : cohérence id (fichier id.json doit contenir le même id).
          if (String(parsed.id ?? "").trim() !== id) {
            lg.warn("readById.id_mismatch", {
              state,
              pageId: id,
              parsedId: parsed.id,
            });
          }

          const page = toDomainPage(parsed);
          lg.debug("readById.ok", { state, pageId: id, slug: page.slug });
          return page;
        } catch (e: unknown) {
          if (isENOENT(e)) {
            lg.debug("readById.miss", { state, pageId: id });
            return null;
          }

          if (e instanceof InvalidJsonFileError) {
            lg.warn("readById.invalid_json", {
              state,
              pageId: id,
              path: e.path,
              hint: "Corrigez le JSON sur disque ou supprimez le fichier.",
            });
          } else {
            const msg = e instanceof Error ? e.message : String(e);
            lg.warn("readById.failed", { state, pageId: id, msg });
          }

          throw e;
        }
      },
    );
  }

  async readManyById(
    state: ContentState,
    ids: ReadonlyArray<string>,
  ): Promise<Array<Page | null>> {
    const safeIds = ids.map((x) => String(x ?? "").trim());

    return Promise.all(
      safeIds.map((id) =>
        id ? this.readById(state, id) : Promise.resolve(null),
      ),
    );
  }

  /**
   * Lecture par slug (compat interface).
   *
   * @remarks
   * Option 1 : stockage id-first → on doit scanner pour retrouver un id.
   * En pratique, le routing public/admin devrait résoudre `slug → id` via SiteIndex.
   */
  async readBySlug(state: ContentState, slug: string): Promise<Page | null> {
    const target = assertSafeSlugForComparisons(slug);
    if (!target) return null;

    return logSpan(
      "infra.pages.fs.readBySlug",
      { state, slug: target },
      async () => {
        const matches = await this.__findBySlug(state, target);
        if (!matches) return null;
        return this.readById(state, matches.id);
      },
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Write                                                                   */
  /* ---------------------------------------------------------------------- */

  async put(state: ContentState, page: Page): Promise<void> {
    const pageId = String(page.id ?? "").trim();
    if (!pageId) {
      throw new Error("FileSystemPagesRepository.put: page.id is required.");
    }

    assertSafePageId(pageId);

    const path = this.fileById(state, pageId);

    return logSpan(
      "infra.pages.fs.put",
      { state, pageId, slug: page.slug },
      async () => {
        try {
          // Défense en profondeur : valide la shape frontière avant persistance.
          PageSchema.parse(page);

          await writeFileAtomic(path, JSON.stringify(page, null, 2), "utf-8");
          lg.debug("write.ok", { state, pageId, slug: page.slug });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          lg.warn("write.failed", { state, pageId, slug: page.slug, msg });
          throw e;
        }
      },
    );
  }

  async putMany(
    state: ContentState,
    pages: ReadonlyArray<Page>,
  ): Promise<void> {
    if (pages.length === 0) return;

    await this.ensureBase();

    // Best effort perf : parallélise les writes atomiques.
    // Contrat : put() valide + écrit en atomic → OK.
    await Promise.all(pages.map((p) => this.put(state, p)));
  }

  /* ---------------------------------------------------------------------- */
  /* Delete                                                                  */
  /* ---------------------------------------------------------------------- */

  async deleteById(state: ContentState, pageId: string): Promise<void> {
    const id = String(pageId ?? "").trim();
    if (!id) return;

    const path = this.fileById(state, id);

    return logSpan(
      "infra.pages.fs.deleteById",
      { state, pageId: id },
      async () => {
        try {
          await fs.unlink(path);
          lg.debug("deleteById.ok", { state, pageId: id });
        } catch (e: unknown) {
          if (isENOENT(e)) {
            lg.debug("deleteById.idempotent.miss", { state, pageId: id });
            return;
          }
          const msg = e instanceof Error ? e.message : String(e);
          lg.warn("deleteById.failed", { state, pageId: id, msg });
          throw e;
        }
      },
    );
  }

  async deleteBySlug(state: ContentState, slug: string): Promise<void> {
    const target = assertSafeSlugForComparisons(slug);
    if (!target) return;

    const found = await this.__findBySlug(state, target);
    if (!found) return;

    await this.deleteById(state, found.id);
  }

  /* ---------------------------------------------------------------------- */
  /* Exists                                                                  */
  /* ---------------------------------------------------------------------- */

  async existsById(state: ContentState, pageId: string): Promise<boolean> {
    const id = String(pageId ?? "").trim();
    if (!id) return false;

    try {
      await fs.stat(this.fileById(state, id));
      return true;
    } catch {
      return false;
    }
  }

  async existsBySlug(state: ContentState, slug: string): Promise<boolean> {
    const target = assertSafeSlugForComparisons(slug);
    if (!target) return false;

    const found = await this.__findBySlug(state, target);
    return Boolean(found?.id);
  }

  /* ---------------------------------------------------------------------- */
  /* List                                                                    */
  /* ---------------------------------------------------------------------- */

  async list(state: ContentState): Promise<Array<PageSummary>> {
    const dir = this.dir(state);

    return logSpan("infra.pages.fs.list", { state }, async () => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const jsonFiles = entries.filter(
          (e) => e.isFile() && e.name.endsWith(".json"),
        );

        const results = await Promise.all(
          jsonFiles.map(async (e) => {
            const filePath = join(dir, e.name);

            try {
              const raw = await readJsonFile<unknown>(filePath);
              const parsed = PageSchema.parse(raw);

              // PageSummary : id + slug + title
              return {
                id: parsed.id,
                slug: parsed.slug,
                title: parsed.title,
                parentId: parsed.parentId,
              } satisfies PageSummary;
            } catch (err) {
              if (err instanceof InvalidJsonFileError) {
                lg.warn("list.invalid_json", { state, path: err.path });
                return null;
              }
              // Zod / autre : on loggue et on skip (list doit rester robuste)
              const msg = err instanceof Error ? err.message : String(err);
              lg.warn("list.skip", { state, path: filePath, msg });
              return null;
            }
          }),
        );

        return results.filter((x): x is PageSummary => x != null);
      } catch (e: unknown) {
        if (isENOENT(e)) return [];
        throw e;
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Internals                                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Scan (id-first) : retrouve un `{ id, slug }` en lisant les JSON.
   */
  private async __findBySlug(
    state: ContentState,
    slug: string,
  ): Promise<{ id: string; slug: string } | null> {
    const dir = this.dir(state);

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const jsonFiles = entries.filter(
        (e) => e.isFile() && e.name.endsWith(".json"),
      );

      for (const e of jsonFiles) {
        const filePath = join(dir, e.name);

        try {
          const raw = await readJsonFile<unknown>(filePath);
          const parsed = PageSchema.parse(raw);
          if (parsed.slug === slug) {
            return { id: parsed.id, slug: parsed.slug };
          }
        } catch {
          // scan best-effort : on ignore les fichiers invalides
        }
      }

      return null;
    } catch (e: unknown) {
      if (isENOENT(e)) return null;
      throw e;
    }
  }
}
