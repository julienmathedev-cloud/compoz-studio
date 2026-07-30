"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageMetadataConflictPanel.tsx
 * @layer studio/features/pages/components
 * @description Field-by-field controls for resolving page metadata OCC conflicts.
 */

import { useTranslations } from "next-intl";

import type {
  PageMetadataConflictChoice,
  PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

type PageMetadataConflictPanelProps = Readonly<{
  state: PageMetadataConflictState;
  onChoice: (
    field: PageMetadataConflictState["unresolvedFields"][number],
    choice: PageMetadataConflictChoice,
  ) => void;
}>;

function display(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value || "∅";
  return JSON.stringify(value);
}

export function PageMetadataConflictPanel({
  state,
  onChoice,
}: PageMetadataConflictPanelProps) {
  const t = useTranslations("studio.pageEditSection.conflict");

  if (state.unresolvedFields.length === 0) {
    return (
      <Card variant="panel" visualMode="studio">
        <CardContent className="py-3 text-sm">{t("resolved")}</CardContent>
      </Card>
    );
  }

  return (
    <Card variant="panel" visualMode="studio">
      <CardContent className={cn(STACK_SM, "py-4")}>
        <div>
          <p className="font-medium">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {state.details.conflicts
          .filter((conflict) =>
            state.unresolvedFields.includes(conflict.field),
          )
          .map((conflict) => (
            <div
              key={conflict.field}
              className="rounded-md border p-3"
              data-conflict-field={conflict.field}
            >
              <p className="mb-2 text-sm font-medium">
                {t(`fields.${conflict.field}`)}
              </p>
              <dl className="mb-3 grid gap-1 text-xs text-muted-foreground">
                <div>
                  <dt className="inline font-medium">{t("baseline")} : </dt>
                  <dd className="inline">{display(conflict.baseline)}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">{t("local")} : </dt>
                  <dd className="inline">{display(conflict.local)}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">{t("remote")} : </dt>
                  <dd className="inline">{display(conflict.current)}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onChoice(conflict.field, "keepLocal")}
                >
                  {t("keepLocal")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onChoice(conflict.field, "adoptRemote")}
                >
                  {t("adoptRemote")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChoice(conflict.field, "restoreInitial")
                  }
                >
                  {t("restoreInitial")}
                </Button>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

PageMetadataConflictPanel.displayName = "PageMetadataConflictPanel";
