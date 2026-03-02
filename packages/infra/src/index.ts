/**
 * @file packages/infra/src/index.ts
 * @description Entrée du package infra (implémentations IO : KV/DB/FS/HTTP, caches, repos concrets).
 *
 * @remarks
 * - Ne doit jamais être importé par le domain/use-cases (sens des dépendances).
 * - Les apps (admin/public) peuvent importer infra pour câbler les implémentations.
 */

export const INFRA_MARKER = "@compoz/infra";
