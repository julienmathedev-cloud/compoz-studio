/**
 * @file packages/ui/src/lib/links/rich-text-link-resolver.test.ts
 * @layer ui/lib/links
 * @description Unit tests for Rich Text link resolution across site mounts.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveRichTextLink,
  type RichTextLinkContext,
} from "@compoz/ui/lib/links/rich-text-link-resolver";

const PUBLIC_CONTEXT: RichTextLinkContext = {
  currentPath: "/a-propos",
  internalBases: [
    {
      origin: "https://julienmathe.fr",
      mountBase: "/",
    },
  ],
};

const FALLBACK_CONTEXT: RichTextLinkContext = {
  currentPath: "/t/portfolio/offres/audit",
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
};

const DRAFT_CONTEXT: RichTextLinkContext = {
  currentPath: "/draft/a-propos",
  internalBases: PUBLIC_CONTEXT.internalBases,
};

const PREVIEW_CONTEXT: RichTextLinkContext = {
  currentPath: "/preview/pages/a-propos",
  internalBases: [],
};

function assertResolvedHref(args: {
  href: string;
  context: RichTextLinkContext;
  expected: string;
}): void {
  assert.deepEqual(resolveRichTextLink(args), {
    kind: "internal",
    href: args.expected,
  });
}

test("remounts root-relative Rich Text links for public, fallback, and draft routes", () => {
  assertResolvedHref({
    href: "/a-propos",
    context: PUBLIC_CONTEXT,
    expected: "/a-propos",
  });

  assertResolvedHref({
    href: "/a-propos",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/a-propos",
  });

  assertResolvedHref({
    href: "/a-propos",
    context: DRAFT_CONTEXT,
    expected: "/draft/a-propos",
  });
});

test("resolves relative Rich Text paths in the logical site path", () => {
  assertResolvedHref({
    href: "contact",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/offres/contact",
  });

  assertResolvedHref({
    href: "./contact",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/offres/contact",
  });

  assertResolvedHref({
    href: "../contact",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/contact",
  });

  assertResolvedHref({
    href: "documents/guide.pdf",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/offres/documents/guide.pdf",
  });

  assertResolvedHref({
    href: "../../../contact",
    context: {
      ...FALLBACK_CONTEXT,
      currentPath: "/t/portfolio/a-propos",
    },
    expected: "/t/portfolio/contact",
  });
});

test("keeps query, hash, mailto, and tel links native outside preview", () => {
  for (const href of [
    "?subject=audit",
    "#tarifs",
    "mailto:contact@example.com",
    "tel:+33123456789",
  ]) {
    assert.deepEqual(resolveRichTextLink({ href, context: FALLBACK_CONTEXT }), {
      kind: "native",
      href,
    });
  }
});

test("remounts absolute URLs that belong to the same logical website", () => {
  assertResolvedHref({
    href: "https://julienmathe.fr/realisations?source=footer#projets",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/realisations?source=footer#projets",
  });

  assertResolvedHref({
    href: "http://localhost:3000/t/portfolio/realisations",
    context: FALLBACK_CONTEXT,
    expected: "/t/portfolio/realisations",
  });

  assertResolvedHref({
    href: "https://julienmathe.fr/realisations",
    context: DRAFT_CONTEXT,
    expected: "/draft/realisations",
  });
});

test("keeps other tenants and HTTP(S) destinations external", () => {
  for (const href of [
    "http://localhost:3000/t/demo/realisations",
    "http://localhost:3000/t/portfolio-bis/realisations",
    "http://localhost:3000/admin",
    "https://site-externe.fr",
  ]) {
    assert.deepEqual(resolveRichTextLink({ href, context: FALLBACK_CONTEXT }), {
      kind: "external",
      href,
    });
  }
});

test("returns unsafe for invalid, unsupported, and dangerous destinations", () => {
  for (const href of [
    "",
    "ftp://example.com/file",
    "http:example.com",
    "//example.com/path",
    "\\\\example.com/path",
  ]) {
    assert.equal(
      resolveRichTextLink({ href, context: FALLBACK_CONTEXT }).kind,
      "unsafe",
      href,
    );
  }

  assert.deepEqual(
    resolveRichTextLink({
      href: "javascript:alert(1)",
      context: FALLBACK_CONTEXT,
    }),
    {
      kind: "unsafe",
      reason: "javascript",
    },
  );
});

test("keeps only hashes active in preview", () => {
  assert.deepEqual(
    resolveRichTextLink({
      href: "#section",
      context: PREVIEW_CONTEXT,
    }),
    {
      kind: "native",
      href: "#section",
    },
  );

  for (const href of [
    "/contact",
    "../contact",
    "?subject=audit",
    "mailto:contact@example.com",
    "tel:+33123456789",
    "https://site-externe.fr",
  ]) {
    assert.deepEqual(
      resolveRichTextLink({
        href,
        context: PREVIEW_CONTEXT,
      }),
      {
        kind: "disabled",
      },
      href,
    );
  }
});

test("preserves unsafe classification in preview", () => {
  assert.deepEqual(
    resolveRichTextLink({
      href: "javascript:alert(1)",
      context: PREVIEW_CONTEXT,
    }),
    {
      kind: "unsafe",
      reason: "javascript",
    },
  );
});
