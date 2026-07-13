# Project Plan: Librovia

Librovia is a modern, cloud-based personal digital library designed to give users a secure, private space to upload, organize, and read their own books from anywhere.

## 1. Vision & Objectives

Modern readers accumulate digital books (PDFs, EPUBs, etc.) across various platforms, but often lack a centralized, private, and customizable reading space. Librovia addresses this gap by offering a personal cloud library that focuses on user privacy, seamless reading experiences across devices, and clean, clutter-free book management.

### Key Objectives

- **Private-First Model:** Every user's library is completely private. Security and strict data isolation (via Supabase Row Level Security) ensure no one else can see or access a user's uploaded library.
- **Seamless PDF Reading:** A premium, web-based reader with page navigation, zoom, bookmarks, and auto-saving reading progress.
- **Organized Categorization:** Custom categories, tags, and favorites to enable effortless sorting of large digital libraries.
- **Cross-device Access:** Fully responsive web application built with a mobile-first design philosophy.

---

## 2. Target Audience

- **Avid Readers & Scholars:** Professionals, researchers, and students who have large collections of reference materials, research papers, and textbooks in PDF formats.
- **Privacy-Conscious Users:** Readers who prefer to own their digital files and want to avoid proprietary, data-harvesting ecosystems.
- **Self-Publishers & Collectors:** Individuals who collect DRM-free books and need a web-accessible personal library.

---

## 3. High-Level Architecture

Librovia follows a **Clean Architecture** model with a distinct separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│                      UI Layer (React)                  │
│     Pages ──> Layouts ──> Components ──> Tailwind CSS  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   State & Hook Layer                   │
│         Contexts (Auth, Library) ──> Custom Hooks       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Service Layer                       │
│    Supabase Client ──> AuthService ──> StorageService   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                Supabase Backend (DB/OS)                │
│    PostgreSQL (RLS) ──> Auth ──> Storage Bucket (S3)   │
└────────────────────────────────────────────────────────┘
```

- **Presentation Layer (React + Tailwind CSS):** Handles responsive layout, rendering book content, and styling.
- **Application State Layer (Context + Custom Hooks):** Manages user session state, library sync, and UI states.
- **Infrastructure / Service Layer (Supabase client):** Handles communication with the Supabase backend (PostgreSQL database, authentication services, and storage buckets).

---

## 4. Security & Data Isolation

Security is a foundational pillar of Librovia:

1. **User Authentication:** Handled securely via Supabase Auth with JWT tokens.
2. **Row Level Security (RLS):** All tables in the PostgreSQL database will have RLS enabled, ensuring database queries automatically filter records to only return rows belonging to the logged-in user (`auth.uid() = user_id`).
3. **Storage Access Controls:** The Supabase Storage buckets for PDFs and covers will have security policies requiring a valid session, with file path namespaces tied directly to user IDs (e.g., `books/{user_id}/{book_id}.pdf`).
