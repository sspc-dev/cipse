# DESIGN.md — CIPSE XV design system

## Purpose
Captura el sistema de diseño visual del sitio público del CIPSE XV (Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026), hosteado por la SSPC / Gobierno de México. Sirve como fuente de verdad para mantener la coherencia visual entre superficies sin duplicar la biblioteca de componentes.

## Modo y tono
- Modo predeterminado: oscuro (dark glassmorphism).
- Idioma: español (`lang="es"`).
- Tono: institucional, estratégico, sobrio, contemporáneo, editorial. Sin emblemas inventados ni afirmaciones no verificadas.

## Colores institucionales (fuente de verdad)

| Token | Valor | Uso |
|---|---|---|
| `--color-tactical` | `#1d4b44` | Primario, acciones principales, elementos activos |
| `--color-guinda` | `#801c35` | Distintivo SSPC, énfasis institucional, máxima jerarquía |
| `--color-gold` | `#c59b27` | Acento conmemorativo XV, asteriscos de campos obligatorios, detalles |
| `--color-gold-ceremonial` | `#d4af37` | Detalles conmemorativos de mayor luminosidad |

Colores semánticos de estado (no se confunden con la marca):
- Éxito: `#10b981` / `#059669`
- Advertencia: `#f59e0b`
- Peligro: `#ef4444` / `#dc2626`

## Superficies oscuro (default)

| Token | Valor | Aplicación |
|---|---|---|
| `--bg-dark-base` | `#06090e` | Fondo principal |
| `--color-surface` | `#0a0e14` | Superficies generales |
| `--color-surface-card` | `#0b1016` | Tarjetas y paneles |
| `--color-surface-elevated` | `#101720` | Superficies elevadas |
| `--color-border-glass` | `rgba(255,255,255,0.12)` | Bordes sutiles |
| `--color-text-muted` | `#94a3b8` | Texto secundario |
| `--color-text-tertiary` | `rgba(255,255,255,0.4)` | Texto de baja jerarquía |

Glass: `backdrop-blur-sm` sobre superficies con borde translúcido. El desenfoque nunca es decorativo; diferencia niveles de superficie.

## Tipografía

- `--font-manrope`: titulares editoriales y voz de(display) del congreso.
- `--font-geist-sans` (`--font-sans`): interfaz y cuerpo de formulario.
- `--font-geist-mono` (`--font-mono`): metadatos y etiquetas técnicas puntuales.
- `--font-public-sans`: alternativa de cuerpo.

Jerarquía: primario blanco, secundario `#94a3b8`, terciario `rgba(255,255,255,0.4)`. Tracking floor `-0.04em` (no usar `tracking-tighter`). Display máximo `6rem`. Más espacio por encima de un encabezado que por debajo.

## Radio, bordes y elevación

- Tarjetas: `12–16px` (`rounded-[16px]`).
- Bordes: `1px` `border-[#ffffff]/12` sobre superficies oscuras; sin `border-left`/`border-right` coloreado por encima de 1px.
- Sombras: con offset y desenfoque suave (p. ej. `0 24px 48px -16px rgba(0,0,0,0.55)`); sin halo de color offset cero ni sombras duras estilo neobrutalista.
- Elevación declarada una vez: borde o sombra, no ambos superpuestos como "tarjeta fantasma".

## Componentes (HeroUI v3)

Botones primarios: verde táctico (`#1d4b44`), texto blanco, foco visible (`focus:ring-2 focus-ring-[#c59b27]/60`), estados hover/disabled/loading.
Botones secundarios/ícono: superficie translúcida táctico al 20 %, borde sutil.
Inputs: fondo translúcido `#06090e/30`, borde `#ffffff/12`, radio `12px`, icono de acento a la derecha, error en `#ef4444` con `AlertCircle`, asteriscos obligatorios en `#c59b27`.
ToggleButtonGroup: modo registro/sesión, fondo táctico translúcido.
Tooltip: validación institucional rápida (e.firma SAT/SEGOB, CNI, AMERIPOL Secure Pass).
Sonner toasts para estado de envío (sin afirmar operación real completada; no hay persistencia de backend).

## Reglas de composición (craft floor)

- No kicker/eyebrow sobre encabezados; el encabezado habla por sí mismo.
- Sin texto en gradiente, sin máscaras geométricas como sustituto de imagen, sin tarjetas del mismo tamaño con icono+encabezado+texto como estructura de página, ni tarjetas anidadas.
- Un momento de movimiento autorizado (entrada de la tarjeta del formulario), no efectos dispersos ni una misma entrada en cada sección.
- Estados explícitos: carga, error, vacío, deshabilitado, enfoque de teclado visible.
- Superficies del navegador tematizadas: anillo de enfoque, selección.
- Imágenes: no se introducen recursos oficiales inventados; sin depender de URLs externas no verificadas.

## Archivos relacionados

- `app/globals.css`: tokens de color y tipografía vía `@theme inline`.
- `app/layout.tsx`: fuentes vía `next/font` (Geist, Geist Mono, Manrope, Public Sans), `lang="es"`, `Toaster` de sonner.
- `app/register/page.tsx`: página de acreditación/login rediseñada (mundo oscuro, formulario tarjeta, panel institucional).
