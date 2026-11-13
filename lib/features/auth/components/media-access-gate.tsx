"use client";

import { AlertCircleIcon, CameraIcon, QrCodeIcon } from "@/components/icons";
import { AdminLoginForm } from "@/lib/features/auth/components/admin-login-form";
import {
  loginMediaAccreditation,
  type MediaLoginErrorCode,
} from "@/lib/features/auth/media-actions";
import { Button, Input, Label, Tabs, TextField } from "@heroui/react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type MediaAccessCopy = Dictionary["media"]["access"];

type CameraState = "idle" | "starting" | "scanning" | "denied" | "failed";

/** Acepta la URL del QR (`/checkin?c=…`) o un código crudo impreso debajo. */
function tryExtractAccessCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("c");
    if (!url.pathname.endsWith("/checkin") || !code) return null;
    return /^[a-zA-Z0-9]{16,64}$/.test(code) ? code : null;
  } catch {
    return /^[a-zA-Z0-9]{16,64}$/.test(raw.trim()) ? raw.trim() : null;
  }
}

export function MediaAccessGate({ dictionary }: { dictionary: Dictionary }) {
  const copy = dictionary.media.access;
  const router = useRouter();

  return (
    <Tabs className="w-full" defaultSelectedKey="accredited">
      <Tabs.ListContainer>
        <Tabs.List aria-label={copy.tabsAria}>
          <Tabs.Tab id="accredited">
            {copy.tabAccredited}
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="admin">
            {copy.tabAdmin}
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>

      <Tabs.Panel className="pt-5" id="accredited">
        <AccreditedAccessForm
          copy={copy}
          onSuccess={() => router.refresh()}
        />
      </Tabs.Panel>

      <Tabs.Panel className="pt-5" id="admin">
        <AdminLoginForm onSuccess={() => router.refresh()} />
      </Tabs.Panel>
    </Tabs>
  );
}

function errorMessage(
  code: MediaLoginErrorCode,
  copy: MediaAccessCopy,
): string {
  switch (code) {
    case "THROTTLED":
      return copy.errors.throttled;
    case "DB_ERROR":
      return copy.errors.dbError;
    case "VALIDATION":
      return copy.errors.validation;
    default:
      return copy.errors.invalid;
  }
}

function AccreditedAccessForm({
  copy,
  onSuccess,
}: {
  copy: MediaAccessCopy;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (loopRef.current !== null) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function attemptLogin(
    emailValue: string,
    codeValue: string,
  ): Promise<void> {
    if (isPending) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      setError(copy.errors.validation);
      return;
    }
    if (codeValue.trim().length < 16) {
      setError(copy.errors.validation);
      return;
    }

    setIsPending(true);
    setError(null);
    const outcome = await loginMediaAccreditation({
      email: emailValue,
      accessCode: codeValue,
    });
    setIsPending(false);

    if (!outcome.ok) {
      setError(errorMessage(outcome.code, copy));
      return;
    }

    onSuccess();
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void attemptLogin(email, code);
  }

  function startCamera() {
    if (cameraState === "scanning" || cameraState === "starting") return;

    setScanNotice(null);
    setCameraState("starting");

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        void video.play();

        setCameraState("scanning");
        loopRef.current = setInterval(() => void scanFrame(), 130);
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "SecurityError")
        ) {
          setCameraState("denied");
          return;
        }
        console.error("[media-access] Camera error:", error);
        setCameraState("failed");
      });
  }

  async function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    if (video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const detected = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!detected) return;

    const accessCode = tryExtractAccessCode(detected.data);
    if (!accessCode) {
      setScanNotice(copy.scanUnrecognized);
      return;
    }

    stopCamera();
    setCameraState("idle");
    setScanNotice(null);
    setCode(accessCode);

    if (email.trim().length === 0) {
      setError(null);
      setScanNotice(copy.emailRequiredHint);
      return;
    }

    await attemptLogin(email, accessCode);
  }

  const isScanning = cameraState === "scanning";

  return (
    <div className="flex flex-col gap-4">
      <canvas className="hidden" ref={canvasRef} />

      <form className="flex flex-col gap-3" onSubmit={submit}>
        <TextField
          isRequired
          name="email"
          onChange={setEmail}
          value={email}
        >
          <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
            {copy.emailLabel}
          </Label>
          <Input
            aria-required
            autoComplete="email"
            className="mt-1.5 py-2.5 text-sm"
            placeholder={copy.emailPlaceholder}
            type="email"
          />
        </TextField>

        <TextField isRequired name="accessCode" onChange={setCode} value={code}>
          <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
            {copy.codeLabel}
          </Label>
          <Input
            aria-required
            autoComplete="off"
            className="mt-1.5 py-2.5 font-mono text-sm tracking-[0.04em]"
            placeholder={copy.codePlaceholder}
            spellCheck={false}
            type="text"
          />
        </TextField>

        <Button
          isDisabled={
            isPending ||
            email.trim().length === 0 ||
            code.trim().length < 16
          }
          isPending={isPending}
          type="submit"
          variant="primary"
        >
          {copy.submit}
        </Button>

        {error ? (
          <p
            aria-live="assertive"
            className="flex items-start gap-2 text-xs font-medium text-danger"
            role="alert"
          >
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>

      <div className="rounded-xl border border-border/70 bg-foreground/[0.02] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            <QrCodeIcon className="size-3.5" aria-hidden="true" />
            {copy.scanHint}
          </p>
          <Button
            className="shrink-0 rounded-full text-xs font-semibold"
            isPending={cameraState === "starting"}
            onPress={isScanning ? stopCamera : startCamera}
            size="sm"
            variant="secondary"
          >
            <CameraIcon className="size-3.5" aria-hidden="true" />
            {isScanning ? copy.scanStop : copy.scanStart}
          </Button>
        </div>

        {cameraState !== "idle" ? (
          <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-black">
            <video
              className="h-44 w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
            {isScanning ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative size-32">
                  <span className="scanner-corner left-0 top-0" />
                  <span className="scanner-corner right-0 top-0 rotate-90" />
                  <span className="scanner-corner bottom-0 right-0 rotate-180" />
                  <span className="scanner-corner bottom-0 left-0 -rotate-90" />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isScanning ? (
          <p
            aria-live="polite"
            className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted"
            role="status"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-gold" />
            {copy.scanning}
          </p>
        ) : null}

        {cameraState === "denied" || cameraState === "failed" ? (
          <p
            aria-live="polite"
            className="mt-2 text-[11px] leading-relaxed text-gold-ink"
          >
            {cameraState === "denied" ? copy.scanDenied : copy.scanFailed}
          </p>
        ) : null}

        {scanNotice ? (
          <p
            aria-live="polite"
            className="mt-2 text-[11px] leading-relaxed text-gold-ink"
          >
            {scanNotice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
