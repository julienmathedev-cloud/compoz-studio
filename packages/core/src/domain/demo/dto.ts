/**
 * @file packages/core/src/domain/demo/dto.ts
 * @layer core/domain
 * @description
 * DTOs de lecture pour le module Demo, alignés sur les entités du domaine.
 * Ces types représentent la forme stable exposée aux adapters (API/infra)
 * et restent immuables (`Readonly<>`).
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";

/**
 * DTO complet représentant une sandbox démo.
 * Aligné strictement sur l’entité métier `DemoSandbox`.
 */
export type DemoSandboxDTO = Readonly<DemoSandbox>;
