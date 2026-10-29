"use client";

import {
  registerAttendance,
  type CheckinActionResponse,
} from "@/lib/features/checkin/actions";
import { AdminLoginForm } from "@/lib/features/auth/components/admin-login-form";
import { labelStatus } from "@/lib/features/checkin/status";
import { AlertCircleIcon, CheckIcon, ClockIcon } from "@/app/register/icons";
import { Button } from "@heroui/react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = "idle" | "starting" | "scanning" | "denied" | "failed";

type ScanOutcome = {
  accessCode: string;
  result: CheckinActionResponse;
};

function tryExtractAccessCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("c");
    if (url.pathname !== "/checkin" || !code) return null;
    return /^[A-Za-z0-9]{16,64}$/.test(code) ? code : null;
  } catch {
    // También se acepta un código crudo impreso bajo el QR.
    return /^[A-Za-z0-9]{16,64}$/.test(raw.trim()) ? raw.trim() : null;
  }
}

function formatCheckinTime(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

export function ScannerPanel() {
  const router = useRouter();
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [unrecognized, setUnrecognized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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

  function startCamera() {
    if (cameraState === "scanning" || cameraState === "starting") return;

    setCameraState("starting");
    setUnrecognized(false);

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
        console.error("[scanner-panel] Camera error:", error);
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
      setUnrecognized(true);
      return;
    }

    stopCamera();
    setCameraState("idle");
    setIsRegistering(true);
    // Registro automático al escanear: el panel no requiere confirmación.
    const result = await registerAttendance(accessCode);
    setIsRegistering(false);
    setOutcome({ accessCode, result });
    if (result.ok) {
      router.refresh();
    }
  }

  function resetScan() {
    setOutcome(null);
    setUnrecognized(false);
  }

  const registered = outcome?.result;
  const isApproved = registered?.ok
    ? registered.record.status === "APPROVED"
    : false;
  const sessionExpired =
    registered?.ok === false && registered.code === "SESSION_REQUIRED";

  return (
    <div className="flex flex-col gap-4">
      <canvas className="hidden" ref={canvasRef} />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-black dark:border-white/10">
        <video
          className="h-56 w-full object-cover sm:h-72"
          muted
          playsInline
          ref={videoRef}
        />

        {cameraState === "scanning" ? (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-10 top-1/2 h-64 -translate-y-1/2 rounded-2xl border-2 border-white/60" />
          </div>
        ) : null}

        {cameraState !== "scanning" ? (
          <div className="absolute inset-0 grid place-items-center bg-black/80 px-6 text-center">
            {cameraState === "failed" || cameraState === "denied" ? (
              <div className="flex max-w-xs flex-col items-center gap-3">
                <AlertCircleIcon className="size-6 text-danger" />
                <p className="text-xs leading-relaxed text-white/85">
                  {cameraState === "denied"
                    ? "Permiso de cámara denegado. Habilite el acceso desde la configuración del navegador e intente de nuevo."
                    : "No fue posible iniciar la cámara en este dispositivo."}
                </p>
                <Button
                  className="rounded-full"
                  onPress={startCamera}
                  size="sm"
                  variant="secondary"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="max-w-xs text-xs leading-relaxed text-white/85">
                  Escanee la credencial QR del delegado: la asistencia se
                  registra automáticamente.
                </p>
                <Button
                  className="rounded-full text-sm font-semibold"
                  isPending={cameraState === "starting"}
                  onPress={startCamera}
                  variant="primary"
                >
                  {cameraState === "starting" ? "Abriendo cámara" : "Activar cámara"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {cameraState === "scanning" ? (
        <p className="flex items-center justify-center gap-2 text-[11px] text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-tactical-bright" />
          Apunte al código de la credencial y manténgalo estable
        </p>
      ) : null}

      {isRegistering ? (
        <p
          aria-live="polite"
          className="text-center text-[11px] font-medium text-muted"
          role="status"
        >
          Registrando asistencia…
        </p>
      ) : null}

      {unrecognized && !outcome ? (
        <p
          className="flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/10 px-3.5 py-3 text-xs leading-relaxed text-gold-ink"
          role="status"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          El QR detectado no pertenece a las credenciales del CIPSE XV.
        </p>
      ) : null}

      {registered ? (
        registered.ok ? (
          <div className="reveal flex flex-col gap-3">
            {registered.alreadyToday ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3.5">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-gold-ink" />
                <div className="min-w-0 flex flex-col gap-0.5 text-left">
                  <span className="text-xs font-semibold text-gold-ink">
                    Ya fue registrada hoy
                    {registered.attendedAt
                      ? ` · ${formatCheckinTime(registered.attendedAt)}`
                      : ""}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {registered.record.name} {registered.record.lastname} ·{" "}
                    {registered.record.country}
                  </span>
                  <span className="font-mono text-xs font-semibold tracking-[0.08em] text-gold-ink">
                    {registered.record.folio} ·{" "}
                    {labelStatus(registered.record.status)} ·{" "}
                    Día {registered.attendanceDays} de asistencia
                  </span>
                </div>
              </div>
            ) : (
              <div className="check-pop flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3.5">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent-soft-foreground" />
                <div className="min-w-0 flex flex-col gap-0.5 text-left">
                  <span className="text-xs font-semibold text-accent-soft-foreground">
                    Asistencia del día registrada
                    {registered.attendedAt
                      ? ` · ${formatCheckinTime(registered.attendedAt)}`
                      : ""}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {registered.record.name} {registered.record.lastname} ·{" "}
                    {registered.record.country}
                  </span>
                  <span className="font-mono text-xs font-semibold tracking-[0.08em] text-gold-ink">
                    {registered.record.folio} ·{" "}
                    {labelStatus(registered.record.status)} ·{" "}
                    Día {registered.attendanceDays} de asistencia
                  </span>
                </div>
              </div>
            )}

            {!isApproved ? (
              <p
                className="flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/10 px-3.5 py-3 text-xs leading-relaxed text-gold-ink"
                role="warning"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                La acreditación no está aprobada. Confirme con el responsable.
              </p>
            ) : null}

            <Button
              className="h-11 rounded-full text-sm font-semibold"
              onPress={resetScan}
              variant="secondary"
            >
              Escanear otra credencial
            </Button>
          </div>
        ) : (
          <div className="reveal flex flex-col gap-3">
            <p
              className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-xs leading-relaxed text-danger"
              role="alert"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              {sessionExpired
                ? "La sesión de acreditador expiró. Inicie sesión y vuelva a escanear."
                : registered.message}
            </p>

            {sessionExpired ? (
              <AdminLoginForm onSuccess={resetScan} />
            ) : (
              <Button
                className="h-11 rounded-full text-sm font-semibold"
                onPress={resetScan}
                variant="secondary"
              >
                Intentar de nuevo
              </Button>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
