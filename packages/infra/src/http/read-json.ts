/**
 * @file packages/infra/src/http/read-json.ts
 * @layer infra/http
 * @description Reads request JSON bodies and normalizes parse errors to HTTP 400.
 * @remarks
 * Structural and business validation belong to schemas and route handlers.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";

type JsonObject = Record<string, unknown>;

function throwJson400(message: string = EC.JSON_INVALID): never {
  throwHttp(400, {
    code: EC.VALIDATION_ERROR,
    message,
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonOr400(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throwJson400();
  }
}

export async function readJsonOptionalOrEmpty(
  req: Request,
): Promise<JsonObject> {
  const raw = await req.text();

  if (!raw.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throwJson400();
  }

  if (!isJsonObject(parsed)) {
    throwJson400(EC.JSON_OBJECT_EXPECTED);
  }

  return parsed;
}
