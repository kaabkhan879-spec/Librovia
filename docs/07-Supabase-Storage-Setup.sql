-- ==========================================================
-- LIBROVIA: SUPABASE STORAGE SETUP (PHASE 3.4)
-- ==========================================================
-- This script creates the required storage buckets and configures
-- Row Level Security (RLS) policies to isolate user files securely.
-- 
-- How to run:
-- 1. Go to your Supabase Dashboard.
-- 2. Open the "SQL Editor" from the left menu.
-- 3. Click "New Query" and paste this script.
-- 4. Click "Run" at the bottom right.
-- ==========================================================

-- 1. Create Storage Buckets (Private)
insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('covers', 'covers', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;


-- 2. Enable RLS Policies (Storage objects are guarded by RLS policies)

-- ==========================================================
-- POLICIES FOR 'books' BUCKET
-- ==========================================================
-- Allow authenticated users to upload books to their own folder only ({user_id}/*)
create policy "Allow users to upload books to their own folder" on storage.objects
  for insert with check (
    bucket_id = 'books' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read books in their own folder
create policy "Allow users to read their own books" on storage.objects
  for select using (
    bucket_id = 'books' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete books in their own folder
create policy "Allow users to delete their own books" on storage.objects
  for delete using (
    bucket_id = 'books' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ==========================================================
-- POLICIES FOR 'covers' BUCKET
-- ==========================================================
-- Allow authenticated users to upload cover images to their own folder ({user_id}/*)
create policy "Allow users to upload covers to their own folder" on storage.objects
  for insert with check (
    bucket_id = 'covers' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read cover images in their own folder
create policy "Allow users to read their own covers" on storage.objects
  for select using (
    bucket_id = 'covers' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete cover images in their own folder
create policy "Allow users to delete their own covers" on storage.objects
  for delete using (
    bucket_id = 'covers' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ==========================================================
-- POLICIES FOR 'avatars' BUCKET
-- ==========================================================
-- Allow authenticated users to upload avatar images to their own folder ({user_id}/*)
create policy "Allow users to upload avatars to their own folder" on storage.objects
  for insert with check (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read avatar images in their own folder
create policy "Allow users to read their own avatars" on storage.objects
  for select using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete avatar images in their own folder
create policy "Allow users to delete their own avatars" on storage.objects
  for delete using (
    bucket_id = 'avatars' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
