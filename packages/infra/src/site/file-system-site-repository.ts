/**
 * @file packages/infra/src/site/file-system-site-repository.ts
 * @layer infra/site
 * @description
 * Implémentation FileSystem du SiteRepository.
 *
 * Responsabilités : lecture/écriture des fichiers JSON pour l’index et les settings,
 * fallback sur defaults, gestion optionnelle des backups historiques.
 */

import { join } from "node:path";

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

import {
  ensureDirForFile,
  InvalidJsonFileError,
  readJsonFile,
  writeFileAtomic,
} from "@compoz/infra/lib/fs";

import { isENOENT } from "@compoz/infra/lib/errors";

import { log, logSpan } from "@compoz/infra/lib/log";

const lg = log.child({ ns: "infra:site", impl: "fs" });

/**
 * Active ou non les backups d’historique de settings.
 * - `SITE_SETTINGS_HISTORY=1|true` → backups activés.
 * - Toute autre valeur → backups désactivés.
 */
const HISTORY_ENABLED =
  String(process.env["SITE_SETTINGS_HISTORY"] ?? "").toLowerCase() === "true" ||
  process.env["SITE_SETTINGS_HISTORY"] === "1";

/**
 * Génère un timestamp safe pour les fichiers (remplace ":" par "-").
 * @param d Date utilisée (par défaut: new Date()).
 */
function tsForFile(d = new Date()): string {
  return d.toISOString().replace(/[:]/g, "-");
}

/**
 * Retourne un index vide avec timestamp courant.
 */
function defaultIndex(draft: boolean = true): SiteIndex {
  if (draft) {
    return { pages: [], updatedAt: new Date().toISOString() };
  }
  return { pages: [], updatedAt: "" };
}

/**
 * Retourne les settings complets avec tous les defaults du domaine.
 */
function defaultSettings(): SiteSettings {
  return {
    header: { ...DEFAULT_HEADER_SETTINGS },
    footer: { ...DEFAULT_FOOTER_SETTINGS },
    primaryMenu: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
    legalMenu: { ...DEFAULT_LEGAL_MENU_SETTINGS },
    identity: { ...DEFAULT_IDENTITY_SETTINGS },
    social: { ...DEFAULT_SOCIAL_SETTINGS },
    seo: { ...DEFAULT_SEO_SETTINGS },
  };
}

/**
 * Repository SiteRepository basé sur le filesystem.
 * Contrat : lecture/écriture JSON tolérante, fallback sur defaults.
 */
export class FileSystemSiteRepository implements SiteRepository {
  /**
   * Racine de contenu (ex: `<cwd>/content` par défaut).
   * @remarks
   * - Peut être surchargée via le paramètre du constructeur.
   */
  private readonly root: string;

  constructor(contentRoot = join(process.cwd(), "content")) {
    this.root = contentRoot;
  }

  // ---------------------------------------------------------------------------
  // Paths helpers
  // ---------------------------------------------------------------------------

  /** Chemin du fichier d’index pour un espace donné. */
  private indexPath(state: ContentState) {
    return join(this.root, state, "index.json");
  }

  /** Chemin du fichier de settings principal pour un espace donné. */
  private settingsPath(state: ContentState) {
    return join(this.root, state, "settings", "site.json");
  }

  /** Chemin du fichier d’historique de settings pour un espace donné. */
  private settingsHistoryPath(state: ContentState) {
    return join(
      this.root,
      state,
      "settings",
      ".history",
      `site-${tsForFile()}.json`,
    );
  }

  // ---------------------------------------------------------------------------
  // Base
  // ---------------------------------------------------------------------------

