-- ====================================================================
-- LIBROVIA PRODUCTION DATABASE CONSOLIDATED MIGRATION
-- ====================================================================
-- Builds the entire database schema from an empty Supabase project.
-- Ensures strict dependency ordering, indexes, triggers, constraints,
-- RLS configurations, policies, and seeds all initial database values.
-- ====================================================================

-- 1. BASE INDEPENDENT TRIGGER AND UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE SCHEMAS IN CORRECT DEPENDENCY ORDER

-- 2.1 SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'free', 'pro', 'family'
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    badge VARCHAR(50),
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    storage_limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- Default 5 GB
    ai_daily_limit INTEGER NOT NULL DEFAULT 20,              -- -1 means Unlimited
    offline_download_limit INTEGER NOT NULL DEFAULT 10,     -- -1 means Unlimited
    family_member_limit INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 USER ROLES TABLE (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
    status VARCHAR(30) NOT NULL DEFAULT 'active',          -- 'active', 'canceled', 'past_due'
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    custom_storage_limit_bytes BIGINT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 2.5 CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_category UNIQUE (user_id, name)
);

-- 2.6 COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_collection UNIQUE (user_id, name)
);

-- 2.7 BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    category TEXT, -- maps to collection ID string in the UI queries
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    language TEXT,
    isbn TEXT,
    pages INTEGER NOT NULL DEFAULT 0,
    edition TEXT,
    description TEXT,
    file_path TEXT, -- legacy/doc compatibility
    file_url TEXT NOT NULL, -- actual url queried by code
    cover_path TEXT, -- legacy/doc compatibility
    cover_url TEXT, -- actual cover url queried by code
    file_size INTEGER DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'unread',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 COLLECTION BOOKS TABLE (Many-to-Many Association)
CREATE TABLE IF NOT EXISTS public.collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_collection_book UNIQUE (collection_id, book_id)
);

-- 2.9 FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE (user_id, book_id)
);

-- 2.10 NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    note_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    highlighted_text TEXT,
    is_bookmarked BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    x_position NUMERIC,
    y_position NUMERIC,
    note_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    label VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.12 ANNOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    note_text TEXT,
    highlighted_text TEXT,
    color VARCHAR(50) NOT NULL DEFAULT 'yellow',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.13 COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.14 READING PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    current_page INTEGER NOT NULL DEFAULT 1,
    total_pages INTEGER,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reading_time INTEGER NOT NULL DEFAULT 0, -- elapsed reading time in seconds
    CONSTRAINT unique_user_progress UNIQUE (user_id, book_id)
);

-- 2.15 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.16 PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount_pkr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gateway VARCHAR(50) NOT NULL DEFAULT 'Stripe',
    status VARCHAR(30) NOT NULL DEFAULT 'Completed',
    billing_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_payment_txn UNIQUE (transaction_id)
);

-- 2.17 STORAGE USAGE TABLE
CREATE TABLE IF NOT EXISTS public.storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    used_bytes BIGINT NOT NULL DEFAULT 0,
    limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- Default 5 GB
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_storage UNIQUE (user_id)
);

-- 2.18 STORAGE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.storage_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    change_bytes BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'upload', 'delete', 'override'
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.19 AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'System Config',
    severity VARCHAR(20) NOT NULL DEFAULT 'Info',
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.20 ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'All Readers',
    type VARCHAR(50) NOT NULL DEFAULT 'Information',
    priority VARCHAR(50) NOT NULL DEFAULT 'Low',
    schedule_mode VARCHAR(50) NOT NULL DEFAULT 'Send Now',
    scheduled_date_time TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    delivery_rate_pct NUMERIC NOT NULL DEFAULT 0.0,
    open_rate_pct NUMERIC NOT NULL DEFAULT 0.0,
    attachment_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.21 SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    allow_registrations BOOLEAN NOT NULL DEFAULT true,
    default_storage_gb INTEGER NOT NULL DEFAULT 5,
    max_upload_size_mb INTEGER NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ATTACH UPDATED_AT AUTOMATIC UPDATE TRIGGERS
