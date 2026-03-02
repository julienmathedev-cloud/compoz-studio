/**
 * @file packages/validation/src/common/workflow-fragments.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des états de workflow de contenu.
 * Ces schémas valident uniquement la structure des valeurs ; les règles métier
 * (transitions, defaults, autorisations) sont traitées dans le domaine.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { z } from "zod";

/**
 * État logique de contenu (forme frontière).
 */
export const ContentStateSchema = z.enum(CONTENT_STATE);