  /**
   * Assure l’existence des dossiers de base pour draft et published.
   * Contrat : idempotent, crée uniquement ce qui manque.
   */
  async ensureBase(): Promise<void> {
    return logSpan(
      "infra.site.fs.ensureBase",
      { root: this.root },
      async () => {
        lg.debug("ensureBase.start", { root: this.root });

        await ensureDirForFile(this.indexPath(CONTENT_STATE.DRAFT));
        await ensureDirForFile(this.indexPath(CONTENT_STATE.PUBLISHED));
        await ensureDirForFile(this.settingsPath(CONTENT_STATE.DRAFT));
        await ensureDirForFile(this.settingsPath(CONTENT_STATE.PUBLISHED));

        lg.debug("ensureBase.ok");
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Index
  // ---------------------------------------------------------------------------

  /**
   * Lit l’index pour un état donné.
   * Contrat : retourne SiteIndex ou fallback defaultIndex().
   */
  async readIndex(state: ContentState): Promise<SiteIndex> {
    return logSpan("infra.site.fs.readIndex", { state }, async () => {
      const file = this.indexPath(state);

      try {
        const parsed = await readJsonFile<SiteIndex>(file);
        lg.debug("readIndex.ok", { state });
        return parsed;
      } catch (e: unknown) {
        if (isENOENT(e)) {
          lg.debug("readIndex.fallback.default", { state });
          return defaultIndex(state === CONTENT_STATE.DRAFT);
        }

        if (e instanceof InvalidJsonFileError) {
          lg.warn("readIndex.invalid_json", {
            state,
            path: e.path,
            hint: "Corrigez le JSON dans index.json ou supprimez-le.",
          });
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          lg.error("readIndex.unexpected", { state, msg });
        }

        throw e;
      }
    });
  }

  /**
   * Écrit l’index pour un état donné.
   * Contrat : création des dossiers parents si nécessaire, écriture atomique.
   */
  async writeIndex(state: ContentState, index: SiteIndex): Promise<void> {
    return logSpan("infra.site.fs.writeIndex", { state }, async () => {
      const file = this.indexPath(state);

      await ensureDirForFile(file);
      await writeFileAtomic(file, JSON.stringify(index, null, 2), "utf-8");

      lg.debug("writeIndex.ok", { state });
    });
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /**
   * Lit les settings pour un état donné.
   * Contrat : fallback defaultSettings() si fichier absent, complète les sous-sections manquantes.
   */
  async readSettings(state: ContentState): Promise<SiteSettings> {
    return logSpan("infra.site.fs.readSettings", { state }, async () => {
      const file = this.settingsPath(state);

      try {
        const parsed = await readJsonFile<Partial<SiteSettings>>(file);
        lg.debug("readSettings.ok", { state });

        // Complète avec defaults si des clés manquent (tolérant aux brouillons incomplets)
        const d = defaultSettings();

        return {
          header: parsed.header ?? d.header,
          footer: parsed.footer ?? d.footer,
          primaryMenu: parsed.primaryMenu ?? d.primaryMenu,
          legalMenu: parsed.legalMenu ?? d.legalMenu,
          identity: parsed.identity ?? d.identity,
          social: parsed.social ?? d.social,
          seo: parsed.seo ?? d.seo,
        };
      } catch (e: unknown) {
        if (isENOENT(e)) {
          lg.debug("readSettings.fallback.defaults", { state });
          return defaultSettings();
        }

        if (e instanceof InvalidJsonFileError) {
          lg.warn("readSettings.invalid_json", {
            state,
            path: e.path,
            hint: "Corrigez le JSON dans settings/site.json ou supprimez-le.",
          });
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          lg.error("readSettings.unexpected", { state, msg });
        }

        throw e;
      }
    });
  }

  /**
   * Écrit les settings pour un état donné.
   * Contrat : écriture principale toujours effectuée, backup historique en best-effort.
   */
  async writeSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    return logSpan(
      "infra.site.fs.writeSettings",
      { state, history: HISTORY_ENABLED },
      async () => {
        const file = this.settingsPath(state);

        await ensureDirForFile(file);

        const json = JSON.stringify(settings, null, 2);

        // Backup optionnel avant overwrite (best-effort)
        if (HISTORY_ENABLED) {
          try {
            const hist = this.settingsHistoryPath(state);

            await ensureDirForFile(hist);
            await writeFileAtomic(hist, json, "utf-8");

            lg.debug("writeSettings.backup", { state, hist });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            lg.warn("writeSettings.backup.failed", { state, msg });
            // On continue — l'écriture principale ne doit pas échouer à cause du backup.
          }
        }

        await writeFileAtomic(file, json, "utf-8");
        lg.debug("writeSettings.ok", { state });
      },
    );
  }
}
