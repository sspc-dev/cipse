"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@heroui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { registerAccreditation } from "@/lib/features/register/actions";
import {
  registerSchema,
  type RegisterSchema,
} from "@/lib/features/register/schema";
import { AlertCircleIcon, GlobeIcon, IdCardIcon, MailIcon } from "./icons";
import { TextFieldControl } from "./register-field";
import { folioLabel, type CredentialData } from "./register-success";

type FormValues = RegisterSchema;

const groupHeadingClass =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-ink/70";

export function RegisterForm({
  onSuccess,
}: {
  onSuccess: (credential: CredentialData) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
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
    setFormError(null);
    const result = await registerAccreditation(values);

    if (result.ok) {
      const deliveryToast =
        result.emailDelivery.state === "sent"
          ? "Solicitud registrada correctamente"
          : result.emailDelivery.state === "skipped"
            ? "Solicitud registrada (sin envío de correo configurado)"
            : "Solicitud registrada (no se pudo enviar el correo)";

      toast.success(deliveryToast, {
        description: `Folio ${folioLabel(result.id)}. Guárdela o descárguela desde la credencial.`,
        duration: 8000,
      });
      onSuccess({
        id: result.id,
        name: values.name.trim(),
        lastname: values.lastname.trim(),
        accessCode: result.accessCode,
        emailDelivery: { state: result.emailDelivery.state },
      });
      return;
    }

    if (result.code === "DUPLICATE_EMAIL") {
      setError("email", { message: result.message });
      return;
    }

    setFormError(result.message);
  });

  return (
    <Form
      aria-label="Formulario de registro de acreditación"
      className="flex flex-col gap-6"
      onSubmit={onSubmit}
      validationBehavior="aria"
    >
      {formError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-xs leading-relaxed text-danger">{formError}</p>
        </div>
      ) : null}

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
          className="h-12 rounded-full text-sm font-semibold shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5 dark:shadow-black/40"
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
