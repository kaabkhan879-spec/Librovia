-- ====================================================================
-- LIBROVIA PRODUCTION SUPER ADMIN & RBAC DATABASE SCHEMA
-- ====================================================================
-- Establishes role-based access control (RBAC) in Supabase.
-- 1. Creates public.user_roles table.
-- 2. Sets up automatic signup trigger (role = 'user' for new accounts).
-- 3. Seeds kaabkhan879@gmail.com with role = 'super_admin' and populates ALL auth.users.
-- 4. Uses non-recursive SECURITY DEFINER function to prevent RLS recursion errors.

-- 1. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. NON-RECURSIVE SECURITY DEFINER ROLE CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_super_admin(lookup_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = lookup_uid AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AUTOMATIC ROLE ASSIGNMENT TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN LOWER(NEW.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
            ELSE public.user_roles.role
        END,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 4. SEED ALL EXISTING ACCOUNTS FROM auth.users INTO public.user_roles
-- Populates both Super Admins AND standard Users from auth.users
INSERT INTO public.user_roles (user_id, email, role)
SELECT 
    id, 
    email, 
    CASE 
        WHEN LOWER(email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
        ELSE 'user'
    END
FROM auth.users 
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE 
        WHEN LOWER(EXCLUDED.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
        ELSE public.user_roles.role
    END,
    updated_at = NOW();

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;

-- Policy 1: Authenticated users can read their own role
CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Super admins can read all user roles
CREATE POLICY "Super admins can read all roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Policy 3: Super admins can update user roles
CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 4: Super admins can insert user roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);
