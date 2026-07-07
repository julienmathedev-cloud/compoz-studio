/**
 * @file packages/infra/src/lib/errors.ts
 * @layer infra/lib
 * @description Node errno inspection helpers for infra code.
 */

const ERRNO = { ENOENT: "ENOENT" } as const;
type ErrnoCode = (typeof ERRNO)[keyof typeof ERRNO];

type NodeErr = { code?: unknown };

type NodeErrnoError = { code: ErrnoCode };

function nodeErrCode(e: unknown): string | undefined {
  if (!e || typeof e !== "object") return undefined;

  const code = (e as NodeErr).code;
  return typeof code === "string" ? code : undefined;
}

function isErrno(e: unknown, code: ErrnoCode): e is NodeErrnoError {
  return nodeErrCode(e) === code;
}

export const isENOENT = (e: unknown): e is NodeErrnoError =>
  isErrno(e, ERRNO.ENOENT);
