/**
 * @file eslint.config.mjs
 *
 * @description
 * ESLint configuration for the Compoz monorepo.
 */

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig } from "eslint/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig([
  // Next.js presets only apply to app packages.
  ...nextVitals.map((c) => ({ ...c, files: ["apps/**/*.{js,jsx,ts,tsx}"] })),
  ...nextTs.map((c) => ({ ...c, files: ["apps/**/*.{js,jsx,ts,tsx}"] })),

  // Shared TypeScript rules.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["./**", "../**"],
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      "@typescript-eslint/no-explicit-any": [
        "error",
        { ignoreRestArgs: false, fixToUnknown: true },
      ],

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
    },
  },

  // Central logger is the only allowed console boundary.
  {
    files: ["packages/infra/src/lib/log.ts"],
    rules: { "no-console": "off" },
  },

  // Barrels must not re-export Zod schemas directly.
  {
    files: ["**/src/**/index.ts", "**/src/**/index.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration VariableDeclaration Identifier[name=/Schema$/]",
          message:
            "N’exporte pas les Zod Schemas depuis un barrel — types uniquement.",
        },
      ],
    },
  },

  // Domain code must use typed application errors.
  {
    files: [
      "packages/core/src/domain/**/*.ts",
      "packages/core/src/core/domain/**/*.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement > NewExpression[callee.name='Error']",
          message:
            "Dans le domaine, utilise DomainError/UseCaseError plutôt que Error brut.",
        },
      ],
    },
  },

  // Core schemas must stay free of defaults and normalization side effects.
  {
    files: ["packages/core/src/schemas/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='default']",
          message:
            "Pas de .default() dans les schémas — les défauts restent côté domaine.",
        },
        {
          selector: "MemberExpression[property.name='transform']",
          message:
            "Pas de .transform() dans les schémas — normalisation côté use-cases/adapters.",
        },
      ],
    },
  },

  // API routes must go through shared DTO parsing helpers.
  {
    files: ["apps/*/src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='safeParse']",
          message:
            "Dans /api, utilise parseDTO + helpers HTTP plutôt que safeParse.",
        },
        {
          selector: "MemberExpression[property.name='parse']",
          message:
            "Dans /api, utilise parseDTO + helpers HTTP plutôt que parse.",
        },
      ],
    },
  },

  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/.vscode/**",
      "**/next-env.d.ts",
      "**/scripts/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/.vercel/**",
      "**/packages/infra/src/prisma/generated/**",
    ],
  },

  // Type-aware rules are limited to core for now to keep linting cost controlled.
  {
    files: ["packages/core/src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./packages/core/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },
]);
