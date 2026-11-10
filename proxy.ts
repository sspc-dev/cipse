import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders, buildSecurityHeaders } from "@/lib/security-headers";
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  hasLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/lib/i18n/config";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: LANG_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
  // La cookie solo la lee el proxy; no hay acceso desde JavaScript.
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Rutas que participan del enrutamiento por idioma. El resto (panel interno,
 * API, archivos servidos desde la base de datos y recursos estáticos) solo
 * recibe las cabeceras de seguridad.
 */
function isLocaleRoutedPath(pathname: string): boolean {
  const [, firstSegment] = pathname.split("/");

  // Los archivos con extensión (favicon.ico, robots.txt, imgs/*) quedan fuera
  // por el punto del nombre.
  return (
    !["api", "dashboard", "_next", "imgs"].includes(firstSegment) &&
    !pathname.startsWith("/multimedia/file") &&
    !pathname.includes(".")
  );
}

/** Prioridad: cookie de elección → idioma del dispositivo → español. */
function preferredLocale(request: NextRequest): Locale {
  const stored = request.cookies.get(LANG_COOKIE)?.value;
  if (hasLocale(stored)) return stored;

  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

/**
 * Respuesta de redirección con cabeceras de seguridad y tipo explícito.
 * Antes la redirección al registro la hacía `app/[lang]/page.tsx` con
 * `redirect()`, que devolvía un HTML completo (alerta ZAP "Big Redirect").
 */
function redirectResponse(url: URL, locale: Locale, nonce: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(LANG_COOKIE, locale, COOKIE_OPTIONS);
  applySecurityHeaders(response.headers, nonce);
  // El cuerpo de una redirección es solo la ruta destino; declararlo evita
  // la alerta informativa de ZAP por Content-Type ausente.
  response.headers.set("Content-Type", "text/plain; charset=utf-8");
  return response;
}

export function proxy(request: NextRequest) {
  // Nonce único por request: Next.js extrae el nonce de la cabecera CSP del
  // request y lo aplica a sus scripts inline durante el renderizado dinámico;
  // x-nonce lo consume el layout raíz para el script del ThemeProvider.
  const nonce = crypto.randomUUID();

  if (isLocaleRoutedPath(request.nextUrl.pathname)) {
    const { pathname } = request.nextUrl;
    const [, firstSegment] = pathname.split("/");
    const url = request.nextUrl.clone();

    if (hasLocale(firstSegment)) {
      // La redirección al registro se emite aquí, con cuerpo mínimo.
      if (pathname === `/${firstSegment}`) {
        url.pathname = `/${firstSegment}/register`;
        return redirectResponse(url, firstSegment, nonce);
      }

      return nextWithSecurity(request, nonce);
    }

    const locale = preferredLocale(request);
    url.pathname =
      pathname === "/" ? `/${locale}/register` : `/${locale}${pathname}`;

    return redirectResponse(url, locale, nonce);
  }

  return nextWithSecurity(request, nonce);
}

/**
 * Respuesta de continuación con el nonce disponible para el render: CSP y
 * x-nonce en el request (los lee Next y el layout raíz) y cabeceras de
 * seguridad en la respuesta.
 */
function nextWithSecurity(request: NextRequest, nonce: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    buildSecurityHeaders({ nonce })[0].value,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers, nonce);
  return response;
}

export const config = {
  // Todas las rutas reciben las cabeceras de seguridad; el enrutamiento por
  // idioma se decide dentro de proxy() con isLocaleRoutedPath().
  matcher: ["/:path*"],
};
