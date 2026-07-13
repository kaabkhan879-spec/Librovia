# Product Roadmap: Librovia

This roadmap details the phases of development to transform the Librovia project from a foundation into a production-ready SaaS.

## Phase 1: Foundation & Project Structure (Current)

- [x] Project scaffolding with Vite + React + TypeScript.
- [x] Integration of Tailwind CSS v4 styling system.
- [x] Set up ESLint + Prettier.
- [x] Configure React Router with route definitions and layout wrappers.
- [x] Implement visual placeholders for all core pages.
- [x] Technical specifications and database design documents.

---

## Phase 2: Authentication & Core Backend Integration

- [ ] Initialize Supabase Client.
- [ ] Implement JWT-based Auth flows (Sign Up, Sign In, Sign Out, Password Reset).
- [ ] Build auth guard routes (`PrivateRoute` and `PublicRoute`).
- [ ] Connect UI to `AuthContext` to persist user sessions.
- [ ] Database connection for reading user records.

---

## Phase 3: Cloud Storage & Book Management

- [ ] Setup Supabase Storage bucket for PDFs.
- [ ] Configure bucket permissions and RLS policies (namespace by `user_id`).
- [ ] Create the book upload pipeline (file drag-and-drop, upload progress bar, database metadata insert).
- [ ] Implement CRUD operations for books (edit metadata, delete book).
- [ ] Build the "My Library" dashboard with list/grid views, search, and categorization filters.

---

## Phase 4: PDF Reader & Progress Syncing

- [ ] Integrate `react-pdf` for in-browser book viewing.
- [ ] Implement basic reader navigation (page turn, zoom, fullscreen).
- [ ] Design database progress schema (`reading_progress` tracking `current_page` and `completed` status).
- [ ] Sync reader progress to the backend (debounced event handlers mapping reader state to Supabase database updates).
- [ ] Implement bookmarks features within the reader sidebar.

---

## Phase 5: Advanced Features & Refinement

- [ ] Implement custom tagging and categorization UI.
- [ ] Set up user-facing reading statistics dashboard.
- [ ] Enable Dark Mode / Light Mode styling throughout the application.
- [ ] Finalize UI/UX polish, micro-animations, and responsive layouts across all mobile views.
- [ ] Establish automated unit and integration tests.
- [ ] Deploy to hosting platform (Vercel, Netlify, or AWS Amplify) and link to Supabase production.
