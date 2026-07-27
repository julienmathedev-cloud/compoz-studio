/**
 * @file packages/infra/src/lib/sanitize-rich-text.test.ts
 * @layer infra/lib
 * @description Unit tests for Rich Text HTML sanitization.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeRichTextHtml } from "@compoz/infra/lib/sanitize-rich-text";

test("persists only neutral anchor attributes", () => {
  assert.equal(
    sanitizeRichTextHtml(
      [
        '<a href="/contact"',
        ' target="_blank"',
        ' rel="noopener noreferrer nofollow"',
        ' title="Legacy"',
        ' data-external="true">',
        "Contact",
        "</a>",
      ].join(""),
    ),
    '<a href="/contact">Contact</a>',
  );
});

test("keeps supported internal and relative hrefs", () => {
  assert.equal(
    sanitizeRichTextHtml(
      [
        '<a href="/contact">Root</a>',
        '<a href="./contact">Current</a>',
        '<a href="../contact">Parent</a>',
        '<a href="documents/guide.pdf">Document</a>',
        '<a href="?subject=audit">Query</a>',
        '<a href="#tarifs">Hash</a>',
      ].join(""),
    ),
    [
      '<a href="/contact">Root</a>',
      '<a href="./contact">Current</a>',
      '<a href="../contact">Parent</a>',
      '<a href="documents/guide.pdf">Document</a>',
      '<a href="?subject=audit">Query</a>',
      '<a href="#tarifs">Hash</a>',
    ].join(""),
  );
});

test("keeps supported HTTP(S), mailto, and tel links", () => {
  assert.equal(
    sanitizeRichTextHtml(
      [
        '<a href="https://example.com/path">HTTPS</a>',
        '<a href="http://example.com/path">HTTP</a>',
        '<a href="mailto:contact@example.com">Email</a>',
        '<a href="tel:+33123456789">Phone</a>',
      ].join(""),
    ),
    [
      '<a href="https://example.com/path">HTTPS</a>',
      '<a href="http://example.com/path">HTTP</a>',
      '<a href="mailto:contact@example.com">Email</a>',
      '<a href="tel:+33123456789">Phone</a>',
    ].join(""),
  );
});

test("removes unsupported protocol-relative and backslash network references", () => {
  assert.equal(
    sanitizeRichTextHtml(
      [
        '<a href="//example.com/path">Protocol-relative</a>',
        '<a href="\\\\example.com/path">Backslash</a>',
        '<a href="/\\example.com/path">Mixed</a>',
      ].join(""),
    ),
    [
      "<span>Protocol-relative</span>",
      "<span>Backslash</span>",
      "<span>Mixed</span>",
    ].join(""),
  );
});

test("removes dangerous hrefs while preserving anchor content", () => {
  const html = sanitizeRichTextHtml(
    [
      '<a href="javascript:alert(1)">JavaScript</a>',
      '<a href="data:text/html,test">Data</a>',
      '<a href="vbscript:msgbox(1)">VBScript</a>',
    ].join(""),
  );

  assert.equal(html.includes("javascript:"), false);
  assert.equal(html.includes("data:"), false);
  assert.equal(html.includes("vbscript:"), false);

  assert.equal(html.includes("JavaScript"), true);
  assert.equal(html.includes("Data"), true);
  assert.equal(html.includes("VBScript"), true);
});

test("turns anchors without a usable href into neutral spans", () => {
  assert.equal(
    sanitizeRichTextHtml('<a href="">Empty</a><a target="_blank">Missing</a>'),
    "<span>Empty</span><span>Missing</span>",
  );
});

test("preserves empty input behavior", () => {
  assert.equal(sanitizeRichTextHtml(""), "");
  assert.equal(sanitizeRichTextHtml("   "), "");
});
