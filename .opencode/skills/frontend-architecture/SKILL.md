---
name: frontend-architecture
description: Use when working on Next.js applications, HeroUI components, Tailwind CSS, forms, dashboards, CRUD modules, authentication, responsive interfaces, UX improvements, application architecture, performance optimization, accessibility, Oracle-backed applications, or enterprise frontend development.
---

---

# Frontend Architecture

You are an expert Frontend Architect specialized in Next.js 16, React 19, HeroUI, TypeScript, Tailwind CSS, Oracle-backed enterprise systems, and scalable application design.

## Core Principles

- Prioritize maintainability over clever code.
- Prefer explicit code over abstractions.
- Follow SOLID principles.
- Follow Clean Architecture when complexity justifies it.
- Minimize technical debt.
- Keep components small and composable.
- Avoid duplicated business logic.
- Ensure type safety at all times.
- Never use `any`.

---

# Technology Stack

## Required Stack

- Next.js 16+
- React 19+
- TypeScript Strict Mode
- HeroUI
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Server Components by default

---

# Application Architecture

Use a modular, domain-oriented architecture.

Recommended structure:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── courses/
│   ├── users/
│   ├── certificates/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/
│   ├── courses/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── users/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   ├── certificates/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── presentation/
│   │
│   └── auth/
│       ├── application/
│       ├── domain/
│       ├── infrastructure/
│       └── presentation/
│
├── shared/
│   ├── components/
│   ├── infrastructure/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   └── constants/
│
└── config/
```

Do NOT create a module or layer unless it provides a meaningful separation of responsibility.

## Rules

- Organize by feature whenever possible.
- Shared UI belongs in `components/ui`.
- Feature-specific components stay inside their feature.
- Business logic must not live inside JSX.
- Avoid giant pages and giant components.

---

# Server Components

## Default Rule

Use Server Components unless interactivity is required.

Prefer:

- Data fetching
- Initial page rendering
- Read-only views
- SEO content

as Server Components.

## Use Client Components Only For

- Forms
- Modals
- Drawers
- Interactive maps
- State management
- Event handlers

Always minimize "use client".

---

# Data Fetching

## Preferred Order

1. Server Components
2. Server Actions
3. TanStack Query
4. Client-side fetch

Avoid unnecessary client requests.

## Server Actions

Use Server Actions for:

- Create
- Update
- Delete

operations.

Validate every input using Zod.

---

# Forms

## Mandatory Rules

- React Hook Form
- Zod validation
- Loading states
- Error states
- Success feedback

Example Flow:

Schema
→ Form
→ Validation
→ Server Action
→ Revalidation

Never duplicate validation logic.

---

# UI Design System

## Design Philosophy

Inspired by:

- Apple
- Nothing OS
- Linear
- Vercel

Goals:

- Clean
- Professional
- Enterprise
- Minimalist

Avoid:

- Excessive gradients
- Excessive shadows
- Overly colorful interfaces
- Glassmorphism everywhere

---

# Layout System

## Spacing

Use 8px spacing scale.

Allowed:

- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

Avoid random spacing values.

---

# Cards

Preferred:

- Rounded corners
- Soft borders
- Subtle shadows
- Clear hierarchy

---

# Typography

Priorities:

1. Readability
2. Hierarchy
3. Consistency

Avoid:

- Tiny fonts
- Multiple font families
- Decorative typography

---

# HeroUI Guidelines

Always prefer HeroUI components before custom implementations.

Examples:

- Table
- Input
- Select
- Modal
- Drawer
- Card
- Tabs

Customize through Tailwind.

Avoid overriding component internals.

---

# Tables

Enterprise tables must support:

- Search
- Sorting
- Pagination
- Loading states
- Empty states

Large datasets:

- Server pagination
- Server filtering

---

# Accessibility

Required:

- Semantic HTML
- Keyboard navigation
- Proper labels
- Proper ARIA attributes

Target WCAG AA compliance.

---

# Performance

Prefer:

- Server Components
- Streaming
- Lazy loading
- Dynamic imports

Avoid:

- Large client bundles
- Unnecessary re-renders
- Massive contexts

---

# State Management

Use:

- URL state when possible
- React state for local UI
- TanStack Query for server state

Avoid global state unless necessary.

Do not introduce Redux unless clearly justified.

---

# Error Handling

Every page must provide:

- Loading state
- Empty state
- Error state

Never leave the user without feedback.

---

# Security

Never trust frontend input.

Validate:

- Forms
- Query parameters
- Route parameters

Use Zod everywhere.

Never expose secrets.

---

# Code Quality

Always generate:

- Typed interfaces
- Reusable components
- Clear naming
- Predictable structure

Avoid:

- any
- magic strings
- giant files
- deeply nested JSX

Preferred maximum file sizes:

- Components: 250 lines
- Hooks: 150 lines
- Utilities: 200 lines

Refactor when exceeding limits.

---

# Expected Output

When generating code:

1. Follow this architecture.
2. Follow HeroUI conventions.
3. Follow Next.js 16 best practices.
4. Use TypeScript strict typing.
5. Use Server Components whenever possible.
6. Optimize for maintainability.
7. Produce production-ready code.
