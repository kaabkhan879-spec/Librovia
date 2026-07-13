# Design System: Librovia

This document details the visual identity, tokens, spacing rules, and layout system used across the Librovia SaaS application.

---

## 1. Brand Identity

### Brand Personality

- **Minimalist & Clean:** Interfaces are uncluttered, focusing entirely on readability and user content (like Notion and Kindle).
- **Premium & Professional:** Subtle borders, delicate shadows, and unified colors that feel high-end (like Linear).
- **Calm & Distraction-Free:** Warm paper undertones and low-contrast details that reduce cognitive load during reading sessions.

### Taglines

- _"Your Books. Your Space. Anywhere."_
- _"A clutter-free cloud sanctuary for your private digital library."_
- _"Read without boundaries, stored with complete privacy."_

### Logo Concept

A minimal, open-book emblem combined with a structural arch, representing a modern library gateway. The icon uses a unified single-stroke layout.

---

## 2. Color Palette (Tailwind Design Tokens)

Librovia uses CSS variables mapped to Tailwind v4 variables to dynamically switch colors based on whether `.dark` is present on the document root:

| Token Name    | Light Mode Value | Dark Mode Value | Usage Description                     |
| :------------ | :--------------- | :-------------- | :------------------------------------ |
| `primary-50`  | `#f5f3ff`        | `#1e1b4b`       | Accent background highlighting        |
| `primary-500` | `#6366f1`        | `#818cf8`       | Active focus rings, highlights        |
| `primary-600` | `#4f46e5`        | `#6366f1`       | Brand button color, primary links     |
| `sec-50`      | `#f8fafc`        | `#0f172a`       | Sidebar background, secondary widgets |
| `sec-800`     | `#1e293b`        | `#e2e8f0`       | Light dark-contrast text, borders     |
| `bg-app`      | `#fcfcfd`        | `#09090b`       | Global body background color          |
| `bg-surface`  | `#ffffff`        | `#18181b`       | Cards, input fields, modals           |
| `border-base` | `#e2e8f0`        | `#27272a`       | Layout line breaks, borders           |
| `text-main`   | `#0f172a`        | `#f4f4f5`       | Principal readable text               |
| `text-sub`    | `#475569`        | `#a1a1aa`       | Secondary descriptions, captions      |

---

## 3. Typography & Spacing System

### Fonts

- **Sans Font:** `Outfit` (Headings) / `Inter` (UI elements, buttons, inputs).
- **Serif Font:** `Playfair Display` / `Georgia` (Used inside the PDF Reader page to optimize readability).

### Spacing Scale

Librovia follows a rigid 4px multiplier grid:

- **Padding/Margins:**
  - `px-2` (8px): Dense inline controls, buttons.
  - `p-4` (16px): Standard padding for inputs, list items, small cards.
  - `p-6` sm / `p-8` lg (24px - 32px): Dashboard margins, upload dropzones.
- **Layout Containers:**
  - Max-width: `max-w-7xl` (1280px) for standard dashboard page containers.
  - Max-width: `max-w-2xl` (672px) for reader focus mode to ensure optimal line-length scanning.

---

## 4. Border Radius & Shadows

### Border Radius Tokens

- `radius-xs` (2px): Inline status pills, tight checkboxes.
- `radius-sm` (6px): Form inputs, selectors, small buttons.
- `radius-md` (10px): Primary action buttons, standard grid cards.
- `radius-lg` (16px): Dashboard widgets, upload boxes, side panels.
- `radius-xl` (24px): Settings blocks, modal windows.

### Shadow Tokens (Low-Opacity)

- **Shadow SM:** `0 1px 2px 0 rgba(0, 0, 0, 0.03)` (Used on inputs and active list items).
- **Shadow MD:** `0 4px 6px -1px rgba(0, 0, 0, 0.05)` (Default card shadow).
- **Shadow LG:** `0 10px 15px -3px rgba(0, 0, 0, 0.05)` (Hover elements and modals).

---

## 5. Component Interaction Guide

### Focus States

- Focus states are styled using a clear offset border ring: `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`.
- Outlines are disabled (`outline-none`) to maintain a clean, visual-first display.

### Loading Animations

- Interactive buttons utilize a subtle spinning SVG indicator, fading the label opacity to 50% to prevent repeated double-submit actions.

### Micro-Transitions

- Elements utilize `transition-colors duration-200` to smoothly ease color schemes (such as border changes on input focus and hover states on buttons).
