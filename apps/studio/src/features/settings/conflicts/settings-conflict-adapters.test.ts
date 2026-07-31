/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-adapters.test.ts
 * @layer studio/features/settings/conflicts
 * @description Regression tests for all eight Settings OCC presentation adapters.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  footerConflictAdapter,
  headerConflictAdapter,
  identityConflictAdapter,
  legalMenuConflictAdapter,
  primaryMenuConflictAdapter,
  seoConflictAdapter,
  socialConflictAdapter,
  themeConflictAdapter,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-adapters";

const t = (key: string, values?: Record<string, string | number | Date>) =>
  values ? `${key}:${Object.values(values).join(":")}` : key;

void test("defines explicit field contracts for every Settings section", () => {
  assert.deepEqual(Object.keys(identityConflictAdapter(t).labels), ["siteName", "tagline", "logo", "faviconUrl", "faviconMediaAssetId"]);
  assert.deepEqual(Object.keys(headerConflictAdapter(t).labels), ["showLogo", "showSiteName", "sticky", "blur", "swapPrimaryAndSocial"]);
  assert.deepEqual(Object.keys(footerConflictAdapter(t).labels), ["copyright", "showYear"]);
  assert.deepEqual(Object.keys(seoConflictAdapter(t).labels), ["baseUrl", "defaultTitle", "defaultDescription", "titleTemplate", "canonicalUrl", "robots", "structuredData", "openGraph", "twitter"]);
  assert.deepEqual(Object.keys(themeConflictAdapter(t).labels), ["enableDarkMode", "mode", "fontFamily", "headingFont", "revealPreset", "lightTokens", "darkTokens"]);
  assert.deepEqual(Object.keys(socialConflictAdapter(t).labels), ["items"]);
  assert.deepEqual(Object.keys(primaryMenuConflictAdapter(t).labels), ["items"]);
  assert.deepEqual(Object.keys(legalMenuConflictAdapter(t).labels), ["items"]);
  assert.deepEqual(headerConflictAdapter(t).display("sticky", true), { kind: "boolean", text: "studio.settingsConflict.values.boolean.true" });
  assert.deepEqual(footerConflictAdapter(t).display("copyright", "Compoz"), { kind: "text", text: "Compoz" });
});

void test("summarizes list additions, removals, modifications, and order by business labels", () => {
  const details = socialConflictAdapter(t).details?.(
    "items",
    [{ id: "private-a", kind: "website", href: "https://a.example" }],
    [{ id: "private-b", kind: "linkedin", href: "https://b.example" }],
    [{ id: "private-a", kind: "website", href: "https://local.example" }],
  ) ?? [];
  assert.ok(details.some((detail) => detail.id === "server-added"));
  assert.ok(details.some((detail) => detail.id === "server-removed"));
  assert.ok(details.some((detail) => detail.id === "local-modified"));
  assert.doesNotMatch(JSON.stringify(details), /private-a|private-b/);
});

void test("detects primary-menu child changes and parent moves without exposing IDs", () => {
  const baseline = [{ id: "parent-a", label: "A", href: "", newTab: false, children: [{ id: "child", label: "Child", href: "/child", newTab: false }] }, { id: "parent-b", label: "B", href: "/b", newTab: false, children: [] }];
  const current = [{ ...baseline[0]!, children: [] }, { ...baseline[1]!, children: [baseline[0]!.children[0]!] }];
  const details = primaryMenuConflictAdapter(t).details?.("items", baseline, current, baseline) ?? [];
  assert.ok(details.some((detail) => detail.id === "server-modified"));
  assert.doesNotMatch(JSON.stringify(details), /parent-a|parent-b|"child"/);
});

void test("identity logo previews distinguish source, dimensions, alt text, and media type", () => {
  const display = identityConflictAdapter(t).display;
  const first = display("logo", { src: "https://cdn.example/a/logo.svg?token=private", alt: "Brand", width: 120, height: 40 });
  const second = display("logo", { src: "https://cdn.example/b/logo.png", alt: "Brand", width: 240, height: 80 });
  assert.notDeepEqual(first, second);
  assert.match(JSON.stringify(first), /logo\.svg|120|40|SVG/);
  assert.match(JSON.stringify(second), /logo\.png|240|80|PNG/);
  assert.doesNotMatch(JSON.stringify(first), /cdn\.example|token=private/);
  assert.doesNotMatch(JSON.stringify(identityConflictAdapter(t).display("faviconMediaAssetId", "private-media-id")), /private-media-id/);
});

