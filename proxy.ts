import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";
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

/** Respuesta de redirección con cabeceras de seguridad y tipo explícito. */
function redirectResponse(url: URL, locale: Locale): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(LANG_COOKIE, locale, COOKIE_OPTIONS);
  applySecurityHeaders(response.headers);
  // El cuerpo de una redirección es solo la ruta destino; declararlo evita
  // la alerta informativa de ZAP por Content-Type ausente.
  response.headers.set("Content-Type", "text/plain; charset=utf-8");
  return response;
}

/** Prioridad: cookie de elección → idioma del dispositivo → español. */
function preferredLocale(request: NextRequest): Locale {
  const stored = request.cookies.get(LANG_COOKIE)?.value;
  if (hasLocale(stored)) return stored;

  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  if (hasLocale(firstSegment)) {
    const url = request.nextUrl.clone();

    // La redirección al registro se emite aquí, con cuerpo mínimo. Antes la
    // hacía `app/[lang]/page.tsx` con `redirect()`, que devolvía un HTML
    // completo (alerta ZAP "Big Redirect").
    if (pathname === `/${firstSegment}`) {
      url.pathname = `/${firstSegment}/register`;
      return redirectResponse(url, firstSegment);
    }

    const response = NextResponse.next();
    response.cookies.set(LANG_COOKIE, firstSegment, COOKIE_OPTIONS);
    applySecurityHeaders(response.headers);
    return response;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}/register` : `/${locale}${pathname}`;

  return redirectResponse(url, locale);
}

export const config = {
  matcher: [
    // El panel interno, archivos servidos desde la base de datos y recursos
    // estáticos no participan del enrutamiento por idioma.
    "/((?!api|admin|multimedia/file|_next|imgs|favicon\\.ico|.*\\..*).*)",
  ],
};
