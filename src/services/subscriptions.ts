import { supabase } from './supabase'
import { auditService } from './audit'

export interface PaymentRequest {
  id: string
  user_id: string
  plan_id: string | null
  payment_method: string
  transaction_id: string
  amount: number
  screenshot_url: string
  note: string | null
  status: 'Pending Verification' | 'Approved' | 'Rejected'
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  user?: {
    email: string
    display_name?: string
  }
}

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
        console.warn(
          'Using fallback subscription plans (Supabase query returned empty or error):',
          error?.message
        )
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
      const { data: initialData, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', userId)
        .maybeSingle()

      let activeSub = initialData

      if (error) {
        console.error('Failed to query user subscription:', error.message)
      }

      if (!activeSub) {
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
          activeSub = inserted
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

      return activeSub as unknown as UserSubscription
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

  async submitPaymentRequest(payload: {
    plan_id: string
    payment_method: string
    transaction_id: string
    amount: number
    screenshot_url: string
    note?: string
  }): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.from('payment_requests').insert({
      user_id: user.id,
      plan_id: payload.plan_id,
      payment_method: payload.payment_method,
      transaction_id: payload.transaction_id,
      amount: payload.amount,
      screenshot_url: payload.screenshot_url,
      note: payload.note || null,
      status: 'Pending Verification',
    })

    if (error) {
      console.error('Failed to insert payment request:', error)
      throw error
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    try {
      await auditService.insertLog({
        event: 'Payment Submitted',
        category: 'Billing & Payments',
        severity: 'Info',
        actor_email: user.email,
        actor_role: roleData?.role || 'user',
        metadata: {
          planId: payload.plan_id,
          transactionId: payload.transaction_id,
          amount: payload.amount,
        },
      })
    } catch (err) {
      console.error('Failed to write audit log for payment submit:', err)
    }

    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'payment',
        title: 'Payment Awaiting Verification ⏳',
        message: `Your payment of PKR ${payload.amount} for the "${payload.plan_id.toUpperCase()}" plan has been submitted and is awaiting admin approval.`,
      })
    } catch (err) {
      console.error('Failed to write notification for payment submit:', err)
    }
  },

  async getPaymentRequests(): Promise<PaymentRequest[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment requests:', error)
      return []
    }
    return data as unknown as PaymentRequest[]
  },

  async getAllPaymentRequests(): Promise<PaymentRequest[]> {
    const { data: requests, error: reqError } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (reqError) {
      console.error('Error fetching admin payment requests:', reqError)
      return []
    }

    // Fetch profiles and user_roles in parallel to map emails and display names in-memory
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id, display_name'),
      supabase.from('user_roles').select('user_id, email'),
    ])

    const profilesMap = new Map<string, string | null>(
      profilesRes.data?.map((p: { id: string; display_name: string | null }) => [
        p.id,
        p.display_name,
      ]) || []
    )
    const rolesMap = new Map<string, string>(
      rolesRes.data?.map((r: { user_id: string; email: string }) => [r.user_id, r.email]) || []
    )

    return (requests || []).map((row: Record<string, unknown> & { user_id: string }) => ({
      ...row,
      user: {
        email: rolesMap.get(row.user_id) || 'Unknown',
        display_name: profilesMap.get(row.user_id) || 'Anonymous',
      },
    })) as unknown as PaymentRequest[]
  },

  async reviewPaymentRequest(
    id: string,
    status: 'Approved' | 'Rejected',
    rejectionReason?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Reviewer not authenticated')

    const { data: req } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!req) throw new Error('Payment request not found')

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('email')
      .eq('user_id', req.user_id)
      .maybeSingle()

    const userEmail = roleData?.email || 'Unknown'
    req.user = { email: userEmail }

    const updates: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (rejectionReason) {
      updates.rejection_reason = rejectionReason
    }

    const { error } = await supabase.from('payment_requests').update(updates).eq('id', id)
    if (error) throw error

    const { data: adminRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (status === 'Approved') {
      const deducedCycle = req.amount === 4999 || req.amount === 8999 ? 'yearly' : 'monthly'

      const periodEnd = new Date()
      if (deducedCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      }

      const { error: subErr } = await supabase.from('user_subscriptions').upsert(
        {
          user_id: req.user_id,
          plan_id: req.plan_id,
          billing_cycle: deducedCycle,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (subErr) throw subErr

      const plans = await this.getSubscriptionPlans()
      const selectedPlan = plans.find((p) => p.id === req.plan_id)
      const limitBytes = selectedPlan?.storage_limit_bytes || 5 * 1024 * 1024 * 1024

      const { error: storageErr } = await supabase.from('storage_usage').upsert(
        {
          user_id: req.user_id,
          limit_bytes: limitBytes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (storageErr) throw storageErr

      try {
        await auditService.insertLog({
          event: 'Payment Approved',
          category: 'Billing & Payments',
          severity: 'Info',
          actor_email: user.email,
          actor_role: adminRoleData?.role || 'super_admin',
          metadata: {
            targetUserId: req.user_id,
            targetUserEmail: req.user?.email || 'Unknown',
            planId: req.plan_id,
            transactionId: req.transaction_id,
            amount: req.amount,
          },
        })
      } catch (err) {
        console.error('Failed to write audit log for payment approval:', err)
      }

      try {
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          type: 'subscription',
          title: 'Subscription Activated! 🎉',
          message: `Your payment was approved! Your account has been upgraded to the ${req.plan_id.toUpperCase()} plan. Thank you for choosing Librovia!`,
        })
      } catch (err) {
        console.error('Failed to write notification for payment approval:', err)
      }
    } else {
      try {
        await auditService.insertLog({
          event: 'Payment Rejected',
          category: 'Billing & Payments',
          severity: 'Warning',
          actor_email: user.email,
          actor_role: adminRoleData?.role || 'super_admin',
          metadata: {
            targetUserId: req.user_id,
            targetUserEmail: req.user?.email || 'Unknown',
            planId: req.plan_id,
            transactionId: req.transaction_id,
            rejectionReason,
          },
        })
      } catch (err) {
        console.error('Failed to write audit log for payment rejection:', err)
      }

      try {
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          type: 'alert',
          title: 'Payment Request Declined ❌',
          message: `Your payment verification request for the "${req.plan_id.toUpperCase()}" plan was declined. Reason: "${rejectionReason || 'No reason provided'}".`,
        })
      } catch (err) {
        console.error('Failed to write notification for payment rejection:', err)
      }
    }
  },
}
