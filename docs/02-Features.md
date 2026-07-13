# Features List: Librovia

This document details the functional specifications for the Librovia personal digital library application.

## 1. Authentication & User Management

- **Secure Sign Up:** Users can create an account using email and password.
- **Email Verification:** Required to activate the account (managed by Supabase Auth).
- **Secure Login / Logout:** Authentication status persisted across sessions using JWT tokens stored securely.
- **Password Recovery:** "Forgot password" flows that send secure recovery emails to users.

---

## 2. Book & Library Management

- **Upload Books:**
  - Support for PDF uploads (restricted to a configurable size limit, e.g., 50MB per file).
  - Auto-generation or extraction of book covers (optional, placeholder support in UI).
- **Metadata Editing:** Users can add/edit details:
  - Title
  - Author
  - Description / Notes
  - Custom Category / Genre
  - User Tags
- **Deletion:** Secure deletion of books (removes file from storage bucket and row from database).
- **Favorites System:** Toggle "Favorite" status on any book for quick access from the Favorites tab.
- **Categories:** Organized views grouping books by their categories or custom user-defined tags.

---

## 3. Reading Experience (PDF Reader)

- **Web-Based Reader:** Seamless in-browser PDF rendering using `react-pdf`.
- **Reading Progress Sync:**
  - Automatically tracks the last read page.
  - Persists reading progress to the database on change (with a debounce to optimize DB writes).
- **Reader Controls:**
  - Page navigation (Next / Previous / Jump to page number).
  - Zoom controls (Zoom In, Zoom Out, Fit to Width, Fit to Page).
  - Fullscreen mode.
  - Light / Dark reader background theme adjustment.
- **Bookmarks & Highlights:**
  - Add bookmarks on specific pages with custom labels.
  - Text highlight support (future expansion).

---

## 4. Search, Filtering & Organization

- **Global Search:** Real-time search across titles, authors, descriptions, and tags.
- **Multi-Criteria Filtering:** Filter by custom categories, tags, or reading status (Unread, Reading, Completed).
- **Sorting Options:** Sort library by Date Uploaded, Title (A-Z / Z-A), Last Read, or Progress.

---

## 5. Profile & Settings

- **Account Settings:** Update display name, profile avatar, and account email.
- **Password Management:** Direct password update mechanism inside the user profile.
- **Theme Preferences:** System-wide Dark Mode / Light Mode toggle (Tailwind configuration).
- **Usage Statistics:** Display details like total books uploaded, storage space consumed, and completed books.
