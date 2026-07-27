/**
 * @file packages/ui/src/lib/rich-text-links.test.ts
 * @layer ui/lib
 * @description Unit tests for final Rich Text anchor normalization.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRichTextLinksHtml } from "@compoz/ui/lib/rich-text-links";

const FALLBACK_CONTEXT = {
  currentPath: "/t/portfolio/a-propos",
  internalBases: [
    {
      origin: "http://localhost:3000",
      mountBase: "/t/portfolio",
    },
    {
      origin: "https://julienmathe.fr",
      mountBase: "/",
    },
  ],
} as const;

const PREVIEW_CONTEXT = {
  currentPath: "/preview/pages/a-propos",
  internalBases: [],
} as const;

test("normalizes legacy attributes and applies final link attributes", () => {
  const html = normalizeRichTextLinksHtml({
    html: [
      '<a href="/realisations" target="_blank" rel="noopener noreferrer nofollow">Réalisations</a>',
      '<a href="https://site-externe.fr" rel="nofollow">Externe</a>',
      '<a href="mailto:contact@example.com" target="_blank">Email</a>',
      '<a href="javascript:alert(1)">Unsafe</a>',
    ].join(""),
    context: FALLBACK_CONTEXT,
  });

  assert.equal(
    html,
    [
      '<a href="/t/portfolio/realisations">Réalisations</a>',
      '<a href="https://site-externe.fr" target="_blank" rel="noopener noreferrer">Externe</a>',
      '<a href="mailto:contact@example.com">Email</a>',
      '<a aria-disabled="true" data-disabled="true" tabindex="-1">Unsafe</a>',
    ].join(""),
  );
});

test("remounts absolute and relative internal hrefs", () => {
  const html = normalizeRichTextLinksHtml({
    html: [
      '<a href="https://julienmathe.fr/realisations?source=footer#projects">Absolu</a>',
      '<a href="../contact">Relatif</a>',
    ].join(""),
    context: FALLBACK_CONTEXT,
  });

  assert.equal(
    html,
    [
      '<a href="/t/portfolio/realisations?source=footer#projects">Absolu</a>',
      '<a href="/t/portfolio/contact">Relatif</a>',
    ].join(""),
  );
});

test("decodes and re-escapes HTML entities in href attributes", () => {
  const html = normalizeRichTextLinksHtml({
    html: '<a href="/contact?subject=audit&amp;source=site">Contact</a>',
    context: FALLBACK_CONTEXT,
  });

  assert.equal(
    html,
    '<a href="/t/portfolio/contact?subject=audit&amp;source=site">Contact</a>',
  );
});

test("supports quoted and unquoted href syntax", () => {
  const html = normalizeRichTextLinksHtml({
    html: [
      "<a href='/contact'>Simple quote</a>",
      "<a href=/realisations>Unquoted</a>",
    ].join(""),
    context: FALLBACK_CONTEXT,
  });

  assert.equal(
    html,
    [
      '<a href="/t/portfolio/contact">Simple quote</a>',
      '<a href="/t/portfolio/realisations">Unquoted</a>',
    ].join(""),
  );
});

test("removes legacy anchor attributes when href is absent", () => {
  const html = normalizeRichTextLinksHtml({
    html: '<a title="Legacy" rel="nofollow">Texte</a>',
    context: FALLBACK_CONTEXT,
  });

  assert.equal(html, "<a>Texte</a>");
});

test("disables every non-hash anchor in preview", () => {
  const html = normalizeRichTextLinksHtml({
    html: [
      '<a href="/a-propos">Page</a>',
      '<a href="../contact">Relative</a>',
      '<a href="?subject=audit">Query</a>',
      '<a href="mailto:contact@example.com">Email</a>',
      '<a href="tel:+33123456789">Phone</a>',
      '<a href="https://site-externe.fr">External</a>',
      '<a href="#section">Section</a>',
    ].join(""),
    context: PREVIEW_CONTEXT,
  });

  const disabledAnchor =
    '<a aria-disabled="true" data-disabled="true" tabindex="-1">';

  assert.equal(
    html,
    [
      `${disabledAnchor}Page</a>`,
      `${disabledAnchor}Relative</a>`,
      `${disabledAnchor}Query</a>`,
      `${disabledAnchor}Email</a>`,
      `${disabledAnchor}Phone</a>`,
      `${disabledAnchor}External</a>`,
      '<a href="#section">Section</a>',
    ].join(""),
  );
});

test("neutralizes malformed and unsupported historical hrefs", () => {
  const html = normalizeRichTextLinksHtml({
    html: [
      '<a href="http:example.com">Malformed</a>',
      '<a href="//example.com">Unsupported</a>',
    ].join(""),
    context: FALLBACK_CONTEXT,
  });

  assert.equal(
    html,
    [
      '<a aria-disabled="true" data-disabled="true" tabindex="-1">Malformed</a>',
      '<a aria-disabled="true" data-disabled="true" tabindex="-1">Unsupported</a>',
    ].join(""),
  );
});
