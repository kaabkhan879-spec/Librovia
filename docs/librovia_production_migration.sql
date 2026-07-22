-- ====================================================================
-- LIBROVIA PRODUCTION DATABASE CONSOLIDATED MIGRATION
-- ====================================================================
-- Creates the 11 missing public tables:
-- 1. collections
-- 2. collection_books
-- 3. favorites
-- 4. flashcards
-- 5. notes
-- 6. notifications
-- 7. reading_progress
-- 8. subscription_plans (Seeded)
-- 9. user_subscriptions
-- 10. payments
-- 11. audit_logs
--
-- Enables Row Level Security (RLS) for all tables with secure policies.
-- Adds optimized indexes for high query performance.
-- ====================================================================

-- 1. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_collection UNIQUE (user_id, name)
);

-- 2. COLLECTION_BOOKS TABLE (Many-to-Many Association)
CREATE TABLE IF NOT EXISTS public.collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_collection_book UNIQUE (collection_id, book_id)
);

-- 3. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_favorite UNIQUE (user_id, book_id)
);

-- 4. FLASHCARDS TABLE
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topic VARCHAR(100) DEFAULT 'General',
    is_learned BOOLEAN DEFAULT false NOT NULL,
    is_favorite BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    page_number INTEGER NOT NULL,
    note_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    highlighted_text TEXT,
    is_bookmarked BOOLEAN DEFAULT false NOT NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    x_position NUMERIC,
    y_position NUMERIC,
    note_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. READING PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    current_page INTEGER DEFAULT 1 NOT NULL,
    total_pages INTEGER,
    last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reading_time INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT unique_user_progress UNIQUE (user_id, book_id)
);

-- 8. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    description TEXT,
    badge VARCHAR(50),
    price_monthly NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    price_yearly NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    storage_limit_bytes BIGINT DEFAULT 5368709120 NOT NULL, -- 5 GB
    ai_daily_limit INTEGER DEFAULT 20 NOT NULL,             -- -1 is Unlimited
    offline_download_limit INTEGER DEFAULT 10 NOT NULL,     -- -1 is Unlimited
    family_member_limit INTEGER DEFAULT 1 NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) ON DELETE RESTRICT NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' NOT NULL,
    status VARCHAR(30) DEFAULT 'active' NOT NULL,
    current_period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month') NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
    custom_storage_limit_bytes BIGINT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount_pkr NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    gateway VARCHAR(50) DEFAULT 'Stripe' NOT NULL,
    status VARCHAR(30) DEFAULT 'Completed' NOT NULL,
    billing_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_payment_txn UNIQUE (transaction_id)
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'System Config' NOT NULL,
    severity VARCHAR(20) DEFAULT 'Info' NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- PERFORMANCE OPTIMIZING INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_ids ON public.collection_books(collection_id, book_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_book ON public.flashcards(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_book ON public.notes(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON public.reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON public.subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event);

-- ====================================================================
-- SEED DATA FOR SUBSCRIPTION PLANS
-- ====================================================================
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ====================================================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Collections Policies
CREATE POLICY "Users can manage own collections" ON public.collections
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Collection Books Policies
CREATE POLICY "Users can manage own collection_books" ON public.collection_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = collection_id AND collections.user_id = auth.uid()
        )
    );

-- 3. Favorites Policies
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Flashcards Policies
CREATE POLICY "Users can manage own flashcards" ON public.flashcards
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Notes Policies
CREATE POLICY "Users can manage own notes" ON public.notes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Notifications Policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Reading Progress Policies
CREATE POLICY "Users can manage own reading_progress" ON public.reading_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Subscription Plans Policies (Active plans readable by authenticated users)
CREATE POLICY "Allow read access to active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 9. User Subscriptions Policies
CREATE POLICY "Users can manage own subscription" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 10. Payments Policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (customer_email = auth.jwt()->>'email');

CREATE POLICY "Super admins can manage payments" ON public.payments
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);

-- 11. Audit Logs Policies
CREATE POLICY "Super admins can manage audit_logs" ON public.audit_logs
    FOR ALL USING (public.is_super_admin(auth.uid())) WITH CHECK (true);
