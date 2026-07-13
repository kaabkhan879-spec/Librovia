# Database Design: Librovia

Librovia uses **Supabase** (powered by PostgreSQL) for authentication, storage, and database management. This document defines the schema, table relations, and Row Level Security (RLS) policies.

## 1. Schema Diagram (Conceptual)

```
  ┌───────────────┐          ┌────────────────┐
  │  auth.users   │ ◄─────── │    profiles    │
  └───────────────┘          ├────────────────┤
          │ 1                │ id (UUID, PK)  │
          │                  │ display_name   │
          │ 1:many           │ avatar_url     │
          ▼                  └────────────────┘
  ┌───────────────┐          ┌────────────────┐
  │     books     │ ◄─────── │   categories   │
  ├───────────────┤ 1:many   ├────────────────┤
  │ id (UUID, PK) │          │ id (UUID, PK)  │
  │ user_id (FK)  │          │ user_id (FK)   │
  │ title         │          │ name           │
  │ author        │          └────────────────┘
  │ file_path     │
  │ cover_path    │          ┌──────────────────┐
  │ category_id   │ ◄─────── │ reading_progress │
  │ is_favorite   │          ├──────────────────┤
  │ tags (array)  │          │ id (UUID, PK)    │
  └───────────────┘          │ user_id (FK)     │
          │ 1                │ book_id (FK)     │
          │                  │ current_page     │
          ▼ 1:1              │ total_pages      │
  [Supabase Storage]         │ last_read_at     │
  - books/                   └──────────────────┘
  - covers/
```

---

## 2. Table Definitions (SQL)

### Profiles Table

Extends the default Supabase authentication user records. Created automatically via a database trigger when a user signs up.

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Categories Table

Allows users to classify books. Users can create custom categories in addition to any default system categories.

```sql
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Prevent users from creating duplicate categories
  unique (user_id, name)
);
```

### Books Table

Stores files metadata. The file itself is stored in Supabase Storage, and the database keeps a reference to its path.

```sql
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  description text,
  file_path text not null,        -- Reference to Supabase Storage bucket path
  cover_path text,               -- Reference to Supabase Storage cover image
  category_id uuid references public.categories on delete set null,
  is_favorite boolean default false not null,
  tags text[] default '{}'::text[] not null,
  file_size integer,             -- File size in bytes
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Reading Progress Table

Tracks the user's reading position in each book.

```sql
create table public.reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete cascade not null,
  current_page integer default 1 not null,
  total_pages integer,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_completed boolean default false not null,

  -- A user has exactly one reading progress record per book
  unique (user_id, book_id)
);
```

---

## 3. Row Level Security (RLS) Policies

Every table has RLS enabled by default. Users can ONLY read and write their own data.

### Profile Policies

```sql
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);
```

### Categories Policies

```sql
alter table public.categories enable row level security;

create policy "Allow users to manage their own categories" on public.categories
  for all using (auth.uid() = user_id);
```

### Books Policies

```sql
alter table public.books enable row level security;

create policy "Allow users to manage their own books" on public.books
  for all using (auth.uid() = user_id);
```

### Reading Progress Policies

```sql
alter table public.reading_progress enable row level security;

create policy "Allow users to manage their own reading progress" on public.reading_progress
  for all using (auth.uid() = user_id);
```

---

## 4. Automatic Profile Trigger

This trigger automatically inserts a record into the `public.profiles` table whenever a new user registers through Supabase Auth.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
