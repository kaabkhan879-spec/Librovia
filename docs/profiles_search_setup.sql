-- ====================================================================
-- PROFILE SEARCH SETUP (MIGRATION)
-- Run this in your Supabase SQL Editor to support the Shared Library search.
-- ====================================================================

-- 1. Add email and subscription_plan columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill existing profiles data from user_roles and user_subscriptions
UPDATE public.profiles p
SET email = ur.email
FROM public.user_roles ur
WHERE p.id = ur.user_id AND p.email IS NULL;

UPDATE public.profiles p
SET subscription_plan = COALESCE(us.plan_id, 'free')
FROM public.user_subscriptions us
WHERE p.id = us.user_id AND p.subscription_plan = 'free';

-- 3. Update the handle_new_user() trigger function to populate profiles email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile (include email and default 'free' plan)
    INSERT INTO public.profiles (id, display_name, avatar_url, email, subscription_plan)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        'free'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

    -- Create user role
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN LOWER(NEW.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email;

    -- Create user free subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (
        NEW.id,
        'free',
        'active'
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger function to sync subscription plan updates back to profiles table
CREATE OR REPLACE FUNCTION public.sync_profile_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET subscription_plan = NEW.plan_id
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_profile_subscription_plan ON public.user_subscriptions;
CREATE TRIGGER trigger_sync_profile_subscription_plan
    AFTER INSERT OR UPDATE OF plan_id ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_subscription_plan();

-- 5. Recreate RLS Select policy on profiles to restrict access to self and premium search lookups
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.user_subscriptions
            WHERE user_id = auth.uid() AND plan_id IN ('pro', 'family')
        )
    );