void test("SEO composite previews remain discriminating without JSON", () => {
  const display = seoConflictAdapter(t).display;
  const openGraphA = { title: "A", description: "Description", defaultImageUrl: "/a.jpg", imageAlt: "Image" };
  const openGraphB = { ...openGraphA, title: "B", defaultImageUrl: "/b.jpg" };
  assert.notDeepEqual(display("openGraph", openGraphA), display("openGraph", openGraphB));
  assert.notDeepEqual(
    display("twitter", { card: "summary", site: "@site", creator: "@one" }),
    display("twitter", { card: "summary_large_image", site: "@site", creator: "@two" }),
  );
  const structuredBase = {
    enabled: true,
    entityType: "organization" as const,
    name: "Company",
    description: "Description",
    telephone: "",
    email: "",
    address: { streetAddress: "", postalCode: "", addressLocality: "Paris", addressRegion: "", addressCountry: "FR" },
    areaServed: ["Paris"],
    priceRange: "",
    openingHours: [],
  };
  assert.notDeepEqual(display("structuredData", structuredBase), display("structuredData", { ...structuredBase, entityType: "person", name: "Person" }));
  assert.notDeepEqual(display("robots", "index,follow"), display("robots", "noindex,nofollow"));
  assert.doesNotMatch(JSON.stringify([display("openGraph", openGraphA), display("structuredData", structuredBase)]), /\{\\"/u);
});

void test("social and menu details expose changed business fields and order without IDs", () => {
  const social = socialConflictAdapter(t).details?.(
    "items",
    [{ id: "social-private", kind: "website", href: "https://before.example" }],
    [{ id: "social-private", kind: "website", href: "https://after.example" }, { id: "social-added", kind: "linkedin", href: "https://linkedin.example" }],
    [{ id: "social-private", kind: "website", href: "https://before.example" }],
  ) ?? [];
  assert.match(JSON.stringify(social), /before\.example|after\.example|linkedin\.example/);
  assert.doesNotMatch(JSON.stringify(social), /social-private|social-added/);

  const baseline = [{ id: "menu-a", label: "Before", href: "/before", newTab: false }, { id: "menu-b", label: "Second", href: "/second", newTab: false }];
  const current = [{ id: "menu-b", label: "Second", href: "/second", newTab: false }, { id: "menu-a", label: "After", href: "/after", newTab: true }];
  const menu = legalMenuConflictAdapter(t).details?.("items", baseline, current, baseline) ?? [];
  const serialized = JSON.stringify(menu);
  assert.match(serialized, /Before|After|\/before|\/after/);
  assert.match(serialized, /settingsConflict\.list\.serverOrder/);
  assert.doesNotMatch(serialized, /menu-a|menu-b/);
});

void test("theme token previews enumerate the actual translated tokens", () => {
  const tokens = {
    background: "#ffffff", foreground: "#111111", chrome: "#eeeeee", card: "#ffffff", "card-foreground": "#111111",
    popover: "#ffffff", "popover-foreground": "#111111", primary: "#ff0000", "primary-foreground": "#ffffff",
    secondary: "#eeeeee", "secondary-foreground": "#111111", muted: "#dddddd", "muted-foreground": "#555555",
    accent: "#00ff00", "accent-foreground": "#111111", destructive: "#cc0000", "destructive-foreground": "#ffffff",
    border: "#cccccc", input: "#bbbbbb", ring: "#ff0000",
  };
  const changed = { ...tokens, primary: "#0000ff", background: "#000000", foreground: "#ffffff", border: "#333333" };
  const display = themeConflictAdapter(t).display;
  assert.notDeepEqual(display("lightTokens", tokens), display("lightTokens", changed));
  assert.match(JSON.stringify(display("lightTokens", changed)), /primary|#0000ff|background|#000000|foreground|#ffffff|border|#333333/);
});
