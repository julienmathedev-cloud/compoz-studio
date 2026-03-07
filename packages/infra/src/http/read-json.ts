/**
 * @file packages/infra/src/http/read-json.ts
 * @layer infra/http
 * @description
 * Helpers pour lire (et valider minimalement) le JSON des requêtes HTTP (App Router).
 * Les erreurs de parsing sont normalisées en 400 via `throwHttp` et gérées par `handleRoute`.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";

/**
 * Représentation minimale d’un objet JSON.
 * Utilisé pour les PATCH partiels où l’on attend un record clé → valeur.
 */
type JsonObject = Record<string, unknown>;

function throwJson400(message: string = EC.JSON_INVALID): never {
  throwHttp(400, {
    code: EC.VALIDATION_ERROR,
    message,
  });
}

/**
 * Vérifie qu'une valeur parsée est un objet JSON (record) et non :
 * - `null`
 * - un tableau
 * - un scalaire (string/number/boolean)
 */
function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Lit le body JSON d'une requête.
 *
 * @remarks
 * Cette fonction valide uniquement que le body est un JSON valide.
 * La validation métier/structurelle doit être faite ensuite (ex: Zod).
 *
 * @throws HttpError 400 si le JSON est invalide.
 */
export async function readJsonOr400(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throwJson400();
  }
}

/**
 * Variante de `readJsonOr400` qui autorise un body vide.
 *
 * - Si le body est vide → `{}`.
 * - Si du texte est présent → tentative de parse JSON.
 * - Si le JSON est valide mais n’est pas un objet → 400 (contrat PATCH).
 *
 * @throws HttpError 400 si du JSON est fourni mais invalide, ou non-objet.
 */
export async function readJsonOptionalOrEmpty(
  req: Request,
): Promise<JsonObject> {
  const raw = await req.text();

  // Body vide → objet vide pour éviter les checks répétitifs dans les handlers.
  if (!raw.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throwJson400();
  }

  // Contrat : pour un PATCH partiel, on attend un objet JSON.
  if (!isJsonObject(parsed)) {
    throwJson400(EC.JSON_OBJECT_EXPECTED);
  }

  return parsed;
}
