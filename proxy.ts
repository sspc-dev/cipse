import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  hasLocale,
  type Locale,
} from "@/lib/i18n/config";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: LANG_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
};

/** Prioridad: cookie de elección → Accept-Language → español. */
function preferredLocale(request: NextRequest): Locale {
  const stored = request.cookies.get(LANG_COOKIE)?.value;
  if (hasLocale(stored)) return stored;

  const accepted = (request.headers.get("accept-language") ?? "").toLowerCase();
  const prefersEnglish = /(^|,)\s*en(-|,|;|$)/.test(accepted);
  const prefersSpanish = /(^|,)\s*es(-|,|;|$)/.test(accepted);

  if (prefersEnglish && !prefersSpanish) return "en";
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  if (hasLocale(firstSegment)) {
    const response = NextResponse.next();
    response.cookies.set(LANG_COOKIE, firstSegment, COOKIE_OPTIONS);
    return response;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(LANG_COOKIE, locale, COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: [
    // El panel interno, archivos servidos desde la base de datos y recursos
    // estáticos no participan del enrutamiento por idioma.
    "/((?!api|admin|multimedia/file|_next|imgs|favicon\\.ico|.*\\..*).*)",
  ],
};
