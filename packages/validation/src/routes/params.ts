import { BlockIdSchema } from "@compoz/validation/pages/blocks/block";
import { PageIdSchema } from "@compoz/validation/pages/page";
import { z } from "zod";

export const PageIdAndBlockIdParamSchema = z
  .object({
    pageId: PageIdSchema,
    blockId: BlockIdSchema,
  })
  .strict();

export type PageIdAndBlockIdShape = z.input<typeof PageIdAndBlockIdParamSchema>;
