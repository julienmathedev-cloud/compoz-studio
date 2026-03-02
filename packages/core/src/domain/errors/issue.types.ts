/**
 * @file src/core/domain/errors/issue.types.ts
 * @layer core/domain
 * @description
 * Types légers pour représenter des avertissements métier **non bloquants**
 * destinés à l’UI (qualité, conseils, alertes douces).
 *
 * Ces issues :
 * - ne sont pas des erreurs métier,
 * - ne sont pas mappées vers HTTP,
 * - n’empêchent ni sauvegarde ni publication,
 * - servent principalement au feedback UX.
 */

/* -------------------------------------------------------------------------- */
/*                                IssuePath                                   */
/* -------------------------------------------------------------------------- */

/**
 * Chemin vers le champ concerné par le warning.
 *
 * Exemple :
 *   ["seo", "description"]
 *   ["menu", 2, "label"]
 *
 * Permet à l’UI de :
 * - scroller vers le champ,
 * - afficher un badge,
 * - appliquer un highlight ciblé,
 * - grouper les warnings par section.
 */
export type IssuePath = ReadonlyArray<string | number>;

/* -------------------------------------------------------------------------- */
/*                                 UiWarning                                  */
/* -------------------------------------------------------------------------- */

/**
 * Représentation minimale d’un avertissement destiné à l’UI.
 *
 * @typeParam C - Code stable du warning (string littérale).
 *
 * Exemple :
 *   { code: "PUBLISH_HOME_MISSING", path: ["pages"] }
 *
 * Les warnings sont :
 * - **non bloquants**
 * - **transport léger**
 * - **mappables vers i18n côté UI**
 */
export type UiWarning<C extends string = string> = Readonly<{
  /**
   * Code stable du warning.
   * Doit rester déterministe et versionnable.
   */
  code: C;

  /**
   * Chemin ciblé dans le modèle.
   * Optionnel si warning global.
   */
  path?: IssuePath;

  /**
   * Données contextuelles pour l’UI ou l’i18n.
   * Exemple : { max: 120, actual: 145 }
   */
  meta?: Readonly<Record<string, unknown>>;
}>;
