/**
 * @file scripts/check-i18n.ts
 * @desc Guard i18n :
 * - parité FR/EN (leaf keys)
 * - présence des ERROR_CODES dans errors.*
 * - présence des UiError tokens dans uiErrors.*
 * - présence des I18N_RUNTIME_KEYS (clés construites dynamiquement)
 *
 * @usage pnpm check:i18n
 */

import fs from "node:fs";
import path from "node:path";

import { routing } from "@compoz/studio/i18n/routing";
import { I18N_RUNTIME_KEYS } from "@compoz/studio/i18n/runtime-keys";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const LOCALES = routing.locales;

const MESSAGES_PATH_BY_LOCALE: Record<(typeof LOCALES)[number], string> = {
  fr: path.resolve(process.cwd(), "src/i18n/messages/fr.json"),
  en: path.resolve(process.cwd(), "src/i18n/messages/en.json"),
};

const ERROR_CODES_TS_PATH = path.resolve(
  process.cwd(),
  "src/core/domain/errors/codes.ts",
);

const UI_ERROR_TS_PATH = path.resolve(process.cwd(), "src/lib/ui/uiError.ts");

const ERRORS_NAMESPACE = "errors";
const UI_ERRORS_NAMESPACE = "uiErrors";

/**
 * Si true :
 * - échoue si un locale contient des clés d’erreur non présentes dans ERROR_CODES
 */
const FAIL_ON_EXTRA_ERROR_KEYS = false;

/**
 * Si true :
 * - échoue si un locale contient des clés uiErrors non présentes dans UiError
 */
const FAIL_ON_EXTRA_UI_ERROR_KEYS = false;

/**
 * Si true :
 * - échoue si une runtime key listée dans `I18N_RUNTIME_KEYS` est absente des JSON
 */
const FAIL_ON_MISSING_RUNTIME_KEYS = true;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function readJson(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function flattenKeys(obj: unknown, prefix = ""): string[] {
  const out: string[] = [];
  if (!isObject(obj)) return out;

  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (isObject(v)) out.push(...flattenKeys(v, next));
    else out.push(next);
  }
  return out;
}

function getValueAtPath(obj: unknown, dottedPath: string): unknown {
  const parts = dottedPath.split(".");
  let cur: unknown = obj;

  for (const p of parts) {
    if (!isObject(cur) || !Object.prototype.hasOwnProperty.call(cur, p))
      return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }

  return cur;
}

function diffSets(a: Set<string>, b: Set<string>) {
  const out: string[] = [];
  for (const x of a) if (!b.has(x)) out.push(x);
  return out.sort();
}

function toSet(arr: string[]) {
  return new Set(arr);
}

/**
 * Extrait les valeurs `"TOKEN"` depuis un enum ou objet TS :
 *   FOO = "bar"
 *   FOO: "BAR"
 */
function extractStringValues(tsFileContent: string) {
  const re = /["'=]\s*"?([A-Za-z0-9_]+)"?/g;
  const values = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = re.exec(tsFileContent)) !== null) {
    values.add(m[1]);
  }
  return values;
}

function flattenRuntimeKeys(input: unknown): string[] {
  const out: string[] = [];
  if (!isObject(input)) return out;

  for (const v of Object.values(input)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") out.push(item);
      }
      continue;
    }
    if (isObject(v)) out.push(...flattenRuntimeKeys(v));
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                                   Checks                                   */
/* -------------------------------------------------------------------------- */

