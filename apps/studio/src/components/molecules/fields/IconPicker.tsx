"use client";

/**
 * @file apps/studio/src/components/molecules/IconPicker.tsx
 * @layer ui/studio/molecules
 * @description
 * Picker d’icônes de contenu basé sur une whitelist + recherche.
 */

import { useTranslations } from "next-intl";
import { memo, useDeferredValue, useId, useMemo, useState } from "react";

import { SearchInputField } from "@compoz/studio/components/molecules/fields/SearchInputField";
import { Button } from "@compoz/ui/components/ui/button";
import { ScrollArea } from "@compoz/ui/components/ui/scroll-area";
import {
  filterContentIconOptions,
  getContentIconLabel,
  renderContentIcon,
} from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

export type IconPickerProps = Readonly<{
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}>;

export function IconPicker({
  value,
  onChange,
  disabled,
  className,
}: IconPickerProps) {
  const t = useTranslations();

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const baseId = useId();

  const searchInputId = `${baseId}-search`;
  const searchInputName = `${baseId}-search`;

  const options = useMemo(() => {
    return filterContentIconOptions(deferredQuery);
  }, [deferredQuery]);

  return (
    <div className={cn(STACK_SM, className)}>
      <SearchInputField
        id={searchInputId}
        name={searchInputName}
        value={query}
        onChange={setQuery}
        placeholder={t("studio.iconPicker.searchPlaceholder")}
        resultsCount={options.length}
        disabled={disabled}
        autoComplete="off"
      />

      <ScrollArea className="h-64 rounded-md border border-border p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {options.map((item) => {
            const isSelected = item.value === value;

            return (
              <MemoizedIconOptionButton
                key={item.value}
                value={item.value}
                label={item.label}
                isSelected={isSelected}
                disabled={disabled}
                onSelect={(next) => {
                  onChange(isSelected ? null : next);
                }}
              />
            );
          })}
        </div>
      </ScrollArea>

      {value ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {renderContentIcon(value, { className: "h-4 w-4" })}
          <span>{getContentIconLabel(value)}</span>
        </div>
      ) : null}
    </div>
  );
}

IconPicker.displayName = "IconPicker";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

type IconOptionButtonProps = Readonly<{
  value: string;
  label: string;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
}>;

const MemoizedIconOptionButton = memo(function IconOptionButton({
  value,
  label,
  isSelected,
  disabled,
  onSelect,
}: IconOptionButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "ghost"}
      visualMode="studio"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className="h-auto min-h-20 min-w-0 flex-col gap-2 px-2 py-3"
      title={label}
    >
      {renderContentIcon(value, {
        className: "h-5 w-5 shrink-0",
      })}

      <span className="line-clamp-2 min-w-0 wrap-break-words text-center text-xs leading-tight">
        {label}
      </span>
    </Button>
  );
});

MemoizedIconOptionButton.displayName = "MemoizedIconOptionButton";
