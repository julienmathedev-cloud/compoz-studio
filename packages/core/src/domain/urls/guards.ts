/**
 * @file packages/core/src/domain/urls/guards.ts
 * @layer core/domain/urls
 * @description Guards bas niveau (email simple, URL relative, URL http(s)).
 */

const SIMPLE_EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isSimpleEmail(input: unknown): input is string {
  return typeof input === "string" && SIMPLE_EMAIL_RE.test(input);
}

const RELATIVE_URL_RE = /^(?:\/(?!\/))[\w\-./~%?#=&+]*$/;

export function isRelativeUrl(input: unknown): boolean {
  return typeof input === "string" && RELATIVE_URL_RE.test(input);
}

export function isAbsoluteHttpUrlStrict(input: unknown): boolean {
  if (typeof input !== "string") return false;
  try {
    const u = new URL(input);
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
  } catch {
    return false;
  }
}

export function isAbsoluteHttpProtocol(proto: string): boolean {
  return proto === "http:" || proto === "https:";
}