function main() {
  let hasError = false;

  /* ------------------------- 1) Load messages ------------------------- */

  const messages: Record<string, unknown> = {};
  for (const locale of LOCALES) {
    const p = MESSAGES_PATH_BY_LOCALE[locale];
    if (!fs.existsSync(p)) throw new Error(`Messages file not found: ${p}`);
    messages[locale] = readJson(p);
  }

  const msgLeafKeysByLocale: Record<string, Set<string>> = {};
  for (const locale of LOCALES) {
    msgLeafKeysByLocale[locale] = toSet(flattenKeys(messages[locale]));
  }

  /* -------------------- 2) Parité FR / EN -------------------- */

  const baseLocale = LOCALES[0];
  const baseKeys = msgLeafKeysByLocale[baseLocale];

  for (const locale of LOCALES.slice(1)) {
    const currentKeys = msgLeafKeysByLocale[locale];

    const missing = diffSets(baseKeys, currentKeys);
    const extra = diffSets(currentKeys, baseKeys);

    if (missing.length > 0) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Keys missing in "${locale}":\n` +
          missing.map((k) => `- ${k}`).join("\n"),
      );
    }

    if (extra.length > 0) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Extra keys in "${locale}":\n` +
          extra.map((k) => `- ${k}`).join("\n"),
      );
    }
  }

  /* --------------------- 3) ERROR_CODES ----------------------- */

  const errorCodes = extractStringValues(
    fs.readFileSync(ERROR_CODES_TS_PATH, "utf8"),
  );

  for (const locale of LOCALES) {
    const obj = getValueAtPath(messages[locale], ERRORS_NAMESPACE);
    if (!isObject(obj)) {
      hasError = true;
      console.error(`\n❌ [i18n] Missing "${ERRORS_NAMESPACE}" in ${locale}`);
      continue;
    }

    const jsonKeys = new Set(Object.keys(obj));
    const missing = diffSets(errorCodes, jsonKeys);

    if (missing.length > 0) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Missing error translations (${locale}):\n` +
          missing.map((k) => `- ${k}`).join("\n"),
      );
    }

    if (FAIL_ON_EXTRA_ERROR_KEYS) {
      const extra = diffSets(jsonKeys, errorCodes);
      if (extra.length > 0) {
        hasError = true;
        console.error(
          `\n❌ [i18n] Extra error keys (${locale}):\n` +
            extra.map((k) => `- ${k}`).join("\n"),
        );
      }
    }
  }

  /* --------------------- 4) uiErrors -------------------------- */

  const uiErrorTokens = extractStringValues(
    fs.readFileSync(UI_ERROR_TS_PATH, "utf8"),
  );

  for (const locale of LOCALES) {
    const obj = getValueAtPath(messages[locale], UI_ERRORS_NAMESPACE);
    if (!isObject(obj)) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Missing "${UI_ERRORS_NAMESPACE}" in ${locale}`,
      );
      continue;
    }

    const jsonKeys = new Set(Object.keys(obj));
    const missing = diffSets(uiErrorTokens, jsonKeys);

    if (missing.length > 0) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Missing uiError translations (${locale}):\n` +
          missing.map((k) => `- ${k}`).join("\n"),
      );
    }

    if (FAIL_ON_EXTRA_UI_ERROR_KEYS) {
      const extra = diffSets(jsonKeys, uiErrorTokens);
      if (extra.length > 0) {
        hasError = true;
        console.error(
          `\n❌ [i18n] Extra uiError keys (${locale}):\n` +
            extra.map((k) => `- ${k}`).join("\n"),
        );
      }
    }
  }

  /* --------------------- 5) Runtime keys ---------------------- */

  const runtimeKeys = flattenRuntimeKeys(I18N_RUNTIME_KEYS);
  const runtimeSet = new Set(runtimeKeys);

  for (const locale of LOCALES) {
    const leafKeys = msgLeafKeysByLocale[locale];
    const missing = Array.from(runtimeSet).filter((k) => !leafKeys.has(k));

    if (missing.length > 0) {
      hasError = true;
      console.error(
        `\n❌ [i18n] Missing runtime keys (${locale}):\n` +
          missing.map((k) => `- ${k}`).join("\n"),
      );
    }
  }

  /* ----------------------------- Final ------------------------------- */

  if (hasError) {
    console.error("\n⛔ i18n guard failed.\n");
    process.exit(1);
  }

  console.log(
    "✅ i18n guard OK (parity + ERROR_CODES + uiErrors + runtime keys).",
  );
}

main();
