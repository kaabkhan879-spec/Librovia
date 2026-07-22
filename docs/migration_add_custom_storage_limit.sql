-- ====================================================================
-- MIGRATION: ADD CUSTOM STORAGE LIMIT & SUPER ADMIN RLS POLICIES
-- ====================================================================
-- Run this in the Supabase SQL editor to enable custom admin overrides
-- and grant full RLS access to Super Admins.

-- 1. Add custom_storage_limit_bytes to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS custom_storage_limit_bytes BIGINT DEFAULT NULL;

-- 2. Drop existing restrictive policies on user_subscriptions
DROP POLICY IF EXISTS "Users can manage own subscription" ON public.user_subscriptions;

-- 3. Recreate user subscription policies with Super Admin access
CREATE POLICY "Users can manage own subscription" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 4. Recreate profiles policies with Super Admin access
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 5. Recreate books policies with Super Admin access
DROP POLICY IF EXISTS "Allow users to manage their own books" ON public.books;
CREATE POLICY "Allow users to manage their own books" ON public.books
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all books" ON public.books
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);
