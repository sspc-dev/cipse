"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@heroui/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createRegisterSchema,
  type RegisterSchema,
} from "@/lib/features/register/schema";
import { registerAccreditation } from "@/lib/features/register/actions";
import { formatMessage, type Dictionary, type Locale } from "@/lib/i18n";
import { CountryField } from "./country-field";
import {
  AlertCircleIcon,
  BriefcaseIcon,
  BuildingIcon,
  IdCardIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/icons";
import { TextFieldControl } from "./register-field";
import { folioLabel, type CredentialData } from "./register-success";

type FormValues = RegisterSchema;

const groupHeadingClass =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-ink/70";

export function RegisterForm({
  dictionary,
  locale,
  onSuccess,
}: {
  dictionary: Dictionary;
  locale: Locale;
  onSuccess: (credential: CredentialData) => void;
}) {
  const copy = dictionary.register;
  const schema = useMemo(
    () => createRegisterSchema(copy.errors),
    [copy.errors],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      lastname: "",
      country: "",
      institution: "",
      position: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerAccreditation(values, locale);

    if (result.ok) {
      const deliveryToast =
        result.emailDelivery.state === "sent"
          ? copy.toasts.sent
          : result.emailDelivery.state === "skipped"
            ? copy.toasts.skipped
            : copy.toasts.failed;

      toast.success(deliveryToast, {
        description: formatMessage(copy.toasts.description, {
          folio: folioLabel(result.id),
        }),
        duration: 8000,
      });
      onSuccess({
        id: result.id,
        name: values.name.trim(),
        lastname: values.lastname.trim(),
        accessCode: result.accessCode,
        email: result.email,
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
      aria-label={copy.formAriaLabel}
      className="flex flex-col gap-8"
      onSubmit={onSubmit}
      validationBehavior="aria"
    >
      {formError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3.5"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-xs leading-relaxed text-danger">{formError}</p>
        </div>
      ) : null}

      <section className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          <h3 className={groupHeadingClass}>{copy.personalData}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextFieldControl
              autoComplete="given-name"
              control={control}
              icon={<IdCardIcon className="size-4" />}
              label={copy.nameLabel}
              name="name"
              placeholder={copy.namePlaceholder}
            />

            <TextFieldControl
              autoComplete="family-name"
              control={control}
              icon={<IdCardIcon className="size-4" />}
              label={copy.lastnameLabel}
              name="lastname"
              placeholder={copy.lastnamePlaceholder}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className={groupHeadingClass}>{copy.institutionalData}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextFieldControl
              autoComplete="organization-title"
              control={control}
              icon={<BriefcaseIcon className="size-4" />}
              label={copy.positionLabel}
              name="position"
              placeholder={copy.positionPlaceholder}
            />

            <TextFieldControl
              autoComplete="organization"
              control={control}
              icon={<BuildingIcon className="size-4" />}
              label={copy.institutionLabel}
              name="institution"
              placeholder={copy.institutionPlaceholder}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className={groupHeadingClass}>{copy.contactHeading}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <CountryField
              control={control}
              dictionary={dictionary}
              locale={locale}
            />

            <TextFieldControl
              autoComplete="email"
              control={control}
              description={copy.emailDescription}
              icon={<MailIcon className="size-4" />}
              label={copy.emailLabel}
              name="email"
              placeholder={copy.emailPlaceholder}
              type="email"
            />
            <TextFieldControl
              autoComplete="tel"
              control={control}
              icon={<PhoneIcon className="size-4" />}
              isRequired={false}
              label={copy.phoneLabel}
              name="phone"
              placeholder={copy.phonePlaceholder}
              type="tel"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button
          className="h-12 rounded-full text-sm font-semibold shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-2 focus-visible:outline-gold/60 focus-visible:outline-offset-2 dark:shadow-black/40"
          fullWidth
          isDisabled={isSubmitting}
          isPending={isSubmitting}
          type="submit"
        >
          {copy.submit}
        </Button>
      </div>
    </Form>
  );
}