CREATE OR REPLACE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_annotations_updated_at BEFORE UPDATE ON public.annotations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. NON-RECURSIVE SUPER ADMIN SECURITY DEFINER FUNCTION
CREATE OR REPLACE FUNCTION public.is_super_admin(lookup_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = lookup_uid AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SECURE STORAGE QUOTA CHECK FUNCTION (For RLS & Storage Restriction validations)
CREATE OR REPLACE FUNCTION public.can_user_upload(user_uuid UUID, additional_bytes BIGINT DEFAULT 0)
RETURNS BOOLEAN AS $$
DECLARE
    sub_status VARCHAR(30);
    usage_bytes BIGINT;
    limit_bytes BIGINT;
BEGIN
    -- Super admins bypass all storage quota checks
    IF public.is_super_admin(user_uuid) THEN
        RETURN TRUE;
    END IF;

    -- Get subscription status (Upload checks are suspended if the subscription is suspended or past due)
    SELECT status INTO sub_status FROM public.user_subscriptions WHERE user_id = user_uuid;
    IF sub_status IS NULL OR sub_status = 'suspended' OR sub_status = 'past_due' THEN
        RETURN FALSE;
    END IF;

    -- Get storage usage limits
    SELECT used_bytes, limit_bytes INTO usage_bytes, limit_bytes FROM public.storage_usage WHERE user_id = user_uuid;
    
    IF usage_bytes IS NULL THEN
        usage_bytes := 0;
    END IF;
    
    IF limit_bytes IS NULL THEN
        limit_bytes := 5368709120; -- 5 GB default limit
    END IF;

    -- Block upload if size exceeds remaining limits
    IF usage_bytes + additional_bytes >= limit_bytes THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. UNIFIED USER REGISTRATION SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create user profile
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Create user role (seeds kaabkhan879@gmail.com automatically as super_admin)
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN LOWER(NEW.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = CASE 
            WHEN LOWER(EXCLUDED.email) = 'kaabkhan879@gmail.com' THEN 'super_admin'
            ELSE public.user_roles.role
        END;

    -- 3. Create user free subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (
        NEW.id,
        'free',
        'active'
    ) ON CONFLICT (user_id) DO NOTHING;

    -- 4. Initialize storage usage
    INSERT INTO public.storage_usage (user_id, used_bytes, limit_bytes)
    VALUES (
        NEW.id,
        0,
        5368709120 -- 5 GB
    ) ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register unified signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SECURE DATABASE TRIGGERS FOR STORAGES AND SUBSCRIPTIONS

-- 7.1 Automated Book Storage Tracking Trigger Function
CREATE OR REPLACE FUNCTION public.handle_book_storage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.storage_usage 
        SET used_bytes = used_bytes + COALESCE(NEW.file_size, 0),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        INSERT INTO public.storage_transactions (user_id, change_bytes, action_type, reference_id)
        VALUES (NEW.user_id, COALESCE(NEW.file_size, 0), 'upload', NEW.id::text);

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.storage_usage 
        SET used_bytes = used_bytes - COALESCE(OLD.file_size, 0) + COALESCE(NEW.file_size, 0),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

        INSERT INTO public.storage_transactions (user_id, change_bytes, action_type, reference_id)
        VALUES (NEW.user_id, COALESCE(NEW.file_size, 0) - COALESCE(OLD.file_size, 0), 'update', NEW.id::text);

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.storage_usage 
        SET used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.file_size, 0)),
            updated_at = NOW()
        WHERE user_id = OLD.user_id;

        INSERT INTO public.storage_transactions (user_id, change_bytes, action_type, reference_id)
        VALUES (OLD.user_id, -COALESCE(OLD.file_size, 0), 'delete', OLD.id::text);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_book_storage_change ON public.books;
CREATE TRIGGER trigger_book_storage_change
    AFTER INSERT OR UPDATE OR DELETE ON public.books
    FOR EACH ROW EXECUTE FUNCTION public.handle_book_storage_change();

-- 7.2 Automated Subscription Storage Limits Tracking Trigger Function
CREATE OR REPLACE FUNCTION public.handle_subscription_limit_change()
RETURNS TRIGGER AS $$
DECLARE
    target_limit BIGINT;
BEGIN
    -- Handle custom limit byte allocations
    IF NEW.custom_storage_limit_bytes IS NOT NULL THEN
        target_limit := NEW.custom_storage_limit_bytes;
    ELSE
        -- Default to the limits attached to the specific Plan Tier
        SELECT storage_limit_bytes INTO target_limit 
        FROM public.subscription_plans 
        WHERE id = NEW.plan_id;
        
        IF target_limit IS NULL THEN
            target_limit := 5368709120; -- 5 GB Fallback
        END IF;
    END IF;

    -- Propagate limit change to storage_usage
    INSERT INTO public.storage_usage (user_id, used_bytes, limit_bytes)
    VALUES (NEW.user_id, 0, target_limit)
    ON CONFLICT (user_id) DO UPDATE SET
        limit_bytes = EXCLUDED.limit_bytes,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_subscription_limit_change ON public.user_subscriptions;
