/**
 * @file packages/core/src/domain/urls/mailto.ts
 * @layer core/domain/urls
 * @description Mailto parsing and validation helpers.
 * @remarks
 * Product policy currently allows `mailto:` links without recipients, as permitted by RFC 6068.
 */

import { isSimpleEmail } from "@compoz/core/domain/urls/guards";

/** Product policy switch for requiring at least one mailto recipient. */
const REQUIRE_MAILTO_RECIPIENT = false as const;

export type ParsedMailto = {
  recipients: string[];
  params: URLSearchParams;
};

function tryDecode(value: string): string {
  if (!value || !value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseMailto(href: string): ParsedMailto | null {
  const input = (href ?? "").trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    if (url.protocol.toLowerCase() !== "mailto:") return null;

    const raw = url.pathname ? tryDecode(url.pathname) : "";

    const recipients = raw
      ? raw
          .split(/[;,]/g)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      : [];

    for (const r of recipients) {
      if (!isSimpleEmail(r)) return null;
    }

    if (REQUIRE_MAILTO_RECIPIENT && recipients.length === 0) return null;

    return {
      recipients,
      params: url.searchParams,
    };
  } catch {
    return null;
  }
}

export function isMailtoHref(href?: string | null): boolean {
  return typeof href === "string" && parseMailto(href) !== null;
}
