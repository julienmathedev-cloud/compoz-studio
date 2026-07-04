/**
 * @file packages/core/src/constants/demo/demo.ts
 * @layer core/constants
 *
 * @description
 * Constantes partagées liées au système de sandbox démo Compoz.
 *
 * @remarks
 * - Centralise les conventions V1 utilisées par le bootstrap, l’auth
 *   et le cleanup des sandboxes démo.
 * - Ne contient volontairement aucune logique métier.
 */

/**
 * Website seed source de vérité utilisé pour cloner une sandbox démo.
 *
 * @remarks
 * Cette valeur correspond à un Prisma Website.id.
 */
export const DEMO_SEED_WEBSITE_ID = "demo" as const;

/**
 * Cookie permettant d’identifier l’instance sandbox associée au visiteur.
 */
export const DEMO_INSTANCE_COOKIE_NAME = "compoz_demo_instance" as const;

/**
 * Durée de vie par défaut d’une sandbox démo V1.
 *
 * Valeur actuelle :
 * - 24 heures
 */
export const DEMO_SANDBOX_TTL_MS = 24 * 60 * 60 * 1000;
