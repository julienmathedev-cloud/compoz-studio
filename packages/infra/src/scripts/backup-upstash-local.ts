/**
 * @file backup-upstash-local.ts
 * @description
 * Exporte des clés Upstash Redis vers un fichier JSON local.
 *
 * Usage:
 * - pnpm --filter @compoz/infra backup:upstash
 * - pnpm --filter @compoz/infra backup:upstash -- --pattern="compoz:default:*" --out="./backups/default.json"
 * - pnpm --filter @compoz/infra backup:upstash -- --env-file="./apps/studio/.env.local"
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

import { getUpstashRedis } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

type BackupEntry = Readonly<{
  key: string;
  value: unknown;
}>;

type BackupDocument = Readonly<{
  createdAt: string;
  pattern: string;
  keyCount: number;
  entries: BackupEntry[];
}>;

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv
    .filter((arg) => arg !== "--")
    .find((arg) => arg.startsWith(prefix));
  if (!match) return null;
  return match.slice(prefix.length).trim() || null;
}

function buildDefaultOutPath(): string {
  const iso = new Date().toISOString().replaceAll(":", "-");
  return resolve(process.cwd(), "backups", `upstash-backup-${iso}.json`);
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const index = trimmed.indexOf("=");
  if (index <= 0) return null;

  const key = trimmed.slice(0, index).trim();
  if (!key) return null;

  let value = trimmed.slice(index + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadEnvFile(envFilePath: string): boolean {
  if (!existsSync(envFilePath)) return false;

  const content = readFileSync(envFilePath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }

  return true;
}

function loadLocalEnvFiles(): void {
  const workspaceRoot = findWorkspaceRoot();
  const envFileArg = getArg("env-file");
  const candidates = envFileArg
    ? resolveEnvCandidates(envFileArg, workspaceRoot)
    : [
        join(workspaceRoot, "apps", "studio", ".env.local"),
        join(workspaceRoot, "apps", "site", ".env.local"),
        join(workspaceRoot, ".env.local"),
      ];

  for (const filePath of candidates) {
    const loaded = loadEnvFile(filePath);
    if (loaded) {
      console.log(`🧩 Env chargé depuis: ${filePath}`);
      return;
    }
  }
}

function resolveEnvCandidates(
  envFileArg: string,
  workspaceRoot: string,
): string[] {
  const fromCwd = resolve(process.cwd(), envFileArg);
  const fromRoot = resolve(workspaceRoot, envFileArg);

  if (fromCwd === fromRoot) return [fromCwd];
  return [fromCwd, fromRoot];
}

function findWorkspaceRoot(): string {
  let currentDir = resolve(process.cwd());

  while (true) {
    if (existsSync(join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return resolve(process.cwd());
    }

    currentDir = parentDir;
  }
}

function normalizePattern(value: string | null): string {
  const pattern = value?.trim() ?? "";
  return pattern || "compoz:*";
}

async function backupUpstashToLocalFile(): Promise<void> {
  loadLocalEnvFiles();

  const pattern = normalizePattern(getArg("pattern"));
  const outFile = resolve(getArg("out") ?? buildDefaultOutPath());

  const redis = getUpstashRedis();

  console.log(`🔎 Pattern: ${pattern}`);

  const keys = await kvCmd("kv.backup.keys", "other", () => redis.keys(pattern));

  if (!Array.isArray(keys) || keys.length === 0) {
    const emptyDoc: BackupDocument = {
      createdAt: new Date().toISOString(),
      pattern,
      keyCount: 0,
      entries: [],
    };

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(emptyDoc, null, 2)}\n`, "utf-8");

    console.log(`⚠️ Aucune clé trouvée. Fichier créé: ${outFile}`);
    return;
  }

  console.log(`📦 ${keys.length} clé(s) trouvée(s), récupération des valeurs...`);

  const values = await kvCmd("kv.backup.mget", "get", () => redis.mget(...keys));

  const entries: BackupEntry[] = keys.map((key, index) => ({
    key,
    value: Array.isArray(values) ? values[index] : null,
  }));

  const document: BackupDocument = {
    createdAt: new Date().toISOString(),
    pattern,
    keyCount: entries.length,
    entries,
  };

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(document, null, 2)}\n`, "utf-8");

  console.log(`✅ Backup terminé: ${outFile}`);
}

void backupUpstashToLocalFile().catch((error) => {
  console.error("❌ Backup échoué");
  console.error(error);
  process.exit(1);
});
