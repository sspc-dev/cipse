---
version: 1
slug: "app-register-page-tsx"
primary_target: "app/register/page.tsx"
related_targets: []
---

# Surface brief — CIPSE XV register page redesign

Scope: app/register/page.tsx (register/login accreditation page), Operate mode — visitor completes a task.
Audience: police and law-enforcement delegates accrediting for CIPSE XV, México 2026.
Job: submit institutional credentials (full name, agency, institutional email .gob/.org, password) or log in; quick institutional validation entry points (e.firma SAT/SEGOB, CNI digital credential, AMERIPOL Secure Pass); biometric validation on-site.
Constraints: keep all copy, institutional badges (GOBIERNO DE MÉXICO, SSPC), login↔register toggle, form fields, zod validation rules, and quick-validation buttons; replace only layout, tone, and hierarchy; dark by default; Spanish; no invented emblems, speakers, venues, dates, or statistics; no simulated persistence; HeroUI v3 + Tailwind CSS 4; Server Components default, client interactivity isolated.

## Direction contract

THESIS: The register page owns the delegate's first institutional act — accreditation solicitation for CIPSE XV — and refuses the standard split hero + centered-card login template. It presents one continuous dark-glass credential field where identity, institutional proof, and validation entry points sit at task scale, so a visitor understands what to do within one viewport.

OWN-WORLD: CIPSE XV institutional world: tactical green (#1D4B44) primary, guinda (#801C35) SSPC badge, commemorative gold (#C59B27 / #F7BD48) accents and required-field asterisks, dark glass surfaces (#06090E base, #0B1016 card, #101720 elevated), Manrope display voice, Geist UI body, Spanish copy, dark by default, visible focus, no invented emblems.

STORY: Visitor understands this is the official SSPC accreditation portal for CIPSE XV México 2026, believes their institutional email and credentials will be validated (e.firma, CNI, AMERIPOL), and completes registration or login with clear field labels, gold required asterisks, inline errors, password strength, and quick-validation buttons — no simulated success claim beyond a toast.

FORM: Code-led build (Operate surface). Existing component vocabulary kept: HeroUI Form/Input/Button/ToggleButton/ToggleButtonGroup/Tooltip, lucide-react icons, react-hook-form + zod, sonner toasts, framer-motion transitions. Visuals rebuilt: dark glass cards, refined spacing rhythm (more space above heading than below), measured type scale, visible focus rings, hover/disabled/loading/error/empty states, keyboard-operable, responsive (mobile 390–768px, desktop 1280–1440px), no kicker/eyebrow, no gradient text, no geometric masks, no same-size icon+heading+text cards.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

seed: none (unavailable)
