/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-adapters.ts
 * @layer studio/features/settings/conflicts
 * @description Explicit field labels and readable value formatters for all revisioned Settings sections.
 */

import type { ConflictDisplayValue, ConflictPresentationItem } from "@compoz/studio/features/conflicts/conflict-presentation";
import type { ConflictPresentationDetail } from "@compoz/studio/features/conflicts/conflict-presentation";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import type {
  SettingsConflictFieldStrategy,
  SettingsConflictPresentationAdapter,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";
import {
  analyzeSettingsListResolution,
  type SettingsListChange,
  type SettingsListDefinition,
  type SettingsListNode,
} from "@compoz/studio/features/settings/conflicts/settings-list-resolution";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";
import type { LegalMenuFormValues, LegalMenuItemFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import type { PrimaryMenuChildFormValues, PrimaryMenuFormValues, PrimaryMenuItemFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";
import type { SocialFormValues, SocialItemFormValues } from "@compoz/validation/site/settings/social/social-form";
import type { ThemeFormValues } from "@compoz/validation/site/settings/theme/theme-form";
import { THEME_FONTS } from "@compoz/core/constants/theme/theme-fonts";

type T = (key: string, values?: Record<string, string | number | Date>) => string;
type UnknownRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectName(value: UnknownRecord): string | null {
  for (const key of ["label", "title", "name", "alt"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function displayValue(value: unknown, t: T): ConflictDisplayValue {
  if (value === null || value === undefined || value === "") {
    return { kind: "empty", text: t("studio.settingsConflict.values.empty") };
  }
  if (typeof value === "boolean") {
    return { kind: "boolean", text: t(`studio.settingsConflict.values.boolean.${value ? "true" : "false"}`) };
  }
  if (typeof value === "string" || typeof value === "number") {
    return { kind: "text", text: String(value) };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "empty", text: t("studio.settingsConflict.values.emptyList") };
    return {
      kind: "list",
      items: value.map((item, index) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (isRecord(item)) return objectName(item) ?? t("studio.settingsConflict.values.item", { position: index + 1 });
        return t("studio.settingsConflict.values.item", { position: index + 1 });
      }),
    };
  }
  if (isRecord(value)) {
    const name = objectName(value);
    if (name) return { kind: "text", text: name };
    const configured = Object.values(value).filter((entry) => entry !== null && entry !== undefined && entry !== "").length;
    return { kind: "text", text: t("studio.settingsConflict.values.configuration", { count: configured }) };
  }
  return { kind: "text", text: t("studio.settingsConflict.values.configurationChanged") };
}

function readableSource(value: string): string {
  const withoutQuery = value.split(/[?#]/u, 1)[0] ?? value;
  const name = withoutQuery.split("/").filter(Boolean).at(-1) ?? withoutQuery;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function mediaTypeFromSource(value: string, t: T): string {
  const extension = readableSource(value).split(".").at(-1)?.toUpperCase();
  return extension && extension.length <= 5
    ? extension
    : t("studio.logoFields.mediaTypeUnknown");
}

function displayLogo(value: IdentityFormValues["logo"], t: T): ConflictDisplayValue {
  if (!value) return displayValue(value, t);
  return {
    kind: "list",
    items: [
      `${t("studio.logoFields.source")}: ${readableSource(value.src)}`,
      `${t("studio.logoFields.alt.label")}: ${value.alt}`,
      `${t("studio.logoFields.dimensions")}: ${value.width} × ${value.height}`,
      `${t("studio.logoFields.mediaType")}: ${mediaTypeFromSource(value.src, t)}`,
    ],
  };
}

function displayOpenGraph(value: SeoFormValues["openGraph"], t: T): ConflictDisplayValue {
  return {
    kind: "list",
    items: [
      `${t("studio.seoForm.openGraph.title.label")}: ${value.title || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.openGraph.description.label")}: ${value.description || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.openGraph.defaultImageUrl.label")}: ${value.defaultImageUrl ? readableSource(value.defaultImageUrl) : t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.openGraph.imageAlt.label")}: ${value.imageAlt || t("studio.settingsConflict.values.empty")}`,
    ],
  };
}

function displayTwitter(value: SeoFormValues["twitter"], t: T): ConflictDisplayValue {
  return {
    kind: "list",
    items: [
      `${t("studio.seoForm.twitter.card.label")}: ${t(`studio.seoForm.twitter.card.options.${value.card}`)}`,
      `${t("studio.seoForm.twitter.site.label")}: ${value.site || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.twitter.creator.label")}: ${value.creator || t("studio.settingsConflict.values.empty")}`,
    ],
  };
}

function displayStructuredData(value: SeoFormValues["structuredData"], t: T): ConflictDisplayValue {
  const address = [value.address.streetAddress, value.address.postalCode, value.address.addressLocality, value.address.addressRegion, value.address.addressCountry].filter(Boolean).join(", ");
  return {
    kind: "list",
    items: [
      `${t("studio.seoForm.indexing.structuredData.label")}: ${t(`studio.settingsConflict.values.boolean.${value.enabled ? "true" : "false"}`)}`,
      `${t("studio.seoForm.indexing.structuredData.entityType.label")}: ${t(`studio.seoForm.indexing.structuredData.entityType.options.${value.entityType}`)}`,
      `${t("studio.seoForm.indexing.structuredData.name.label")}: ${value.name || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.indexing.structuredData.description.label")}: ${value.description || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.settingsConflict.values.address")}: ${address || t("studio.settingsConflict.values.empty")}`,
      `${t("studio.seoForm.indexing.structuredData.areaServed.label")}: ${value.areaServed.join(", ") || t("studio.settingsConflict.values.empty")}`,
    ],
  };
}

function displayRobots(value: string, t: T): ConflictDisplayValue {
  if (!value.trim()) return displayValue(value, t);
  return {
    kind: "list",
    items: value.split(",").map((directive) => directive.trim().toLowerCase()).filter(Boolean).map((directive) => {
      const known = new Set(["index", "noindex", "follow", "nofollow"]);
      return known.has(directive)
        ? t(`studio.seoForm.indexing.robots.options.${directive}`)
        : directive;
    }),
  };
}

function adapter<TValues extends object>(labels: Readonly<Record<keyof TValues, string>>, t: T): SettingsConflictPresentationAdapter<TValues> {
  return { labels, display: (_key, value) => displayValue(value, t) };
}

type IdentifiedValue = UnknownRecord & Readonly<{ id: string }>;

function identifiedValues(value: unknown): readonly IdentifiedValue[] {
  return Array.isArray(value)
    ? value.filter((item): item is IdentifiedValue => isRecord(item) && typeof item["id"] === "string")
    : [];
}

type IdentifiedDescriptor = Readonly<{
  describe: (item: IdentifiedValue, index: number) => string;
  describeChange: (initial: IdentifiedValue, next: IdentifiedValue, initialIndex: number, nextIndex: number) => string;
}>;

function listChangeDetails(baselineValue: unknown, serverValue: unknown, localValue: unknown, t: T, descriptor: IdentifiedDescriptor): readonly ConflictPresentationDetail[] {
  const baseline = identifiedValues(baselineValue);
  const server = identifiedValues(serverValue);
  const local = identifiedValues(localValue);
  const baselineById = new Map(baseline.map((item) => [item.id, item]));
  const serverById = new Map(server.map((item) => [item.id, item]));
  const localById = new Map(local.map((item) => [item.id, item]));
  const values = (items: readonly IdentifiedValue[], source: readonly IdentifiedValue[]) => ({ kind: "list" as const, items: items.map((item) => descriptor.describe(item, source.findIndex((candidate) => candidate.id === item.id))) });
  const changes = (items: readonly IdentifiedValue[], source: readonly IdentifiedValue[]) => ({
    kind: "list" as const,
    items: items.map((item) => {
      const initial = baselineById.get(item.id)!;
      return descriptor.describeChange(initial, item, baseline.findIndex((candidate) => candidate.id === item.id), source.findIndex((candidate) => candidate.id === item.id));
    }),
  });
  const details: ConflictPresentationDetail[] = [];
  const add = (id: string, labelKey: string, items: readonly IdentifiedValue[], source: readonly IdentifiedValue[]) => {
    if (items.length > 0) details.push({ id, label: t(labelKey), value: values(items, source) });
  };

  add("server-added", "studio.settingsConflict.list.serverAdded", server.filter((item) => !baselineById.has(item.id)), server);
  add("server-removed", "studio.settingsConflict.list.serverRemoved", baseline.filter((item) => !serverById.has(item.id)), baseline);
  add("local-added", "studio.settingsConflict.list.localAdded", local.filter((item) => !baselineById.has(item.id)), local);
  add("local-removed", "studio.settingsConflict.list.localRemoved", baseline.filter((item) => !localById.has(item.id)), baseline);
  const serverModified = server.filter((item) => {
    const initial = baselineById.get(item.id);
    return initial !== undefined && !equalJsonValue(initial, item);
  });
  if (serverModified.length > 0) details.push({ id: "server-modified", label: t("studio.settingsConflict.list.serverModified"), value: changes(serverModified, server) });
  const localModified = local.filter((item) => {
    const initial = baselineById.get(item.id);
    return initial !== undefined && !equalJsonValue(initial, item);
  });
  if (localModified.length > 0) details.push({ id: "local-modified", label: t("studio.settingsConflict.list.localModified"), value: changes(localModified, local) });

  const order = (items: readonly IdentifiedValue[], allowed: ReadonlySet<string>) => items.map((item) => item.id).filter((id) => allowed.has(id));
  const sharedServer = new Set(baseline.filter((item) => serverById.has(item.id)).map((item) => item.id));
  const sharedLocal = new Set(baseline.filter((item) => localById.has(item.id)).map((item) => item.id));
  if (!equalJsonValue(order(baseline, sharedServer), order(server, sharedServer))) {
    details.push({ id: "server-order", label: t("studio.settingsConflict.list.serverOrder"), value: values(server, server) });
  }
  if (!equalJsonValue(order(baseline, sharedLocal), order(local, sharedLocal))) {
    details.push({ id: "local-order", label: t("studio.settingsConflict.list.localOrder"), value: values(local, local) });
  }
  return details;
}

function flattenPrimaryMenu(value: unknown): readonly IdentifiedValue[] {
  const parents = identifiedValues(value);
  return parents.flatMap((parent) => {
    const children = identifiedValues(parent["children"]);
    const parentSummary = Object.fromEntries(
      Object.entries(parent).filter(([key]) => key !== "children"),
    ) as IdentifiedValue;
    return [
      parentSummary,
      ...children.map((child) => ({
        ...child,
        parentId: parent.id,
        parentLabel: objectName(parent),
      })),
    ];
  });
}

function changeSummary(label: string, before: unknown, after: unknown, t: T): string {
  const readable = (value: unknown) => typeof value === "boolean"
    ? t(`studio.settingsConflict.values.boolean.${value ? "true" : "false"}`)
    : String(value ?? t("studio.settingsConflict.values.empty"));
  return t("studio.settingsConflict.list.changedValue", {
    field: label,
    before: readable(before),
    after: readable(after),
  });
}

function socialDescriptor(t: T): IdentifiedDescriptor {
  const describe = (item: IdentifiedValue, index: number) => {
    const kind = typeof item["kind"] === "string" ? t(`studio.social.kind.${item["kind"]}`) : t("studio.settingsConflict.values.configurationChanged");
    return `${kind} · ${t("studio.menuLink.href.label")}: ${String(item["href"] ?? "")} · ${t("studio.settingsConflict.list.position", { position: index + 1 })}`;
  };
  return {
    describe,
    describeChange: (initial, next, initialIndex, nextIndex) => {
      const changes = [
        !equalJsonValue(initial["kind"], next["kind"]) ? changeSummary(t("studio.socialFieldsItem.kind.label"), typeof initial["kind"] === "string" ? t(`studio.social.kind.${initial["kind"]}`) : initial["kind"], typeof next["kind"] === "string" ? t(`studio.social.kind.${next["kind"]}`) : next["kind"], t) : null,
        !equalJsonValue(initial["href"], next["href"]) ? changeSummary(t("studio.menuLink.href.label"), initial["href"], next["href"], t) : null,
        initialIndex !== nextIndex ? changeSummary(t("studio.settingsConflict.list.order"), initialIndex + 1, nextIndex + 1, t) : null,
      ].filter((value): value is string => value !== null);
      return `${describe(next, nextIndex)} · ${changes.join(" · ")}`;
    },
  };
}

function menuDescriptor(t: T): IdentifiedDescriptor {
  const parent = (item: IdentifiedValue) => typeof item["parentLabel"] === "string"
    ? item["parentLabel"]
    : t("studio.settingsConflict.list.noParent");
  const describe = (item: IdentifiedValue, index: number) => [
    `${t("studio.menuFieldsItem.labelField.label")}: ${String(item["label"] ?? "")}`,
    `${t("studio.menuLink.href.label")}: ${String(item["href"] || t("studio.settingsConflict.values.empty"))}`,
    `${t("studio.menuLink.newTabSwitch.label")}: ${t(`studio.settingsConflict.values.boolean.${item["newTab"] === true ? "true" : "false"}`)}`,
    `${t("studio.settingsConflict.list.parent")}: ${parent(item)}`,
    t("studio.settingsConflict.list.position", { position: index + 1 }),
  ].join(" · ");
  return {
    describe,
    describeChange: (initial, next, initialIndex, nextIndex) => {
      const changes = [
        !equalJsonValue(initial["label"], next["label"]) ? changeSummary(t("studio.menuFieldsItem.labelField.label"), initial["label"], next["label"], t) : null,
        !equalJsonValue(initial["href"], next["href"]) ? changeSummary(t("studio.menuLink.href.label"), initial["href"], next["href"], t) : null,
        !equalJsonValue(initial["newTab"], next["newTab"]) ? changeSummary(t("studio.menuLink.newTabSwitch.label"), initial["newTab"], next["newTab"], t) : null,
        !equalJsonValue(initial["parentId"], next["parentId"]) ? changeSummary(t("studio.settingsConflict.list.parent"), parent(initial), parent(next), t) : null,
        initialIndex !== nextIndex ? changeSummary(t("studio.settingsConflict.list.order"), initialIndex + 1, nextIndex + 1, t) : null,
      ].filter((value): value is string => value !== null);
      return `${describe(next, nextIndex)} · ${changes.join(" · ")}`;
    },
  };
}

const socialListDefinition: SettingsListDefinition<SocialFormValues["items"]> = {
  propertyKeys: ["kind", "href"],
  toNodes: (items) => items.map((item) => ({
    id: item.id,
    parentId: null,
    value: item,
  })),
  fromNodes: (nodes) => nodes.map((node): SocialItemFormValues => ({
    id: node.id,
    kind: node.value["kind"] as SocialItemFormValues["kind"],
    href: String(node.value["href"] ?? ""),
  })),
};

const legalMenuListDefinition: SettingsListDefinition<LegalMenuFormValues["items"]> = {
  propertyKeys: ["label", "href", "newTab"],
  toNodes: (items) => items.map((item) => ({
    id: item.id,
    parentId: null,
    value: item,
  })),
  fromNodes: (nodes) => nodes.map((node): LegalMenuItemFormValues => ({
    id: node.id,
    label: String(node.value["label"] ?? ""),
    href: String(node.value["href"] ?? ""),
    newTab: node.value["newTab"] === true,
  })),
};

const primaryMenuListDefinition: SettingsListDefinition<PrimaryMenuFormValues["items"]> = {
  propertyKeys: ["label", "href", "newTab", "parentId"],
  toNodes: (items) => items.flatMap((parent) => {
    const { children: _children, ...parentValue } = parent;
    return [
      { id: parent.id, parentId: null, value: parentValue },
      ...(parent.children ?? []).map((child) => ({
        id: child.id,
        parentId: parent.id,
        value: child,
      })),
    ];
  }),
  fromNodes: (nodes) => {
    const childrenByParent = new Map<string, PrimaryMenuChildFormValues[]>();
    for (const node of nodes) {
      if (node.parentId === null) continue;
      const children = childrenByParent.get(node.parentId) ?? [];
      children.push({
        id: node.id,
        label: String(node.value["label"] ?? ""),
        href: String(node.value["href"] ?? ""),
        newTab: node.value["newTab"] === true,
      });
      childrenByParent.set(node.parentId, children);
    }
    return nodes.flatMap((node): PrimaryMenuItemFormValues[] => node.parentId === null ? [{
      id: node.id,
      label: String(node.value["label"] ?? ""),
      href: String(node.value["href"] ?? ""),
      newTab: node.value["newTab"] === true,
      children: childrenByParent.get(node.id) ?? [],
    }] : []);
  },
};

function listNodeValue(
  node: SettingsListNode | undefined,
  nodes: readonly SettingsListNode[],
  descriptor: IdentifiedDescriptor,
  t: T,
): ConflictDisplayValue {
  if (!node) return { kind: "empty", text: t("studio.settingsConflict.values.empty") };
  const siblings = nodes.filter((candidate) => candidate.parentId === node.parentId);
  const parent = node.parentId ? nodes.find((candidate) => candidate.id === node.parentId) : undefined;
  const item = {
    ...node.value,
    id: node.id,
    parentId: node.parentId,
    parentLabel: parent ? objectName(parent.value) : undefined,
  } as IdentifiedValue;
  return {
    kind: "text",
    text: descriptor.describe(item, Math.max(0, siblings.findIndex((candidate) => candidate.id === node.id))),
  };
}

function listNodesValue(
  nodes: readonly SettingsListNode[] | undefined,
  descriptor: IdentifiedDescriptor,
  t: T,
): ConflictDisplayValue {
  if (!nodes || nodes.length === 0) return { kind: "empty", text: t("studio.settingsConflict.values.emptyList") };
  return {
    kind: "list",
    items: nodes.map((node) => {
      const value = listNodeValue(node, nodes, descriptor, t);
      return value.kind === "list" ? value.items.join(" · ") : value.text;
    }),
  };
}

function listPropertyValue(
  property: string,
  value: unknown,
  nodes: readonly SettingsListNode[],
  t: T,
): ConflictDisplayValue {
  if (property === "parentId") {
    if (typeof value !== "string") return { kind: "text", text: t("studio.settingsConflict.list.noParent") };
    const parent = nodes.find((node) => node.id === value);
    return { kind: "text", text: parent ? objectName(parent.value) ?? t("studio.settingsConflict.list.unnamedItem") : t("studio.settingsConflict.list.unknownParent") };
  }
  if (property === "kind" && typeof value === "string") {
    return { kind: "text", text: t(`studio.social.kind.${value}`) };
  }
  return displayValue(value, t);
}

function listChangeLabel(
  change: SettingsListChange,
  propertyLabels: Readonly<Record<string, string>>,
  t: T,
): string {
  switch (change.kind) {
    case "addition": return t("studio.settingsConflict.list.itemAdded");
    case "removal": return t("studio.settingsConflict.list.itemRemoved");
    case "presence": return t("studio.settingsConflict.list.deletionModified");
    case "property": return propertyLabels[change.property ?? ""] ?? t("studio.settingsConflict.list.propertyChanged");
    case "order": return t("studio.settingsConflict.list.order");
    case "manual": return t("studio.settingsConflict.list.manualRequired");
  }
}

function listConflictItem(input: Readonly<{
  change: SettingsListChange;
  descriptor: IdentifiedDescriptor;
  propertyLabels: Readonly<Record<string, string>>;
  baselineNodes: readonly SettingsListNode[];
  serverNodes: readonly SettingsListNode[];
  localNodes: readonly SettingsListNode[];
  t: T;
}>): ConflictPresentationItem {
  const { change, descriptor, t } = input;
  const contextNode = change.localNode ?? change.serverNode ?? change.baselineNode;
  const contextSource = change.localNode ? input.localNodes : change.serverNode ? input.serverNodes : input.baselineNodes;
  const contextValue = listNodeValue(contextNode, contextSource, descriptor, t);
  const context = contextValue.kind === "list" ? contextValue.items.join(" · ") : contextValue.text;
  const comparison = change.kind === "property" && change.property
    ? {
        baseline: listPropertyValue(change.property, change.baseline, input.baselineNodes, t),
        server: listPropertyValue(change.property, change.server, input.serverNodes, t),
        local: listPropertyValue(change.property, change.local, input.localNodes, t),
      }
    : change.kind === "order"
      ? {
          baseline: listNodesValue(change.baselineNodes, descriptor, t),
          server: listNodesValue(change.serverNodes, descriptor, t),
          local: listNodesValue(change.localNodes, descriptor, t),
        }
      : change.kind === "manual"
        ? undefined
        : {
            baseline: listNodeValue(change.baselineNode, input.baselineNodes, descriptor, t),
            server: listNodeValue(change.serverNode, input.serverNodes, descriptor, t),
            local: listNodeValue(change.localNode, input.localNodes, descriptor, t),
          };
  return {
    id: change.id,
    label: listChangeLabel(change, input.propertyLabels, t),
    context: contextNode ? context : undefined,
    status: change.status,
    resolutionMode: change.resolutionMode,
    choice: change.choice,
    comparison,
    details: change.reason ? [{
      id: "reason",
      label: t("studio.settingsConflict.list.reason"),
      value: { kind: "text", text: t(`studio.settingsConflict.list.manualReasons.${change.reason}`) },
    }] : undefined,
  };
}

function identifiedListStrategy<TValue>(input: Readonly<{
  definition: SettingsListDefinition<TValue>;
  descriptor: IdentifiedDescriptor;
  propertyLabels: Readonly<Record<string, string>>;
  t: T;
}>): SettingsConflictFieldStrategy<TValue> {
  const analyze = (values: Parameters<SettingsConflictFieldStrategy<TValue>["resolve"]>[0]) =>
    analyzeSettingsListResolution({
      baseline: values.baseline,
      server: values.current,
      local: values.local,
      choices: values.choices,
      definition: input.definition,
    });
  return {
    present: (values) => {
      const analysis = analyze(values);
      const baselineNodes = input.definition.toNodes(values.baseline);
      const serverNodes = input.definition.toNodes(values.current);
      const localNodes = input.definition.toNodes(values.local);
      return analysis.changes.map((change) => listConflictItem({
        change,
        descriptor: input.descriptor,
        propertyLabels: input.propertyLabels,
        baselineNodes,
        serverNodes,
        localNodes,
        t: input.t,
      }));
    },
    resolve: (values) => {
      const result = analyze(values).result;
      if (result.status === "resolved") return result;
      if (result.status === "incomplete") return result;
      return { status: "manual", reason: result.reason };
    },
  };
}

export function identityConflictAdapter(t: T): SettingsConflictPresentationAdapter<IdentityFormValues> {
  const base = adapter<IdentityFormValues>({
    siteName: t("studio.identityForm.siteName.label"),
    tagline: t("studio.identityForm.tagline.label"),
    logo: t("studio.settingsConflict.fields.identity.logo"),
    faviconUrl: t("studio.settingsConflict.fields.identity.faviconUrl"),
    faviconMediaAssetId: t("studio.settingsConflict.fields.identity.faviconMediaAssetId"),
  }, t);
  return {
    ...base,
    display: (key, value) => {
      if (key === "logo") return displayLogo(value as IdentityFormValues["logo"], t);
      if (key === "faviconUrl" && typeof value === "string") {
        return value ? { kind: "text", text: readableSource(value) } : displayValue(value, t);
      }
      if (key === "faviconMediaAssetId") {
        return { kind: "text", text: t(value ? "studio.settingsConflict.values.mediaLinked" : "studio.settingsConflict.values.mediaNotLinked") };
      }
      return displayValue(value, t);
    },
  };
}

export function headerConflictAdapter(t: T): SettingsConflictPresentationAdapter<HeaderFormValues> {
  return adapter<HeaderFormValues>({
    showLogo: t("studio.headerForm.showLogo.label"),
    showSiteName: t("studio.headerForm.showSiteName.label"),
    sticky: t("studio.headerForm.sticky.label"),
    blur: t("studio.headerForm.blur.label"),
    swapPrimaryAndSocial: t("studio.headerForm.swapPrimaryAndSocial.label"),
  }, t);
}

export function footerConflictAdapter(t: T): SettingsConflictPresentationAdapter<FooterFormValues> {
  return adapter<FooterFormValues>({
    copyright: t("studio.footerForm.copyright.label"),
    showYear: t("studio.footerForm.showYear.label"),
  }, t);
}

export function seoConflictAdapter(t: T): SettingsConflictPresentationAdapter<SeoFormValues> {
  const base = adapter<SeoFormValues>({
    baseUrl: t("studio.seoForm.indexing.baseUrl.label"),
    defaultTitle: t("studio.seoForm.base.defaultTitle.label"),
    defaultDescription: t("studio.seoForm.base.defaultDescription.label"),
    titleTemplate: t("studio.seoForm.base.titleTemplate.label"),
    canonicalUrl: t("studio.seoForm.indexing.canonicalUrl.label"),
    robots: t("studio.seoForm.indexing.robots.label"),
    structuredData: t("studio.seoForm.indexing.structuredData.label"),
    openGraph: t("studio.settingsConflict.fields.seo.openGraph"),
    twitter: t("studio.settingsConflict.fields.seo.twitter"),
  }, t);
  return {
    ...base,
    display: (key, value) => {
      switch (key) {
        case "openGraph": return displayOpenGraph(value as SeoFormValues["openGraph"], t);
        case "twitter": return displayTwitter(value as SeoFormValues["twitter"], t);
        case "structuredData": return displayStructuredData(value as SeoFormValues["structuredData"], t);
        case "robots": return displayRobots(value as string, t);
        default: return displayValue(value, t);
      }
    },
  };
}

export function themeConflictAdapter(t: T): SettingsConflictPresentationAdapter<ThemeFormValues> {
  const base = adapter<ThemeFormValues>({
    enableDarkMode: t("studio.themeForm.enableDarkMode.label"),
    mode: t("studio.themeForm.mode.label"),
    fontFamily: t("studio.themeForm.fontFamily.label"),
    headingFont: t("studio.themeForm.headingFont.label"),
    revealPreset: t("studio.themeForm.revealPreset.label"),
    lightTokens: t("studio.themeForm.lightTokens.title"),
    darkTokens: t("studio.themeForm.darkTokens.title"),
  }, t);
  return {
    ...base,
    display: (key, value) => {
      if ((key === "lightTokens" || key === "darkTokens") && isRecord(value)) {
        return {
          kind: "list",
          items: Object.entries(value).map(([token, color]) => `${t(`studio.themeForm.tokens.labels.${token}`)}: ${String(color)}`),
        };
      }
      if ((key === "fontFamily" || key === "headingFont") && typeof value === "string") {
        return { kind: "text", text: THEME_FONTS.find((font) => font.id === value)?.label ?? value };
      }
      if (key === "mode" && typeof value === "string") return { kind: "text", text: t(`studio.themeForm.mode.items.${value}`) };
      if (key === "revealPreset" && typeof value === "string") return { kind: "text", text: t(`studio.themeForm.revealPreset.items.${value}`) };
      return displayValue(value, t);
    },
  };
}

export function socialConflictAdapter(t: T): SettingsConflictPresentationAdapter<SocialFormValues> {
  const descriptor = socialDescriptor(t);
  const strategy = identifiedListStrategy({
    definition: socialListDefinition,
    descriptor,
    propertyLabels: {
      kind: t("studio.socialFieldsItem.kind.label"),
      href: t("studio.menuLink.href.label"),
    },
    t,
  });
  return {
    ...adapter<SocialFormValues>({ items: t("studio.settingsConflict.fields.social.items") }, t),
    fieldStrategies: { items: strategy },
    display: (_key, value) => {
      const items = identifiedValues(value);
      if (items.length === 0) return displayValue(value, t);
      return {
        kind: "list",
        items: items.map(descriptor.describe),
      };
    },
    details: (_key, baseline, server, local) => listChangeDetails(baseline, server, local, t, descriptor),
  };
}

export function primaryMenuConflictAdapter(t: T): SettingsConflictPresentationAdapter<PrimaryMenuFormValues> {
  const descriptor = menuDescriptor(t);
  const strategy = identifiedListStrategy({
    definition: primaryMenuListDefinition,
    descriptor,
    propertyLabels: {
      label: t("studio.menuFieldsItem.labelField.label"),
      href: t("studio.menuLink.href.label"),
      newTab: t("studio.menuLink.newTabSwitch.label"),
      parentId: t("studio.settingsConflict.list.parent"),
    },
    t,
  });
  return {
    ...adapter<PrimaryMenuFormValues>({ items: t("studio.settingsConflict.fields.primaryMenu.items") }, t),
    fieldStrategies: { items: strategy },
    display: (_key, value) => {
      const items = flattenPrimaryMenu(value);
      return items.length > 0 ? { kind: "list", items: items.map(descriptor.describe) } : displayValue(value, t);
    },
    details: (_key, baseline, server, local) => listChangeDetails(flattenPrimaryMenu(baseline), flattenPrimaryMenu(server), flattenPrimaryMenu(local), t, descriptor),
  };
}

export function legalMenuConflictAdapter(t: T): SettingsConflictPresentationAdapter<LegalMenuFormValues> {
  const descriptor = menuDescriptor(t);
  const strategy = identifiedListStrategy({
    definition: legalMenuListDefinition,
    descriptor,
    propertyLabels: {
      label: t("studio.menuFieldsItem.labelField.label"),
      href: t("studio.menuLink.href.label"),
      newTab: t("studio.menuLink.newTabSwitch.label"),
    },
    t,
  });
  return {
    ...adapter<LegalMenuFormValues>({ items: t("studio.settingsConflict.fields.legalMenu.items") }, t),
    fieldStrategies: { items: strategy },
    display: (_key, value) => {
      const items = identifiedValues(value);
      return items.length > 0 ? { kind: "list", items: items.map(descriptor.describe) } : displayValue(value, t);
    },
    details: (_key, baseline, server, local) => listChangeDetails(baseline, server, local, t, descriptor),
  };
}
