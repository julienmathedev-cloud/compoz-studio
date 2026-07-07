/**
 * @file packages/validation/src/common/workflow-fragments.ts
 * @layer validation/common
 * @description
 * Defines shared Zod schemas for content workflow boundary values.
 *
 * @remarks
 * These schemas validate value shape only; transitions, defaults, and permissions stay in core.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { z } from "zod";

export const ContentStateSchema = z.enum(CONTENT_STATE);
