/**
 * @file src/core/domain/errors/domain-error.ts
 * @layer core/domain
 * @description
 * Erreur métier standard du domaine : typée (`ErrorCode`), stable, sérialisable
 * et indépendante de toute représentation technique (HTTP, UI).
 *
 * Sert de base aux use-cases et peut être mappée dans les adapters (HTTP, UI).
 */

import { isErrorCode, type ErrorCode } from "@compoz/core/domain/errors/codes";

/* -------------------------------------------------------------------------- */
/*                                 Construction                                */
/* -------------------------------------------------------------------------- */

type DomainErrorInit = {
  /** Code métier strict (issu de ERROR_CODES). */
  code: ErrorCode;

  /** Message optionnel (sinon le code est utilisé comme message défaut). */
  message?: string;

  /** Détails métier facultatifs (ex: valeur refusée, contrainte violée…). */
  details?: unknown;

  /**
   * Cause technique ou métier d'origine (optionnel).
   * Compatible avec la propriété standard `Error.cause`.
   */
  cause?: unknown;
};

/**
 * Erreur métier minimale, sérialisable, stable et compatible avec l’adapter HTTP.
 *
 * Notes :
 * - Le `name` est toujours "DomainError".
 * - Le prototype est réinitialisé pour conserver `instanceof` dans TS/JS.
 * - `toJSON()` exporte un format propre (nom, code, message).
 */
export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor({ code, message, details, cause }: DomainErrorInit) {
    // Support natif du champ `cause` si runtime compatible
    super(message ?? code, cause !== undefined ? { cause } : undefined);

    this.name = "DomainError";
    this.code = code;
    this.details = details;

    // Réparation du prototype pour compatibilité héritage JS/TS.
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture propre du stack (si disponible dans l’environnement)
    Error.captureStackTrace?.(this, DomainError);
  }

  /**
   * Représentation sérialisable utile pour :
   * - logs structurés,
   * - tests unitaires,
   * - diagnostic côté serverless.
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                               Type Guards                                   */
/* -------------------------------------------------------------------------- */

/**
 * Vérifie si un objet inconnu contient une propriété `code: string`.
 *
 * Utilisé par `isDomainError` et `isStrictDomainError`.
 */
function hasStringCode(value: unknown): value is { code: string } {
  if (value === null || typeof value !== "object") return false;

  const v = (value as { code?: unknown }).code;
  return typeof v === "string";
}

/**
 * Guard souple :
 * - vérifie la présence d’une propriété `.code` string,
 * - n’impose pas que le code appartienne à `ERROR_CODES`,
 * - n’impose pas que `name` === "DomainError".
 *
 * Utile dans des zones où l’on veut juste distinguer :
 * → “erreur métier-like” vs “erreur technique”.
 */
export function isDomainError(e: unknown): e is DomainError {
  return hasStringCode(e);
}

/**
 * Guard stricte :
 * - vérifie `.code ∈ ErrorCode`,
 * - accepte les sous-classes de DomainError,
 * - utilisé principalement dans les adapters HTTP.
 */
export function isStrictDomainError(e: unknown): e is DomainError {
  return hasStringCode(e) && isErrorCode(e.code);
}
