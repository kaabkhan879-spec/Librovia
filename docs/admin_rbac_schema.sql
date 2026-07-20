-- ====================================================================
-- LIBROVIA SUPER ADMIN & RBAC DATABASE SCHEMA
-- ====================================================================
-- Establishes role-based access control (RBAC) in Supabase.
-- Ensures every new signup automatically gets role = 'user'.
-- Predefines the initial Super Admin account: kaabkhan879@gmail.com with role = 'super_admin'.

-- 1. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. AUTOMATIC ROLE ASSIGNMENT TRIGGER ON SIGNUP
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

-- 3. SEED INITIAL SUPER ADMIN ACCOUNT ROLE
-- Ensures kaabkhan879@gmail.com has super_admin role if user already exists in auth.users
INSERT INTO public.user_roles (user_id, email, role)
SELECT 
    id, 
    email, 
    'super_admin'
FROM auth.users 
WHERE LOWER(email) = 'kaabkhan879@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    updated_at = NOW();

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow super_admin users to view all roles
CREATE POLICY "Super admin can view all user roles"
ON public.user_roles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- Allow super_admin users to update user roles
CREATE POLICY "Super admin can update user roles"
ON public.user_roles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);
