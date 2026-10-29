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

export function TextFieldControl({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  icon,
  description,
  type = "text",
}: {
  control: Control<FormValues>;
  name: TextFieldName;
  label: string;
  placeholder: string;
  autoComplete?: string;
  icon: ReactNode;
  description?: string;
  type?: "text" | "email";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          className="w-full gap-1.5"
          isInvalid={fieldState.invalid}
          isRequired
          name={field.name}
          value={field.value}
          onChange={field.onChange}
        >
          <Label className={labelClass}>{label}</Label>
          <InputGroup fullWidth>
            <InputGroup.Input
              aria-required
              autoComplete={autoComplete}
              className="py-2.5 text-sm"
              onBlur={field.onBlur}
              placeholder={placeholder}
              type={type}
            />
            <InputGroup.Suffix className="text-muted/45">
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
