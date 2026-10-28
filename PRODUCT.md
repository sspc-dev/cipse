# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users: police and law-enforcement delegates from many countries attending CIPSE XV in México City, plus the general public seeking congress information. Their job: accredit for credentials and biometric badge issuance, and learn about the congress (agenda, capabilities, gallery, institutional information).

## Product Purpose

Public information site plus delegate accreditation portal for CIPSE XV (Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026), hosted by SSPC (Secretaría de Seguridad y Protección Ciudadana, Gobierno de México). A hemispheric forum of maximum tactical hierarchy against transnational organized crime, kidnapping, and extortion.

## Positioning

Hemispheric police forum of maximum tactical hierarchy; institutional accreditation with biometric badge issuance; backed by Gobierno de México and SSPC. The accreditation flow validates institutional email (.gob/.org), password strength, and offers rapid institutional validation (e.firma SAT/SEGOB, CNI digital credential, AMERIPOL Secure Pass), with biometric validation on-site.

## Operating Context

Spanish-language web portal (lang="es"), dark theme by default. Registration/login flow built with react-hook-form + zod validation, HeroUI components, sonner toasts. Immediate focus: improve UI/UX of the register page while keeping the incumbent main design.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript strict, pnpm.
- Server Components by default; client interactivity isolated to small client components.
- HeroUI v3 is the primary component library; no redundant component libraries.
- Institutional branding: GOBIERNO DE MÉXICO, SSPC, CIPSE XV, México 2026; tactical green (#1D4B44), guinda (#801C35), gold (#F7BD48 / #C59B27); Manrope as display voice; Geist/Geist Mono/Public Sans for UI/mono.
- Accessibility, performance, and responsive design prioritized; keyboard-operable controls, visible focus, sufficient contrast, prefers-reduced-motion respected.
- No simulated persistence: accreditation registration is not treated as a completed real operation unless a real backend exists.
- Institutional/SSPC constraints apply (branding rules, institutional email requirement).

## Brand Commitments

Existing name: CIPSE XV, Congreso Internacional Policial contra el Secuestro y la Extorsión, México 2026. Host: Gobierno de México / SSPC. Visual identity commitments: tactical green, guinda, gold commemorative accents, Manrope display font, dark mode, Spanish language. Do not invent emblems, institutions, speakers, venues, dates, or statistics beyond confirmed facts.

## Evidence on Hand

- Incumbent register/login page: app/register/page.tsx (built register UI/UX to improve; placeholder homepage at app/page.tsx).
- Root layout with HeroUI Toaster and sonner: app/layout.tsx.
- Global styles: app/globals.css; fonts: Geist, Geist Mono, Manrope, Public Sans via next/font.
- Local asset: public/favicon.ico.
- Banner resource referenced in AGENTS.md (Vercel Blob URL).
- AGENTS.md design system: institutional color tokens, dark glassmorphism, typography variables, HeroUI + Tailwind CSS 4 integration rules.
- No PRODUCT.md or DESIGN existed before this init; no real backend or persistence configured.

## Product Principles

1. Institutional authority and trust — design conveys security, authority, international cooperation, and operational excellence, not a generic event template.
2. Server Components by default; isolate client interactivity to the smallest possible boundary.
3. HeroUI as the single component library; do not duplicate components it already offers.
4. Honest UI states — loading, success, error, empty, validation; never fake a completed accreditation.
5. Accessibility, performance, and responsive design are requirements, not afterthoughts.

## Accessibility & Inclusion

Spanish-language content; keyboard-operable dialogs, menus, and navigation; visible focus indicators; sufficient text contrast; respects prefers-reduced-motion; semantic HTML and correct heading hierarchy.
