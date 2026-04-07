"use client";

/**
 * @file apps/studio/src/components/molecules/pickers/IconPicker.tsx
 * @layer ui/studio/molecules
 * @description
 * Picker d’icônes de contenu basé sur une whitelist + recherche.
 */

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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
  onChange: (value: string) => void;
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

  const options = useMemo(() => {
    return filterContentIconOptions(query);
  }, [query]);

  return (
    <div className={cn(STACK_SM, className)}>
      <SearchInputField
        value={query}
        onChange={setQuery}
        placeholder={t("studio.iconPicker.searchPlaceholder")}
        resultsCount={options.length}
        disabled={disabled}
      />

      <ScrollArea className="h-64 rounded-md border border-border p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {options.map((item) => {
            const isSelected = item.value === value;

            return (
              <Button
                key={item.value}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                visualMode="studio"
                disabled={disabled}
                onClick={() => onChange(item.value)}
                className="h-auto min-h-20 flex-col gap-2 px-2 py-3"
                title={item.label}
              >
                {renderContentIcon(item.value, {
                  className: "h-5 w-5",
                })}
                <span className="line-clamp-2 text-center text-xs">
                  {item.label}
                </span>
              </Button>
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
