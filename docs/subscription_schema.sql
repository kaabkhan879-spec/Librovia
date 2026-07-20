-- ====================================================================
-- LIBROVIA SUBSCRIPTION ARCHITECTURE DATABASE SCHEMA
-- ====================================================================
-- Enables a 100% database-driven subscription model.
-- Super admins can update plan prices, storage limits, AI quotas, offline caps,
-- or add new plans directly in PostgreSQL without changing frontend code.

-- 1. SUBSCRIPTION PLANS TABLE
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
    status VARCHAR(30) NOT NULL DEFAULT 'active',          -- 'active', 'canceled', 'past_due'
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Index for fast user subscription lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);

-- 3. SEED DEFAULT SUBSCRIPTION PLANS DATA
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

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active subscription plans
CREATE POLICY "Allow public read access to active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Allow users to view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert/update their own subscription
CREATE POLICY "Users can manage their own subscription"
ON public.user_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
