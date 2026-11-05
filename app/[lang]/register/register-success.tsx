"use client";

import { Button } from "@heroui/react";
import type { CredentialData } from "@/lib/features/register/credential";
import {
  QrVisual,
  saveCredentialPng,
} from "@/lib/features/register/components/qr-visual";
import { formatMessage } from "@/lib/i18n/format";
import { type Dictionary, type Locale } from "@/lib/i18n";
import { CheckIcon } from "@/components/icons";

export {
  credentialCheckinUrl,
  folioLabel,
} from "@/lib/features/register/credential";
export type { CredentialData } from "@/lib/features/register/credential";

export function QrCredentialCard({
  credential,
  dictionary,
  locale,
}: {
  credential: CredentialData;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const copy = dictionary.register.success;

  return (
    <div
      className="card-enter flex flex-col items-center gap-6 py-2 text-center"
      role="status"
    >
      <div className="check-pop flex size-16 items-center justify-center rounded-full border border-accent/30 bg-accent-soft">
        <CheckIcon className="size-7 text-accent-soft-foreground" />
      </div>

      <div className="flex flex-col gap-2">
        <h2
          className="font-display text-2xl font-bold tracking-tight text-foreground focus:outline-none"
          tabIndex={-1}
        >
          {copy.heading}
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">
          {copy.description}
        </p>
      </div>

      <QrVisual altTemplate={copy.qrAlt} credential={credential} />

      <dl className="flex w-full flex-col gap-1.5 rounded-xl border border-border bg-foreground/3 px-4 py-3.5 text-left">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
            {copy.delegate}
          </dt>
          <dd className="text-sm font-semibold text-foreground">
            {credential.name} {credential.lastname}
          </dd>
        </div>
        {credential.emailDelivery && credential.email ? (
          <div className="flex items-start justify-between gap-3">
            <dt className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
              {copy.email}
            </dt>
            <dd
              className={
                credential.emailDelivery.state === "sent"
                  ? "max-w-[70%] text-right text-xs font-semibold text-accent-soft-foreground"
                  : "max-w-[70%] text-right text-xs font-semibold text-gold-ink"
              }
            >
              {formatMessage(
                credential.emailDelivery.state === "sent"
                  ? copy.emailSent
                  : credential.emailDelivery.state === "skipped"
                    ? copy.emailSkipped
                    : copy.emailFailed,
                { email: credential.email },
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 rounded-full text-sm font-semibold"
          onPress={() =>
            void saveCredentialPng(
              credential,
              locale === "en" ? "credential" : "credencial",
            )
          }
          variant="secondary"
        >
          {copy.download}
        </Button>
      </div>
    </div>
  );
}
