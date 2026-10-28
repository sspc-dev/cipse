"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Description,
  FieldError,
  Form,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import { type ReactNode } from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerAccreditation } from "@/lib/features/register/actions";
import { registerSchema, type RegisterSchema } from "@/lib/features/register/schema";
import { GlobeIcon, IdCardIcon, MailIcon } from "./icons";

type FormValues = RegisterSchema;
type TextFieldName = keyof FormValues;

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80";
const descriptionClass = "text-xs text-muted/70";
const groupHeadingClass =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/70";

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-gold">
      *
    </span>
  );
}

function TextFieldControl({
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
          <Label className={labelClass}>
            {label}
            <RequiredMark />
          </Label>
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
          <FieldError className="mt-0.5 text-xs font-medium text-[#ef4444]">
            {fieldState.error?.message}
          </FieldError>
        </TextField>
      )}
    />
  );
}

export function RegisterForm() {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      lastname: "",
      country: "",
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await registerAccreditation(values);

    if (result.ok) {
      reset();
      toast.success("Solicitud registrada correctamente", {
        description:
          "Su solicitud de acreditación quedó registrada y será revisada por el comité organizador.",
        duration: 8000,
      });
      return;
    }

    if (result.code === "DUPLICATE_EMAIL") {
      setError("email", { message: result.message });
    }

    toast.error(result.message);
  });

  return (
    <Form
      aria-label="Formulario de registro de acreditación"
      className="flex flex-col gap-6"
      onSubmit={onSubmit}
      validationBehavior="aria"
    >
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h3 className={groupHeadingClass}>Datos personales</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextFieldControl
              autoComplete="given-name"
              control={control}
              icon={<IdCardIcon className="size-4" />}
              label="Nombre"
              name="name"
              placeholder="Ej. Alejandro"
            />

            <TextFieldControl
              autoComplete="family-name"
              control={control}
              icon={<IdCardIcon className="size-4" />}
              label="Apellidos"
              name="lastname"
              placeholder="Ej. Valenzuela"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className={groupHeadingClass}>Contacto institucional</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextFieldControl
              autoComplete="country-name"
              control={control}
              description="País de origen de la delegación."
              icon={<GlobeIcon className="size-4" />}
              label="País"
              name="country"
              placeholder="Ej. México"
            />

            <TextFieldControl
              autoComplete="email"
              control={control}
              description="Deberá pertenecer a un dominio institucional .gob o .org."
              icon={<MailIcon className="size-4" />}
              label="Correo electrónico"
              name="email"
              placeholder="nombre@dependencia.gob.mx"
              type="email"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button
          className="h-12 rounded-full text-sm font-semibold shadow-lg shadow-black/40 transition-transform hover:-translate-y-0.5"
          fullWidth
          isDisabled={isSubmitting}
          isPending={isSubmitting}
          type="submit"
        >
          Registrar solicitud
        </Button>
      </div>
    </Form>
  );
}
