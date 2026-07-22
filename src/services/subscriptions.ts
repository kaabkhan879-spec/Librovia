import { supabase } from './supabase'

export interface PlanFeature {
  text: string
  highlight?: boolean
}

export interface SubscriptionPlan {
  id: string
  plan_name: string
  description: string
  badge?: string
  price_monthly: number
  price_yearly: number
  storage_limit_bytes: number
  ai_daily_limit: number // -1 means Unlimited
  offline_download_limit: number // -1 means Unlimited
  family_member_limit: number
  features: PlanFeature[]
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface UserSubscription {
  id?: string
  user_id: string
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'canceled' | 'past_due'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  custom_storage_limit_bytes?: number | null
  custom_limit_bytes?: number | null
  plan?: SubscriptionPlan
}

// Fallback Default Subscription Plans dataset
// Ensures application functions seamlessly even before SQL migration is executed in Supabase.
export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    plan_name: 'FREE',
    description: 'Perfect for casual readers getting started with digital book management.',
    badge: 'Free Forever',
    price_monthly: 0,
    price_yearly: 0,
    storage_limit_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
    ai_daily_limit: 20, // 20 Requests per Day
    offline_download_limit: 10, // 10 Books
    family_member_limit: 1,
    features: [
      { text: '5 GB Cloud Storage' },
      { text: '20 AI Requests per Day' },
      { text: 'Up to 10 Offline Downloads' },
      { text: 'Unlimited Reading' },
      { text: 'Notes & Highlights' },
      { text: 'Collections' },
      { text: 'Basic Reader' },
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'pro',
    plan_name: 'PRO',
    description: 'Designed for avid readers, researchers, and AI-powered studying.',
    badge: '⭐ Most Popular',
    price_monthly: 500,
    price_yearly: 4999,
    storage_limit_bytes: 300 * 1024 * 1024 * 1024, // 300 GB
    ai_daily_limit: -1, // Unlimited AI
    offline_download_limit: -1, // Unlimited Offline Downloads
    family_member_limit: 1,
    features: [
      { text: '300 GB Cloud Storage', highlight: true },
      { text: 'Unlimited AI', highlight: true },
      { text: 'Unlimited Offline Downloads', highlight: true },
      { text: 'Faster AI Responses' },
      { text: 'Premium Reader Experience' },
      { text: 'Priority Sync' },
      { text: 'Premium Support' },
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'family',
    plan_name: 'FAMILY',
    description: 'Shared digital library experience for families and reading groups.',
    badge: '👨‍👩‍👧 Best Value',
    price_monthly: 899,
    price_yearly: 8999,
    storage_limit_bytes: 1024 * 1024 * 1024 * 1024, // 1 TB
    ai_daily_limit: -1, // Unlimited AI
    offline_download_limit: -1, // Unlimited Offline Downloads
    family_member_limit: 5, // Up to 5 Family Members
    features: [
      { text: '1 TB Shared Storage', highlight: true },
      { text: 'Up to 5 Family Members', highlight: true },
      { text: 'Unlimited AI' },
      { text: 'Unlimited Offline Downloads' },
      { text: 'Shared Library' },
      { text: 'Shared Collections' },
      { text: 'Family Reading' },
    ],
    is_active: true,
    sort_order: 3,
  },
]

export const subscriptionsService = {
  /**
   * Fetches active subscription plans dynamically from Supabase database `subscription_plans` table.
   * Gracefully falls back to default plans if table does not exist or network is offline.
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error || !data || data.length === 0) {
        console.warn('Using fallback subscription plans (Supabase query returned empty or error):', error?.message)
        return DEFAULT_PLANS
      }

      return data as unknown as SubscriptionPlan[]
    } catch (err) {
      console.warn('Failed to load subscription plans from Supabase, using fallback defaults:', err)
      return DEFAULT_PLANS
    }
  },

  /**
   * Fetches active user subscription from Supabase `user_subscriptions` table.
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    if (!userId) return null
    try {
      let { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Failed to query user subscription:', error.message)
      }

      if (!data) {
        // Fetch database plans to get free tier features dynamically
        const plans = await this.getSubscriptionPlans()
        const freePlan = plans.find((p) => p.id === 'free') || DEFAULT_PLANS[0]

        const periodEnd = new Date()
        periodEnd.setFullYear(periodEnd.getFullYear() + 10) // 10 years default duration for free tier

        const payload = {
          user_id: userId,
          plan_id: 'free',
          billing_cycle: 'monthly' as const,
          status: 'active' as const,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { data: inserted, error: insertError } = await supabase
          .from('user_subscriptions')
          .insert(payload)
          .select('*, plan:subscription_plans(*)')
          .single()

        if (!insertError && inserted) {
          data = inserted
        } else {
          return {
            user_id: userId,
            plan_id: 'free',
            billing_cycle: 'monthly',
            status: 'active',
            current_period_start: payload.current_period_start,
            current_period_end: payload.current_period_end,
            plan: freePlan,
          }
        }
      }

      return data as unknown as UserSubscription
    } catch (err) {
      console.warn('Failed to load user subscription from DB:', err)
      return null
    }
  },

  /**
   * Updates user subscription in database table `user_subscriptions`.
   */
  async updateUserSubscription(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<UserSubscription> {
    const periodEnd = new Date()
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    const payload = {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Sending UPDATE to user_subscriptions table:', payload)

    try {
      const { data, error, status, count } = await supabase
        .from('user_subscriptions')
        .upsert(payload, { onConflict: 'user_id', count: 'exact' })
        .select('*, plan:subscription_plans(*)')
        .single()

      console.log('Supabase user_subscriptions UPDATE response:', { data, error, status, count })

      if (error) {
        console.error('Supabase query failed:', error)
        throw error
      }

      if (!data) {
        throw new Error('Supabase responded with empty payload.')
      }

      return data as unknown as UserSubscription
    } catch (err) {
      console.error('Exception during updateUserSubscription:', err)
      throw err
    }
  },

  /**
   * Helper utility functions for dynamic plan checks
   */
  isUnlimited(limit: number): boolean {
    return limit === -1
  },

  formatStorageLimit(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(0)} TB`
    }
    return `${gb.toFixed(0)} GB`
  },

  formatAILimit(limit: number): string {
    return limit === -1 ? 'Unlimited' : `${limit} Requests / Day`
  },

  formatOfflineLimit(limit: number): string {
    return limit === -1 ? 'Unlimited' : `Up to ${limit} Books`
  },

  formatFamilyLimit(members: number): string {
    return members > 1 ? `Up to ${members} Family Members` : '1 Member'
  },
}
