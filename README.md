# Librovia

Librovia is a cloud-based personal digital library SaaS where users can securely upload, organize, and read their own books. Built with a private-first focus, users have full data isolation and can access their libraries anywhere.

## 🚀 Technology Stack

- **Frontend:** React (v19), TypeScript, Vite
- **Routing:** React Router (v6)
- **Styling:** Tailwind CSS (v4)
- **PDF Reader:** `react-pdf` (powered by PDF.js)
- **Backend Platform:** Supabase (Auth, PostgreSQL DB, S3 Storage) - _Integration ready_
- **Linting & Formatting:** ESLint, Prettier

---

## 📁 Folder Structure

```
librovia/
├── docs/                     # Project planning & architectural documentation
│   ├── 01-Project-Plan.md    # Product vision & goals
│   ├── 02-Features.md        # Core specifications
│   ├── 03-Roadmap.md         # Release planning stages
│   ├── 04-Database-Design.md # Supabase DB Schemas & RLS policies
│   └── 05-Tech-Stack.md      # Detailed stack analysis
├── public/                   # Static public assets
└── src/
    ├── assets/               # Images, logos, and global icons
    ├── components/           # Reusable components
    │   ├── common/           # Buttons, Inputs, Modals
    │   ├── layout/           # Header, Sidebar, Footer components
    │   └── pdf/              # PDF visual reader subcomponents
    ├── constants/            # Route constants & app configuration settings
    ├── context/              # Contexts (AuthContext shell, UI Context)
    ├── hooks/                # Custom React Hooks
    ├── layouts/              # Routing layouts (PublicLayout and AppLayout)
    ├── pages/                # Page components corresponding to routes
    ├── routes/               # Routing files & Guard configurations
    ├── services/             # Core clients & services (Supabase placeholders)
    ├── styles/               # Global stylesheet with Tailwind imports
    ├── utils/                # Standard validator & helper scripts
    ├── App.tsx               # Main application component
    └── main.tsx              # React mounting root
```

---

## 🛠️ Quick Start

### 1. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

### 3. Build & Preview

To compile the TypeScript project and bundle it for production:

```bash
npm run build
npm run preview
```

---

## 🎨 Design & Layout Guidelines

- **Tailwind CSS v4:** Styles are defined in `src/styles/index.css`. Theme variables are declared using native CSS variables under `@theme` inside that file.
- **Layout Classes:**
  - **Public Layout (`PublicLayout`):** Centered containers, landing page structure, top header navigation.
  - **App Layout (`AppLayout`):** Collapsible sidebar menu for navigation, top sticky user profile bar, flexible main scroll container.
- **Responsive Breakpoints:** Fully compatible with mobile viewports using Tailwind utility prefixes (`sm:`, `md:`, `lg:`).
