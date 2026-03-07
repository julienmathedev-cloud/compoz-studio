/**
 * @file packages/infra/src/lib/errors.ts
 * @layer infra/utils
 * @description
 * Utilitaires pour manipuler et inspecter les erreurs Node liées aux errno.
 *
 * Responsabilités : prédicats type-safe pour détecter et narrowing des erreurs système.
 */

const ERRNO = { ENOENT: "ENOENT" } as const;
type ErrnoCode = (typeof ERRNO)[keyof typeof ERRNO];

/** Forme minimale d’une erreur Node contenant potentiellement un code. */
type NodeErr = { code?: unknown };

/** Forme narrow quand `code` est un errno string. */
type NodeErrnoError = { code: ErrnoCode };

/**
 * Extrait la propriété `code` d’une erreur Node si elle est une string.
 * Contrat : retourne `undefined` si non string ou valeur non objet.
 */
function nodeErrCode(e: unknown): string | undefined {
  if (!e || typeof e !== "object") return undefined;

  const code = (e as NodeErr).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Vérifie si une erreur correspond à un code errno donné.
 * Contrat : narrowing vers une erreur Node ayant `code`.
 */
function isErrno(e: unknown, code: ErrnoCode): e is NodeErrnoError {
  return nodeErrCode(e) === code;
}

/**
 * Prédicat spécialisé pour `ENOENT` (fichier ou dossier inexistant).
 * Contrat : utilisé pour gérer lecture ou suppression idempotente.
 */
export const isENOENT = (e: unknown): e is NodeErrnoError =>
  isErrno(e, ERRNO.ENOENT);
