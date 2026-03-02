"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/CellEditorTabs.tsx
 * @layer ui/organisms
 *
 * @description
 * Éditeur de cells par colonne via tabs (V0.5).
 *
 * @remarks
 * - UI pure : édition locale des cells.
 * - Le parent fournit `cells` et récupère `onCellsChange`.
 * - V0.5 : édition inline, pas de navigation dédiée par cell.
 */
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@compoz/ui/components/ui/tabs";
import { setAt } from "@compoz/ui/lib/array";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { CellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { CarouselCellEditor } from "@compoz/studio/features/pages/blocks/editor/cells/CarouselCellEditor";
import { GalleryCellEditor } from "@compoz/studio/features/pages/blocks/editor/cells/GalleryCellEditor";
import { ImageCellEditor } from "@compoz/studio/features/pages/blocks/editor/cells/ImageCellEditor";
import { RichTextCellEditor } from "@compoz/studio/features/pages/blocks/editor/cells/RichTextCellEditor";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ensureCellsLength } from "@compoz/studio/features/pages/mappers/cells-form";
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";

export type CellErrorByIndex = Record<
  number,
  | {
      kind: "image";
      image: { src?: string; alt?: string; width?: string; height?: string };
    }
  | {
      kind: "gallery";
      imagesById?: Record<
        string,
        { src?: string; alt?: string; width?: string; height?: string }
      >;
    }
  | {
      kind: "carousel";
      imagesById?: Record<
        string,
        { src?: string; alt?: string; width?: string; height?: string }
      >;
    }
>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type CellEditorTabsProps = Readonly<{
  columns: 1 | 2 | 3;
  cells: ReadonlyArray<CellFormValues>;
  disabled?: boolean;
  onCellsChange: (next: ReadonlyArray<CellFormValues>) => void;
  onCellKindChange?: (args: {
    index: number;
    nextKind: CellFormValues["kind"];
  }) => void;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  showErrors?: boolean;
  errorsByIndex?: CellErrorByIndex;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

export function CellEditorTabs({
  columns,
  cells,
  disabled = false,
  onCellsChange,
  onCellKindChange,
  onUploadImage,
  showErrors = false,
  errorsByIndex,
  internalPageOptions,
}: CellEditorTabsProps) {
  const t = useTranslations();
  const idPrefix = useIdPrefix("cell-editor-tabs");

  const tabs = useMemo(
    () =>
      Array.from({ length: columns }, (_, i) => ({
        index: i,
        label: t("admin.cellEditorTabs.tabs", { number: i + 1 }),
      })),
    [columns, t],
  );

  // ✅ on stocke un index, pas un string
  const [activeIndex, setActiveIndex] = useState(0);

  // ✅ clamp au moment des updates (pas d’effet)
  const maxIndex = columns - 1;
  const safeActiveIndex = Math.min(activeIndex, maxIndex);

  const activeTabValue = `col-${safeActiveIndex}`;

  const safeCells = useMemo(
    () => ensureCellsLength(cells, columns),
    [cells, columns],
  );

  const current = safeCells[safeActiveIndex];
  const kind: CellFormValues["kind"] = current?.kind ?? "richText";

  // ✅ IDs uniques PAR COLONNE (sinon mêmes ids sur chaque tab)
  const kindIds = useMemo(() => {
    const colPrefix = `${idPrefix}-col-${safeActiveIndex}`;
    return createFieldIds(colPrefix, "cellKind");
  }, [idPrefix, safeActiveIndex]);

  const cellErr = errorsByIndex?.[safeActiveIndex];

  const imageSrcError =
    showErrors && cellErr?.kind === "image"
      ? // ✅ fallback : si width/height cassent, on veut le VOIR
        (cellErr.image?.src ?? cellErr.image?.width ?? cellErr.image?.height)
      : undefined;

  const galleryErrorsById =
    showErrors && cellErr?.kind === "gallery" ? cellErr.imagesById : undefined;

  const carouselErrorsById =
    showErrors && cellErr?.kind === "carousel" ? cellErr.imagesById : undefined;

  /**
   * ✅ IMPORTANT
   * Force le remount des éditeurs quand on change de tab/kind.
   * Ça évite les “fuites” d’état interne (preview, invalid local, etc.).
   */
  const editorKey = `${safeActiveIndex}:${kind}`;

  return (
    <div>
      <Tabs
        value={activeTabValue}
        onValueChange={(val) => {
          const n = Number(val.replace("col-", ""));
          const nextIndex = Number.isFinite(n) ? n : 0;
          setActiveIndex(Math.min(Math.max(0, nextIndex), maxIndex));
        }}
        className={cn(STACK_MD)}
      >
        <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-accent">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.index}
              value={`col-${tab.index}`}
              disabled={disabled}
              className={cn(
                "text-sidebar-foreground hover:bg-primary hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground",
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTabValue} className={cn(STACK_MD)}>
          <SelectField
            ids={kindIds}
            label={t("admin.cellEditorTabs.kindLabel")}
            value={kind}
            onChange={(val) => {
              const nextKind = val as CellFormValues["kind"];
              onCellKindChange?.({ index: safeActiveIndex, nextKind });
            }}
            items={[
              {
                value: "richText",
                label: t("admin.cellEditorTabs.kinds.richText"),
              },
              {
                value: "image",
                label: t("admin.cellEditorTabs.kinds.image"),
              },
              {
                value: "gallery",
                label: t("admin.cellEditorTabs.kinds.gallery"),
              },
              {
                value: "carousel",
                label: t("admin.cellEditorTabs.kinds.carousel"),
              },
            ]}
            disabled={disabled}
            help={t("admin.cellEditorTabs.kindHelp")}
          />

          {/* Editor */}
          {kind === "richText" && current.kind === "richText" ? (
            <RichTextCellEditor
              key={editorKey}
              disabled={disabled}
              value={current.content}
              onChange={(nextContent) => {
                const next: CellFormValues = {
                  kind: "richText",
                  content: nextContent,
                };
                onCellsChange(setAt(safeCells, safeActiveIndex, next));
              }}
            />
          ) : null}

          {kind === "image" && current.kind === "image" ? (
            <ImageCellEditor
              key={editorKey}
              idPrefix={`${idPrefix}-col-${safeActiveIndex}-image`}
              disabled={disabled}
              value={current}
              onChange={(next) => {
                onCellsChange(setAt(safeCells, safeActiveIndex, next));
              }}
              onUploadImage={onUploadImage}
              srcErrorMessage={imageSrcError}
              srcInvalid={Boolean(imageSrcError)}
            />
          ) : null}

          {kind === "gallery" && current.kind === "gallery" ? (
            <GalleryCellEditor
              key={editorKey}
              idPrefix={`${idPrefix}-col-${safeActiveIndex}-gallery`}
              disabled={disabled}
              value={current}
              onChange={(next) =>
                onCellsChange(setAt(safeCells, safeActiveIndex, next))
              }
              onUploadImage={onUploadImage}
              imageErrorsById={galleryErrorsById}
              internalPageOptions={internalPageOptions}
            />
          ) : null}

          {kind === "carousel" && current.kind === "carousel" ? (
            <CarouselCellEditor
              key={editorKey}
              idPrefix={`${idPrefix}-col-${safeActiveIndex}-carousel`}
              disabled={disabled}
              value={current}
              onChange={(next) =>
                onCellsChange(setAt(safeCells, safeActiveIndex, next))
              }
              onUploadImage={onUploadImage}
              imageErrorsById={carouselErrorsById}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

CellEditorTabs.displayName = "CellEditorTabs";
