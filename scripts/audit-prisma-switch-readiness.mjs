#!/usr/bin/env node

/**
 * @file scripts/audit-prisma-switch-readiness.mjs
 *
 * Audit pragmatique avant bascule Prisma.
 *
 * Objectif :
 * - Repérer les imports KV directs
 * - Repérer les `new Kv*Repository()`
 * - Repérer les accès directs Upstash/KV
 * - Repérer les factories repo utilisées
 * - Repérer les mentions snapshot/demo/domain qui peuvent rester hors Prisma
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SCAN_DIRS = ["apps", "packages"];

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  ".turbo",
  "coverage",
  ".vercel",
]);

const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const CHECKS = [
  {
    key: "directKvRepositoryImport",
    label: "Imports directs de repositories KV",
    severity: "HIGH",
    pattern: /from\s+["']@compoz\/infra\/[^"']*\/kv-[^"']*repository["']/g,
  },
  {
    key: "directKvRepositoryNew",
    label: "Instanciations directes de Kv*Repository",
    severity: "HIGH",
    pattern: /new\s+Kv[A-Za-z0-9_]*Repository\s*\(/g,
  },
  {
    key: "directUpstashRedis",
    label: "Accès direct Upstash Redis / KV infra",
    severity: "MEDIUM",
    pattern:
      /getUpstashRedis|@compoz\/infra\/kv\/kv-redis|@upstash\/redis|kvCmd\(/g,
  },
  {
    key: "siteFactory",
    label: "Factories Site utilisées",
    severity: "INFO",
    pattern: /getSiteRepository\s*\(/g,
  },
  {
    key: "pagesFactory",
    label: "Factories Pages utilisées",
    severity: "INFO",
    pattern: /getPagesRepository\s*\(/g,
  },
  {
    key: "usersFactory",
    label: "Factories Users utilisées",
    severity: "INFO",
    pattern: /getUsersRepository\s*\(/g,
  },
  {
    key: "repoImplEnv",
    label: "Variables *_REPO_IMPL",
    severity: "INFO",
    pattern: /SITE_REPO_IMPL|PAGES_REPO_IMPL|USERS_REPO_IMPL/g,
  },
  {
    key: "snapshot",
    label: "Mentions Snapshot",
    severity: "REVIEW",
    pattern: /snapshot|Snapshot|snapshots|Snapshots/g,
  },
  {
    key: "demo",
    label: "Mentions Demo/Sandbox",
    severity: "REVIEW",
    pattern: /demo|Demo|sandbox|Sandbox/g,
  },
  {
    key: "domainResolver",
    label: "Mentions Domain/Host resolver",
    severity: "REVIEW",
    pattern:
      /WebsiteDomain|tenantByHost|TENANT_BY_HOST|COMPOZ_TENANT_BY_HOST_JSON|resolve.*host|host.*tenant|domain/gi,
  },
];

function walk(dir) {
  const out = [];

  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    if (!FILE_EXTENSIONS.has(ext)) continue;

    out.push(full);
  }

  return out;
}

function lineAndColumn(content, index) {
  const before = content.slice(0, index);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function getLine(content, lineNumber) {
  return content.split("\n")[lineNumber - 1]?.trim() ?? "";
}

function auditFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const relative = path.relative(ROOT, file);
  const findings = [];

  for (const check of CHECKS) {
    const pattern = new RegExp(check.pattern.source, check.pattern.flags);

    for (const match of content.matchAll(pattern)) {
      const pos = lineAndColumn(content, match.index ?? 0);
      findings.push({
        ...check,
        file: relative,
        line: pos.line,
        column: pos.column,
        match: match[0],
        code: getLine(content, pos.line),
      });
    }
  }

  return findings;
}

function groupBySeverity(findings) {
  const grouped = new Map();

  for (const finding of findings) {
    const key = finding.severity;
    const arr = grouped.get(key) ?? [];
    arr.push(finding);
    grouped.set(key, arr);
  }

  return grouped;
}

function printFinding(finding) {
  console.log(
    `  - ${finding.file}:${finding.line}:${finding.column} — ${finding.label}`,
  );
  console.log(`    ${finding.code}`);
}

function main() {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
  const findings = files.flatMap(auditFile);

  const grouped = groupBySeverity(findings);

  console.log("");
  console.log("🔎 Prisma switch readiness audit");
  console.log("================================");
  console.log("");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log("");

  for (const severity of ["HIGH", "MEDIUM", "REVIEW", "INFO"]) {
    const list = grouped.get(severity) ?? [];

    console.log(`${severity} (${list.length})`);
    console.log("-".repeat(`${severity} (${list.length})`.length));

    if (list.length === 0) {
      console.log("  Aucun résultat.");
      console.log("");
      continue;
    }

    for (const finding of list) {
      printFinding(finding);
    }

    console.log("");
  }

  console.log("Lecture rapide :");
  console.log("- HIGH   : à vérifier avant bascule Prisma.");
  console.log(
    "- MEDIUM : accès infra KV directs, parfois normaux dans les repos KV.",
  );
  console.log("- REVIEW : zones à décider : snapshot, demo, domains.");
  console.log("- INFO   : signaux utiles, pas des erreurs.");
  console.log("");
}

main();
