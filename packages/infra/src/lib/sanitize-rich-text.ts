/**
 * @file packages/infra/src/lib/sanitize-rich-text.ts
 * @layer infra/lib
 * @description
 * Fonctions utilitaires HTML (server-only) — sanitization allowlist TipTap.
 */

import "server-only";

import sanitizeHtml, { type Attributes, type IOptions } from "sanitize-html";

const RICH_TEXT_SANITIZE_OPTIONS: IOptions = {
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
    a: ["href", "target", "rel"],
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
    a: (_tagName, attribs) => {
      const href = (attribs.href ?? "").trim();
      if (!href) return { tagName: "span", attribs: {} as Attributes };

      const nextAttrs: Attributes = {
        href,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      };

      return { tagName: "a", attribs: nextAttrs };
    },
  },

  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
};

export function sanitizeRichTextHtml(inputHtml: string): string {
  const html = (inputHtml ?? "").trim();
  if (!html) return "";
  return sanitizeHtml(html, RICH_TEXT_SANITIZE_OPTIONS);
}
