/**
 * @file packages/core/src/domain/demo/dto.ts
 * @layer core/domain/demo
 * @description Read DTOs for the Demo module, aligned with domain entities.
 * @remarks
 * DTOs expose a stable immutable shape to adapters.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";

export type DemoSandboxDTO = Readonly<DemoSandbox>;
