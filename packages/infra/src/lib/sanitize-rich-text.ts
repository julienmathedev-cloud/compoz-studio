/**
 * @file packages/infra/src/lib/sanitize-rich-text.ts
 * @layer infra/lib
 * @description Server-only HTML sanitizer for TipTap rich text content.
 * @remarks
 * Keeps a strict allowlist and persists neutral anchor markup. Final link
 * classification, mount resolution, and legacy normalization are applied by
 * the UI renderer from the active site link context.
 */

import "server-only";

import sanitizeHtml, { type Attributes, type IOptions } from "sanitize-html";

function sanitizeListVariant(attribs: Attributes): Attributes {
  const value = (attribs["data-list-variant"] ?? "").trim();

  if (value === "check" || value === "arrow" || value === "cross") {
    return { "data-list-variant": value };
  }

  return {};
}

/** Keeps unsupported network-path references out of persisted Rich Text HTML. */
function isUnsupportedNetworkPathReference(href: string): boolean {
  return /^[\\/]{2}/.test(href);
}

export const RICH_TEXT_SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "sup",
    "sub",
    "span",
  ],

  allowedAttributes: {
    a: ["href"],
    ul: ["data-list-variant"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    h5: ["style"],
    h6: ["style"],
    span: ["style"],
  },

  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,

  allowedStyles: {
    "*": {
      "text-align": [/^(left|center|right|justify)$/],
    },
  },

  transformTags: {
    ul: (_tagName: string, attribs: Attributes) => ({
      tagName: "ul",
      attribs: sanitizeListVariant(attribs),
    }),
    a: (_tagName: string, attribs: Attributes) => {
      const href = (attribs.href ?? "").trim();
      if (!href || isUnsupportedNetworkPathReference(href)) {
        return { tagName: "span", attribs: {} };
      }

      const nextAttrs: Attributes = { href };

      return { tagName: "a", attribs: nextAttrs };
    },
  },

  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
} as const satisfies IOptions;

export function sanitizeRichTextHtml(inputHtml: string): string {
  const html = (inputHtml ?? "").trim();
  if (!html) return "";
  return sanitizeHtml(html, RICH_TEXT_SANITIZE_OPTIONS);
}
