# Technology Stack: Librovia

This document details the technology choices for the Librovia digital library SaaS application and explains their benefits and configurations.

## 1. Frontend Architecture

### Core: React (v19) & Vite

- **Vite:** Selected as the build tool for its extremely fast Hot Module Replacement (HMR), instant server starts, and optimized rollup production bundles.
- **React 19:** Leverages modern React patterns including compiler optimizations, improved form actions, and hook structures for responsive components.

### Styling: Tailwind CSS (v4.x)

- **CSS-First Configuration:** Tailwind v4 moves theme customization directly into standard CSS using `@theme` directives instead of standard JS-based configs.
- **Native Vite Plugin:** `@tailwindcss/vite` compiles styles directly inside Vite's build pipeline, offering up to 10x faster compiling and zero Tailwind setup file clutter.
- **Responsive Layouts:** Out-of-the-box support for dark mode class toggling, flexbox/grid systems, and fluid viewport variants.

### Routing: React Router (v6+)

- **Declarative Routing:** Configures private and public route wrappers.
- **Nested Layouts:** Separates the marketing container (`PublicLayout`) from the authenticated sidebar experience (`AppLayout`) cleanly.

---

## 2. Document Rendering

- **Library:** `react-pdf` (built on Mozilla's `PDF.js`).
- **Justification:** Rendering multi-megabyte PDFs in browser is resource-intensive. `react-pdf` wraps PDF.js into React components and executes rendering inside Web Workers. This keeps the browser's main UI thread responsive even while loading 1,000+ page books.

---

## 3. Backend-as-a-Service (BaaS)

### Supabase

- **PostgreSQL Database:** Fully-featured SQL database allowing relations, triggers, indexes, and robust complex querying.
- **Supabase Auth:** Email/password session state management using secure JWT cookies/tokens.
- **Supabase Storage:** S3-compatible asset bucket configured to save PDF uploads under private namespaces (`/books/{user_id}/`).
- **Row Level Security (RLS):** Policies mapped directly in PostgreSQL to isolate tenant access, preventing malicious users from requesting other users' books.

---

## 4. Development Quality & Linting

- **TypeScript:** Ensures type safety across models, interfaces, routing params, and database schemas.
- **ESLint:** Enforces code quality, flags unused variables, React anti-patterns, and accessibility warnings.
- **Prettier:** Code formatter integrated with ESLint to automate code style consistency (spaces, semicolons, brackets).
- **Prettier Tailwind Plugin:** Automatically sorts Tailwind utility classes in standard order to keep styles readable.
