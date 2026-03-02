/**
 * @file packages/validation/src/common/date.ts
 * @layer schemas
 * @description
 * Schémas utilitaires pour la validation de dates ISO UTC.
 * Ces schémas valident uniquement la structure des chaînes ; toute logique métier
 * est gérée dans le domaine.
 */

import { z } from "zod";

/** Pattern ISO 8601 UTC autorisant les millisecondes, toujours terminé par "Z". */
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/**
 * Vérifie qu'une chaîne est une date ISO UTC valide.
 *
 * @param value - Chaîne supposée ISO UTC.
 * @returns `true` si la forme est correcte et parsable par `Date.parse`.
 */
function isIsoUtc(value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.trim() !== value) return false; // interdit les espaces autour
  if (!ISO_UTC_PATTERN.test(value)) return false;

  const time = Date.parse(value);
  return Number.isFinite(time);
}

/**
 * Schéma Zod : chaîne ISO UTC valide (ex. `new Date().toISOString()`).
 *
 * @remarks
 * - Strictement **ISO 8601 UTC** avec suffixe `Z`.
 * - Rejet des dates locales, fuseaux différents, ou formats imprécis.
 */
export const IsoDateStringSchema = z.string().refine(isIsoUtc, {
  message: "Date ISO UTC invalide.",
});
