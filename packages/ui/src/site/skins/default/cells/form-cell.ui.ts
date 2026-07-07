/**
 * @file packages/ui/src/site/skins/default/cells/form-cell.ui.ts
 * @layer ui/site/skins/default/cells
 *
 * @description
 * Defines the default skin classes for form cells.
 */

import type { SiteFormUi } from "@compoz/ui/site/site-ui.types";
import { defaultSiteButtonUi } from "@compoz/ui/site/skins/default/atoms/site-button.ui";

export const defaultFormUi: SiteFormUi = {
  card: "w-full max-w-2xl mx-auto border border-border shadow-xs",
  form: "flex flex-col",
  header: "flex flex-col gap-2",
  content: "flex flex-col gap-6 pb-4",
  fields: "flex flex-col gap-4",
  field: "flex flex-col gap-2",
  label: "text-sm font-medium",
  input: "",
  textarea: "min-h-[140px] resize-y",
  help: "text-xs text-muted-foreground",
  footer: "flex justify-end",
  submitButton: "w-fit cursor-pointer",
  submitButtonUi: defaultSiteButtonUi,
} as const;
