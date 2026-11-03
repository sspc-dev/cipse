"use client";

import {
  Autocomplete,
  Description,
  EmptyState,
  FieldError,
  Label,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";
import { countryOptions } from "@/lib/features/register/data/countries";
import type { RegisterSchema } from "@/lib/features/register/schema";
import type { Dictionary, Locale } from "@/lib/i18n";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";

export function CountryField({
  control,
  dictionary,
  locale,
}: {
  control: Control<RegisterSchema>;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const { contains } = useFilter({ sensitivity: "base" });
  const options = useMemo(() => countryOptions(locale), [locale]);
  const copy = dictionary.country;

  return (
    <Controller
      control={control}
      name="country"
      render={({ field, fieldState }) => {
        const selectedOption = options.find(
          (option) => option.code === field.value,
        );

        return (
          <Autocomplete
            className="w-full gap-1.5"
            fullWidth
            isInvalid={fieldState.invalid}
            isRequired
            name={field.name}
            placeholder={copy.placeholder}
            selectionMode="single"
            value={selectedOption?.code ?? null}
            onChange={(key) => {
              const option =
                key === null
                  ? undefined
                  : options.find((item) => item.code === String(key));
              field.onChange(option?.code ?? "");
            }}
          >
            <Label className={labelClass}>{copy.label}</Label>
            <Autocomplete.Trigger>
              <Autocomplete.Value />
              <Autocomplete.ClearButton />
              <Autocomplete.Indicator />
            </Autocomplete.Trigger>
            <Description className="text-xs text-muted/70">
              {copy.description}
            </Description>
            <Autocomplete.Popover>
              <Autocomplete.Filter filter={contains}>
                <SearchField
                  autoFocus
                  aria-label={copy.searchLabel}
                  name="country-search"
                  variant="secondary"
                >
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder={copy.searchPlaceholder} />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
                <ListBox
                  renderEmptyState={() => <EmptyState>{copy.empty}</EmptyState>}
                >
                  {options.map((option) => (
                    <ListBox.Item
                      key={option.code}
                      id={option.code}
                      textValue={`${option.name} ${option.code}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true">{option.flag}</span>
                        <span className="truncate">{option.name}</span>
                      </span>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Autocomplete.Filter>
            </Autocomplete.Popover>
            <FieldError className="mt-0.5 text-xs font-medium text-danger">
              {fieldState.error?.message}
            </FieldError>
          </Autocomplete>
        );
      }}
    />
  );
}
