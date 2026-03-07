/**
 * @file apps/studio/scripts/seed-admin.ts
 * @description
 * Seed d’un user admin Studio via `KvUsersRepository`.
 *
 * @remarks
 * - Charge les variables depuis `.env.local`.
 * - Aligne le payload repo avec `CreateUserRecord` :
 *   `{ user, password }`.
 */

import dotenv from "dotenv";
import path from "path";

import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";

// --------------------------------------------------
// Load .env
// --------------------------------------------------

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function required(name: string): string {
  const value = String(process.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {
  const email = required("ADMIN_EMAIL").toLowerCase();
  const password = required("ADMIN_PASSWORD");
  const name = String(process.env["ADMIN_NAME"] ?? "").trim() || "Admin";
  const defaultTenant =
    String(process.env["ADMIN_DEFAULT_TENANT"] ?? "")
      .trim()
      .toLowerCase() || "default";

  const repo = new KvUsersRepository();

  const existing = await repo.readByEmail(email);

  if (!existing) {
    const now = new Date().toISOString();

    const created = await repo.create({
      user: {
        id: "admin-default",
        email,
        name,
        status: "active",
        rbac: {
          role: "admin",
          tenantIds: [defaultTenant],
          defaultTenantId: defaultTenant,
        },
        meta: {
          createdAt: now,
          updatedAt: now,
        },
      },
      password,
    });

    console.log("✅ Admin created:", {
      id: created.id,
      email: created.email,
      tenant: defaultTenant,
    });

    return;
  }

  await repo.put({
    ...existing,
    name,
    status: "active",
    rbac: {
      role: "admin",
      tenantIds: [defaultTenant],
      defaultTenantId: defaultTenant,
    },
    meta: {
      ...existing.meta,
      updatedAt: new Date().toISOString(),
    },
  });

  await repo.setPassword(existing.id, password);

  console.log("♻️ Admin updated:", {
    id: existing.id,
    email: existing.email,
    tenant: defaultTenant,
  });
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
