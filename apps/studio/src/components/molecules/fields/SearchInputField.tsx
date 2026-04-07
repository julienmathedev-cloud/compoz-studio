"use client";

/**
 * @file apps/studio/src/components/molecules/fields/SearchInputField.tsx
 * @layer ui/studio/molecules
 * @description
 * Champ de recherche réutilisable avec InputGroup.
 */

import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@compoz/ui/components/ui/input-group";

export type SearchInputFieldProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
  disabled?: boolean;
  className?: string;
}>;

export function SearchInputField({
  value,
  onChange,
  placeholder,
  resultsCount,
  disabled,
  className,
}: SearchInputFieldProps) {
  return (
    <InputGroup visualMode="studio" className={className}>
      <InputGroupInput
        visualMode="studio"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <InputGroupAddon>
        <Search className="h-4 w-4" aria-hidden />
      </InputGroupAddon>
      {typeof resultsCount === "number" ? (
        <InputGroupAddon align="inline-end">
          {resultsCount} résultat{resultsCount > 1 ? "s" : ""}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

SearchInputField.displayName = "SearchInputField";
