"use client";

import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import type { ReactNode } from "react";
import { type Control, Controller } from "react-hook-form";
import type { RegisterSchema } from "@/lib/features/register/schema";

type FormValues = RegisterSchema;
type TextFieldName = keyof FormValues;

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80";
const descriptionClass = "text-xs text-muted/70";
const inputClass =
  "py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2";

export function TextFieldControl({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  icon,
  description,
  isRequired = true,
  type = "text",
}: {
  control: Control<FormValues>;
  name: TextFieldName;
  label: string;
  placeholder: string;
  autoComplete?: string;
  icon: ReactNode;
  description?: string;
  isRequired?: boolean;
  type?: "text" | "email" | "tel";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          className="w-full gap-1.5"
          isInvalid={fieldState.invalid}
          isRequired={isRequired}
          name={field.name}
          value={field.value}
          onChange={field.onChange}
        >
          <Label className={labelClass}>{label}</Label>
          <InputGroup fullWidth>
            <InputGroup.Input
              aria-required={isRequired}
              autoComplete={autoComplete}
              className={inputClass}
              onBlur={field.onBlur}
              placeholder={placeholder}
              type={type}
            />
            <InputGroup.Suffix className="text-muted/45 transition-colors group-focus-within:text-accent-soft-foreground">
              {icon}
            </InputGroup.Suffix>
          </InputGroup>
          {description ? (
            <Description className={descriptionClass}>
              {description}
            </Description>
          ) : null}
          <FieldError className="mt-0.5 text-xs font-medium text-danger">
            {fieldState.error?.message}
          </FieldError>
        </TextField>
      )}
    />
  );
}