CREATE TRIGGER trigger_subscription_limit_change
    AFTER INSERT OR UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_limit_change();


-- 8. INDEX OPTIMIZATION FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_ids ON public.collection_books(collection_id, book_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_book ON public.notes(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_book ON public.bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_book ON public.annotations(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_book ON public.comments(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON public.reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_storage_usage_user ON public.storage_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_transactions_user ON public.storage_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event);

-- 9. SEED DATA FOR SUBSCRIPTION PLANS
INSERT INTO public.subscription_plans (
    id, plan_name, description, badge, price_monthly, price_yearly, 
    storage_limit_bytes, ai_daily_limit, offline_download_limit, family_member_limit, 
    features, is_active, sort_order
) VALUES
(
    'free',
    'FREE',
    'Perfect for casual readers getting started with digital book management.',
    'Free Forever',
    0.00,
    0.00,
    5368709120, -- 5 GB
    20,         -- 20 AI Requests per Day
    10,         -- Up to 10 Offline Downloads
    1,
    '[
        {"text": "5 GB Cloud Storage"},
        {"text": "20 AI Requests per Day"},
        {"text": "Up to 10 Offline Downloads"},
        {"text": "Unlimited Reading"},
        {"text": "Notes & Highlights"},
        {"text": "Collections"},
        {"text": "Basic Reader"}
    ]'::jsonb,
    true,
    1
),
(
    'pro',
    'PRO',
    'Designed for avid readers, researchers, and AI-powered studying.',
    '⭐ Most Popular',
    500.00,
    4999.00,
    322122547200, -- 300 GB
    -1,           -- Unlimited AI
    -1,           -- Unlimited Offline Downloads
    1,
    '[
        {"text": "300 GB Cloud Storage", "highlight": true},
        {"text": "Unlimited AI", "highlight": true},
        {"text": "Unlimited Offline Downloads", "highlight": true},
        {"text": "Faster AI Responses"},
        {"text": "Premium Reader Experience"},
        {"text": "Priority Sync"},
        {"text": "Premium Support"}
    ]'::jsonb,
    true,
    2
),
(
    'family',
    'FAMILY',
    'Shared digital library experience for families and reading groups.',
    '👨‍👩‍👧 Best Value',
    899.00,
    8999.00,
    1099511627776, -- 1 TB
    -1,            -- Unlimited AI
    -1,            -- Unlimited Offline Downloads
    5,             -- Up to 5 Family Members
    '[
        {"text": "1 TB Shared Storage", "highlight": true},
        {"text": "Up to 5 Family Members", "highlight": true},
        {"text": "Unlimited AI"},
        {"text": "Unlimited Offline Downloads"},
        {"text": "Shared Library"},
        {"text": "Shared Collections"},
        {"text": "Family Reading"}
    ]'::jsonb,
    true,
    3
)
ON CONFLICT (id) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    description = EXCLUDED.description,
    badge = EXCLUDED.badge,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    storage_limit_bytes = EXCLUDED.storage_limit_bytes,
    ai_daily_limit = EXCLUDED.ai_daily_limit,
    offline_download_limit = EXCLUDED.offline_download_limit,
    family_member_limit = EXCLUDED.family_member_limit,
    features = EXCLUDED.features,
    updated_at = NOW();

-- 10. POPULATE EXISTING USERS IN THE DATABASE
INSERT INTO public.profiles (id, display_name)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

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
    END;

INSERT INTO public.user_subscriptions (user_id, plan_id, status)
SELECT 
    id,
    'free',
    'active'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.storage_usage (user_id, used_bytes, limit_bytes)
SELECT 
    id,
    0,
    5368709120
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Seed system settings single entry
INSERT INTO public.system_settings (id, maintenance_mode, allow_registrations, default_storage_gb, max_upload_size_mb)
VALUES (1, false, true, 5, 100)
ON CONFLICT (id) DO NOTHING;

