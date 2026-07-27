/**
 * @file packages/ui/src/lib/rich-text-links.ts
 * @layer ui/lib
 * @description Normalizes Rich Text anchors at render time.
 * @remarks
 * This intentionally has no browser dependency so public, draft, and preview SSR
 * normalize both new and already persisted HTML through the shared link helpers.
 */

import {
  resolveRichTextLink,
  type RichTextLinkContext,
} from "@compoz/ui/lib/links/rich-text-link-resolver";

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_match, entity: string) => {
      const codePoint = entity.toLowerCase().startsWith("x")
        ? Number.parseInt(entity.slice(1), 16)
        : Number.parseInt(entity, 10);

      const isValidCodePoint =
        Number.isInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff &&
        (codePoint < 0xd800 || codePoint > 0xdfff);

      return isValidCodePoint ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractHref(attributes: string): string | null {
  const match =
    /(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(
      attributes,
    );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

/**
 * Rewrites anchor attributes while retaining the already sanitized Rich Text
 * markup. Only `href`, and the externally required `target` and `rel`, survive.
 */
export function normalizeRichTextLinksHtml(args: {
  html: string;
  context: RichTextLinkContext;
}): string {
  return args.html.replace(/<a\b([^>]*)>/gi, (_anchor, attributes: string) => {
    const rawHref = extractHref(attributes);

    if (rawHref === null) {
      return "<a>";
    }

    const href = decodeHtmlAttribute(rawHref).trim();

    const resolved = resolveRichTextLink({
      href,
      context: args.context,
    });

    if (resolved.kind === "unsafe" || resolved.kind === "disabled") {
      return '<a aria-disabled="true" data-disabled="true" tabindex="-1">';
    }

    const safeHref = escapeHtmlAttribute(resolved.href);

    return resolved.kind === "external"
      ? `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`
      : `<a href="${safeHref}">`;
  });
}
