---
name: design-system
description: Use when creating UI components, pages, dashboards, forms, layouts, design systems, Tailwind interfaces, HeroUI components, responsive screens, or visual improvements.
---

# Design System

## Design Principles

- Follow Apple / Nothing OS inspired aesthetics.
- Prefer whitespace over borders.
- Use an 8px spacing system.
- Prioritize readability and accessibility.
- Mobile-first responsive design.
- Avoid excessive shadows.

## Components

### Forms

- Labels always visible.
- Validate with Zod.
- Show errors inline.
- Loading and disabled states required.

### Tables

- Search and pagination required.
- Empty states required.
- Loading skeletons preferred.

### Colors

- Neutral palette.
- Use semantic colors for success, warning and error.
- Avoid random colors.

## HeroUI

- Prefer HeroUI components over custom implementations.
- Keep styling in Tailwind.
- Avoid inline styles.

## Accessibility

- Keyboard navigation required.
- Proper aria attributes.
- WCAG AA contrast.