-- 11. ENABLE ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before recreating
DROP POLICY IF EXISTS "Allow read access to active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Super admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Super admins can manage all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "Super admins can manage all categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own collections" ON public.collections;
DROP POLICY IF EXISTS "Super admins can manage all collections" ON public.collections;
DROP POLICY IF EXISTS "Users can manage their own books" ON public.books;
DROP POLICY IF EXISTS "Super admins can manage all books" ON public.books;
DROP POLICY IF EXISTS "Users can manage own collection_books" ON public.collection_books;
DROP POLICY IF EXISTS "Super admins can manage all collection_books" ON public.collection_books;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Super admins can manage all favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
DROP POLICY IF EXISTS "Super admins can manage all notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Super admins can manage all bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can manage own annotations" ON public.annotations;
DROP POLICY IF EXISTS "Super admins can manage all annotations" ON public.annotations;
DROP POLICY IF EXISTS "Users can manage own comments" ON public.comments;
DROP POLICY IF EXISTS "Super admins can manage all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can manage own reading_progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Super admins can manage all reading_progress" ON public.reading_progress;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Super admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Super admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own storage_usage" ON public.storage_usage;
DROP POLICY IF EXISTS "Super admins can manage all storage_usage" ON public.storage_usage;
DROP POLICY IF EXISTS "Users can view own storage_transactions" ON public.storage_transactions;
DROP POLICY IF EXISTS "Super admins can manage all storage_transactions" ON public.storage_transactions;
DROP POLICY IF EXISTS "Super admins can manage audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow anyone to insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public read access to announcements" ON public.announcements;
DROP POLICY IF EXISTS "Super admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow public read access to system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can manage system_settings" ON public.system_settings;

-- Apply consolidated secure policies
CREATE POLICY "Allow read access to active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can read all roles" ON public.user_roles FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Restrict user_subscriptions to read-only for standard users (prevents direct plan changes or limit escalations)
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all categories" ON public.categories FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own collections" ON public.collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all collections" ON public.collections FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- Restrict books manipulations based on quota checks
CREATE POLICY "Allow users to read their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id AND public.can_user_upload(auth.uid()));
CREATE POLICY "Allow users to update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id AND public.can_user_upload(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.can_user_upload(auth.uid()));
CREATE POLICY "Allow users to delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all books" ON public.books FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own collection_books" ON public.collection_books FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.collections
        WHERE collections.id = collection_id AND collections.user_id = auth.uid()
    )
);
CREATE POLICY "Super admins can manage all collection_books" ON public.collection_books FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all favorites" ON public.favorites FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all notes" ON public.notes FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all bookmarks" ON public.bookmarks FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own annotations" ON public.annotations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all annotations" ON public.annotations FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own comments" ON public.comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all comments" ON public.comments FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own reading_progress" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all reading_progress" ON public.reading_progress FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all notifications" ON public.notifications FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (customer_email = auth.jwt()->>'email');
CREATE POLICY "Super admins can manage payments" ON public.payments FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can view own storage_usage" ON public.storage_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all storage_usage" ON public.storage_usage FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Users can view own storage_transactions" ON public.storage_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all storage_transactions" ON public.storage_transactions FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Super admins can manage audit_logs" ON public.audit_logs FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);
CREATE POLICY "Allow anyone to insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Super admins can manage announcements" ON public.announcements FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

CREATE POLICY "Allow public read access to system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Super admins can manage system_settings" ON public.system_settings FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- ==========================================================
-- LIBROVIA MANUAL PAYMENT GATEWAY IMPLEMENTATION (V1.0)
-- ==========================================================

-- 1. ALTER SYSTEM SETTINGS FOR MANUAL PAYMENT DETALS
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS easypaisa_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS easypaisa_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS jazzcash_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS jazzcash_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Seed default manual payment gateway credentials
UPDATE public.system_settings 
SET 
  easypaisa_number = '03001234567', 
  easypaisa_name = 'Librovia EasyPaisa Wallet', 
  jazzcash_number = '03007654321', 
  jazzcash_name = 'Librovia JazzCash Wallet', 
  bank_name = 'Meezan Bank Ltd', 
  bank_account_number = '1234-5678-9012-34', 
  bank_account_name = 'Librovia Private Limited', 
  payment_instructions = 'Please transfer the correct subscription amount based on your selected billing interval to any of the wallets/accounts listed below, capture a screenshot of the confirmation message showing the transaction details, and upload it below along with your transaction ID.'
WHERE id = 1;

-- 2. CREATE PAYMENT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC NOT NULL,
    screenshot_url TEXT NOT NULL,
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Verification',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attach update timestamp trigger
CREATE OR REPLACE TRIGGER trigger_payment_requests_updated_at BEFORE UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR PAYMENT REQUESTS
CREATE POLICY "Users can create own payment_requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payment_requests" ON public.payment_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all payment_requests" ON public.payment_requests FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 4. SUPABASE STORAGE BUCKET AND POLICIES FOR PAYMENT SCREENSHOTS
INSERT INTO storage.buckets (id, name, public) VALUES ('payments', 'payments', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow users to upload payment screenshots to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to view own payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow super admins to view all payment screenshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payments' 
    AND public.is_super_admin(auth.uid())
  );
