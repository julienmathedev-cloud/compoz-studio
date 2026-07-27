/**
 * @file packages/ui/src/lib/links/helpers.test.ts
 * @layer ui/lib/links
 * @description Unit tests for shared link safety, path, and mount primitives.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  isActiveLink,
  normalizePath,
  resolveInternalHref,
  resolveLinkFlags,
  resolveSiteMountBase,
  shouldDisableLinksInPreview,
  slugifyPath,
  type UnsafeReason,
} from "@compoz/ui/lib/links/helpers";

function assertUnsafe(href: string, expectedReason: UnsafeReason): void {
  const flags = resolveLinkFlags(href);

  assert.equal(flags.unsafe, true, href);
  assert.equal(flags.unsafeReason, expectedReason, href);
}

test("slugifies paths", () => {
  assert.equal(slugifyPath(" À propos de l’équipe "), "a-propos-de-l-equipe");
  assert.equal(slugifyPath("Déjà-vu__2026"), "deja-vu-2026");
});

test("normalizes paths and compares active links", () => {
  assert.equal(normalizePath("a-propos/"), "/a-propos");
  assert.equal(normalizePath("/a-propos/?source=menu"), "/a-propos");

  assert.equal(isActiveLink("/offres/audit", "/offres", "startsWith"), true);
  assert.equal(isActiveLink("/offres-audit", "/offres", "startsWith"), false);
  assert.equal(isActiveLink("/offres", "/offres", "exact"), true);
  assert.equal(isActiveLink("/offres/audit", "/offres", "exact"), false);
});

test("classifies supported HTTP(S) and native protocols", () => {
  assert.deepEqual(resolveLinkFlags("https://example.com/path"), {
    rawExternal: true,
    special: false,
    external: true,
    unsafe: false,
    unsafeReason: undefined,
  });

  assert.deepEqual(resolveLinkFlags("http://example.com/path"), {
    rawExternal: true,
    special: false,
    external: true,
    unsafe: false,
    unsafeReason: undefined,
  });

  assert.deepEqual(resolveLinkFlags("mailto:contact@example.com"), {
    rawExternal: true,
    special: true,
    external: false,
    unsafe: false,
    unsafeReason: undefined,
  });

  assert.deepEqual(resolveLinkFlags("tel:+33123456789"), {
    rawExternal: true,
    special: true,
    external: false,
    unsafe: false,
    unsafeReason: undefined,
  });
});

test("classifies ordinary internal hrefs as safe and non-external", () => {
  for (const href of [
    "/contact",
    "./contact",
    "../contact",
    "contact",
    "documents/guide.pdf",
    "?subject=audit",
    "#tarifs",
  ]) {
    assert.deepEqual(
      resolveLinkFlags(href),
      {
        rawExternal: false,
        special: false,
        external: false,
        unsafe: false,
        unsafeReason: undefined,
      },
      href,
    );
  }
});

test("rejects explicit dangerous protocols", () => {
  assertUnsafe("javascript:alert(1)", "javascript");
  assertUnsafe("vbscript:msgbox(1)", "vbscript");
  assertUnsafe("data:text/html,test", "data");
  assertUnsafe("file:///tmp/test", "file");
  assertUnsafe("about:blank", "about");
  assertUnsafe("chrome://settings", "chrome");
});

test("rejects obfuscated and encoded dangerous protocols", () => {
  /*
   * Whitespace and controls are removed only for negative safety detection.
   * They must never make a malformed protocol eligible as a supported link.
   */
  assertUnsafe("java\nscript:alert(1)", "javascript");
  assertUnsafe("java\u0000script:alert(1)", "javascript");
  assertUnsafe("javascript%3aalert(1)", "encoded");
  assertUnsafe("javascript&#58;alert(1)", "encoded");
});

test("rejects unsupported explicit protocols", () => {
  assertUnsafe("ftp://example.com/file", "unknown-protocol");
  assertUnsafe("custom:action", "unknown-protocol");
});

test("rejects malformed HTTP(S) URLs", () => {
  for (const href of [
    "http:example.com",
    "https:example.com",
    "https:/example.com",
    "http:///example.com",
    "https://%",
    "https://[::1",
    "https://example.com\\path",
  ]) {
    assertUnsafe(href, "invalid-http-url");
  }
});

test("rejects malformed protocol candidates", () => {
  for (const href of [
    "https ://example.com",
    "mailto :contact@example.com",
    "tel :+33123456789",
    "mailto\u0000:contact@example.com",
    "https\u0000://example.com",
  ]) {
    assertUnsafe(href, "invalid-protocol");
  }
});

test("rejects unsupported network path references", () => {
  for (const href of [
    "//example.com/path",
    "\\\\example.com/path",
    "/\\example.com/path",
    "\\/example.com/path",
  ]) {
    assertUnsafe(href, "unsupported-network-reference");
  }
});

test("resolves preview, draft, fallback, and hosted mount bases", () => {
  assert.equal(resolveSiteMountBase("/preview/pages/a-propos"), "/preview");
  assert.equal(resolveSiteMountBase("/draft/a-propos"), "/draft");
  assert.equal(
    resolveSiteMountBase("/t/portfolio/offres/audit"),
    "/t/portfolio",
  );
  assert.equal(resolveSiteMountBase("/a-propos"), "/");

  assert.equal(shouldDisableLinksInPreview("/preview/pages/a-propos"), true);
  assert.equal(shouldDisableLinksInPreview("/preview"), true);
  assert.equal(shouldDisableLinksInPreview("/preview-test"), false);
  assert.equal(shouldDisableLinksInPreview("/draft/a-propos"), false);
});

test("remounts root-relative internal hrefs", () => {
  assert.equal(
    resolveInternalHref(
      "/t/portfolio/offres/audit",
      "/a-propos?source=menu#team",
    ),
    "/t/portfolio/a-propos?source=menu#team",
  );

  assert.equal(
    resolveInternalHref("/draft/a-propos", "/realisations"),
    "/draft/realisations",
  );

  assert.equal(
    resolveInternalHref("/a-propos", "/realisations"),
    "/realisations",
  );
});

test("does not double-prefix an already mounted internal href", () => {
  assert.equal(
    resolveInternalHref("/t/portfolio/offres/audit", "/t/portfolio/a-propos"),
    "/t/portfolio/a-propos",
  );

  assert.equal(
    resolveInternalHref("/draft/a-propos", "/draft/realisations"),
    "/draft/realisations",
  );
});

test("does not transform external, unsafe, or non-root-relative hrefs", () => {
  assert.equal(
    resolveInternalHref("/draft/a-propos", "https://example.com"),
    "https://example.com",
  );

  assert.equal(
    resolveInternalHref("/draft/a-propos", "//example.com"),
    "//example.com",
  );

  assert.equal(
    resolveInternalHref("/draft/a-propos", "javascript:alert(1)"),
    "javascript:alert(1)",
  );

  assert.equal(
    resolveInternalHref("/draft/a-propos", "../contact"),
    "../contact",
  );
});
