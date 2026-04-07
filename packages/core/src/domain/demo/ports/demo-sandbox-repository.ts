/**
 * @file packages/core/src/domain/demo/ports/demo-sandbox-repository.ts
 * @layer core/domain
 * @description
 * Port de persistance des sandboxes démo.
 *
 * @remarks
 * - Permet de retrouver une sandbox à partir de son `demoInstanceId`.
 * - Utilisé pour la réutilisation d'une sandbox existante via cookie.
 * - V1 volontairement minimal : pas de recherche avancée.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";

export interface DemoSandboxRepository {
  /**
   * Prépare le support de persistance si nécessaire.
   *
   * @remarks
   * - No-op possible pour une implémentation KV.
   */
  ensureBase(): Promise<void>;

  /**
   * Liste toutes les sandboxes démo enregistrées.
   *
   * @remarks
   * - Utilisé notamment pour le cleanup des sandboxes expirées.
   */
  list(): Promise<ReadonlyArray<DemoSandbox>>;

  /**
   * Lit une sandbox démo par son identifiant technique unique.
   */
  readByDemoInstanceId(demoInstanceId: string): Promise<DemoSandbox | null>;

  /**
   * Écrit ou remplace une sandbox démo.
   */
  put(sandbox: DemoSandbox): Promise<void>;

  /**
   * Supprime une sandbox démo par son identifiant technique unique.
   *
   * @remarks
   * - Idempotent : ne lève pas si la sandbox n'existe pas.
   */
  deleteByDemoInstanceId(demoInstanceId: string): Promise<void>;

  /**
   * Indique si une sandbox démo existe pour cet identifiant.
   */
  existsByDemoInstanceId(demoInstanceId: string): Promise<boolean>;
}
