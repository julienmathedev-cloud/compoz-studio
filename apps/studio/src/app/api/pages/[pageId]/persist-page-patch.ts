/**
 * @file apps/studio/src/app/api/pages/[pageId]/persist-page-patch.ts
 * @layer studio/app/api
 * @description Converts the atomic page update result into the PATCH response contract.
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { updatePage } from "@compoz/core/domain/pages/use-cases/update-page";
import type {
  UpdatePageDeps,
  UpdatePageInput,
} from "@compoz/core/domain/pages/use-cases/update-page.types";
import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";

export async function persistPagePatch(
  dependencies: UpdatePageDeps,
  input: UpdatePageInput,
): Promise<UpdatePageResponse> {
  const result = await updatePage(dependencies)(input);

  return {
    page: result.page as PageDTO,
    revisions: result.revisions,
    ...(result.structure ? { structure: result.structure } : {}),
  };
}
