/**
 * @file packages/core/src/domain/demo/entities/demo-sandbox.ts
 * @layer core/domain
 * @description
 * Entité métier représentant une sandbox démo.
 *
 * @remarks
 * - Une sandbox démo est un clone temporaire d’un tenant seed.
 * - Elle est identifiée par un ID technique unique.
 * - Elle est associée à un utilisateur temporaire.
 * - Elle est associée à un tenant cible.
 */

export interface DemoSandbox {
  readonly demoInstanceId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
}
