import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import {
  subscriptionsService,
  type SubscriptionPlan,
  DEFAULT_PLANS,
  type UserSubscription,
} from '../services/subscriptions'
import { useAuth } from './AuthContext'
import { booksService } from '../services/books'
import { supabase } from '../services/supabase'

export type BillingCycle = 'monthly' | 'yearly'

export interface Invoice {
  id: string
  date: string
  amount: string
  planName: string
  status: 'Paid' | 'Pending' | 'Failed'
  pdfUrl?: string
}

export interface PaymentMethod {
  id: string
  type: 'visa' | 'mastercard' | 'easypaisa' | 'jazzcash'
  last4?: string
  accountName?: string
  expiry?: string
  isDefault: boolean
}

interface SubscriptionContextType {
  plans: SubscriptionPlan[]
  loadingPlans: boolean
  currentPlan: SubscriptionPlan
  currentPlanId: string
  billingCycle: BillingCycle
  subscriptionStatus: 'Active' | 'Auto-renewing' | 'Canceled' | 'Expired'
  renewalDate: string
  daysRemaining: number
  isExpired: boolean
  storageUsedBytes: number
  storageLimitBytes: number
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  setPlan: (planId: string) => Promise<void>
  setBillingCycle: (cycle: BillingCycle) => Promise<void>
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
  canUploadFile: (fileSizeBytes: number) => boolean
  hasReachedAILimit: (dailyRequestsUsed: number) => boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  // Dynamic Subscription Plans loaded from database table `subscription_plans`
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS)
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Current User Plan ID reference
  const [currentPlanId, setCurrentPlanId] = useState<string>(() => {
    return localStorage.getItem('librovia_user_plan') || 'free'
  })

  const [billingCycle, setBillingCycleState] = useState<BillingCycle>(() => {
    return (localStorage.getItem('librovia_billing_cycle') as BillingCycle) || 'monthly'
  })

  const [userSub, setUserSub] = useState<UserSubscription | null>(null)
  const [storageUsedBytes, setStorageUsedBytes] = useState<number>(0)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentMethods] = useState<PaymentMethod[]>([])

  // Load plans from DB on mount
  useEffect(() => {
    let isMounted = true
    subscriptionsService.getSubscriptionPlans().then((fetchedPlans) => {
      if (isMounted && fetchedPlans && fetchedPlans.length > 0) {
        setPlans(fetchedPlans)
        setLoadingPlans(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Refresh function to pull all fresh stats from Supabase
  const refreshSubscription = async () => {
    if (!user?.id) return
    try {
      const storageUsed = await booksService.getUserStorageUsed(user.id)
      setStorageUsedBytes(storageUsed)

      const sub = await subscriptionsService.getUserSubscription(user.id)
      if (sub) {
        setUserSub(sub)
        setCurrentPlanId(sub.plan_id)
        if (sub.billing_cycle) setBillingCycleState(sub.billing_cycle as BillingCycle)
      }

      // Fetch dynamic payment invoices from DB based on user email
      if (user.email) {
        const { data: payData, error: payError } = await supabase
          .from('payments')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false })

        if (!payError && payData) {
          const mapped = payData.map((p: any) => ({
            id: p.transaction_id,
            date: new Date(p.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            amount: `PKR ${p.amount_pkr}`,
            planName: p.plan_name,
            status:
              p.status === 'Completed' ? 'Paid' : p.status === 'Pending' ? 'Pending' : 'Failed',
          }))
          setInvoices(mapped as Invoice[])
        }
      }
    } catch (err) {
      console.error('Error refreshing subscription status:', err)
    }
  }

  // Load initial subscription and storage on user login
  useEffect(() => {
    if (user?.id) {
      refreshSubscription()
    } else {
      setUserSub(null)
      setStorageUsedBytes(0)
      setCurrentPlanId('free')
    }
  }, [user?.id])

  useEffect(() => {
    localStorage.setItem('librovia_user_plan', currentPlanId)
  }, [currentPlanId])

  useEffect(() => {
    localStorage.setItem('librovia_billing_cycle', billingCycle)
  }, [billingCycle])

  // Get active SubscriptionPlan object based on currentPlanId
  const currentPlan = useMemo(() => {
    const found = plans.find((p) => p.id === currentPlanId)
    return found || plans[0] || DEFAULT_PLANS[0]
  }, [plans, currentPlanId])

  // Expiry / Period Calculations
  const { renewalDate, daysRemaining, isExpired, subscriptionStatus } = useMemo(() => {
    if (!userSub || !userSub.current_period_end) {
      return {
        renewalDate: 'N/A',
        daysRemaining: 365,
        isExpired: false,
        subscriptionStatus: 'Active' as const,
      }
    }

    const end = new Date(userSub.current_period_end)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isExp = diffDays <= 0
    let status: 'Active' | 'Auto-renewing' | 'Canceled' | 'Expired' = 'Active'

    if (isExp) {
      status = 'Expired'
    } else if (userSub.status === 'canceled' || userSub.cancel_at_period_end) {
      status = 'Canceled'
    } else if (userSub.status === 'active') {
      status = 'Auto-renewing'
    }

    const formattedDate = end.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return {
      renewalDate: formattedDate,
      daysRemaining: diffDays,
      isExpired: isExp,
      subscriptionStatus: status,
    }
  }, [userSub])

  const setPlan = async (newPlanId: string) => {
    if (!user?.id) return
    const prevPlanId = currentPlanId
    try {
      const updated = await subscriptionsService.updateUserSubscription(
        user.id,
        newPlanId,
        billingCycle
      )
      if (updated) {
        setUserSub(updated)
        setCurrentPlanId(newPlanId)
      }
    } catch (err) {
      console.error('Failed to change subscription plan:', err)
      if (prevPlanId) {
        setCurrentPlanId(prevPlanId)
      }
      throw err
    }
  }

  const setBillingCycle = async (cycle: BillingCycle) => {
    if (!user?.id || !currentPlanId) return
    const prevCycle = billingCycle
    try {
      const updated = await subscriptionsService.updateUserSubscription(
        user.id,
        currentPlanId,
        cycle
      )
      if (updated) {
        setUserSub(updated)
        setBillingCycleState(cycle)
      }
    } catch (err) {
      console.error('Failed to change billing cycle:', err)
      setBillingCycleState(prevCycle)
      throw err
    }
  }

  const cancelSubscription = async () => {
    if (!user?.id || !userSub?.id) return
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ cancel_at_period_end: true, status: 'canceled' })
        .eq('user_id', user.id)
        .select('*, plan:subscription_plans(*)')
        .single()

      if (!error && data) {
        setUserSub(data as unknown as UserSubscription)
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err)
    }
  }

  const reactivateSubscription = async () => {
    if (!user?.id || !userSub?.id) return
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ cancel_at_period_end: false, status: 'active' })
        .eq('user_id', user.id)
        .select('*, plan:subscription_plans(*)')
        .single()

      if (!error && data) {
        setUserSub(data as unknown as UserSubscription)
      }
    } catch (err) {
      console.error('Failed to reactivate subscription:', err)
    }
  }

  const storageLimitBytes = useMemo(() => {
    if (userSub?.custom_limit_bytes !== undefined && userSub?.custom_limit_bytes !== null) {
      return Number(userSub.custom_limit_bytes)
    }
    if (
      userSub?.custom_storage_limit_bytes !== undefined &&
      userSub?.custom_storage_limit_bytes !== null
    ) {
      return Number(userSub.custom_storage_limit_bytes)
    }
    return currentPlan.storage_limit_bytes
  }, [userSub, currentPlan])

  // Quota validation methods based dynamically on current database plan
  const canUploadFile = (fileSizeBytes: number): boolean => {
    const totalAfterUpload = storageUsedBytes + fileSizeBytes
    return totalAfterUpload <= storageLimitBytes
  }

  const hasReachedAILimit = (dailyRequestsUsed: number): boolean => {
    if (currentPlan.ai_daily_limit === -1) return false // Unlimited
    return dailyRequestsUsed >= currentPlan.ai_daily_limit
  }

  return (
    <SubscriptionContext.Provider
      value={{
        plans,
        loadingPlans,
        currentPlan,
        currentPlanId,
        billingCycle,
        subscriptionStatus,
        renewalDate,
        daysRemaining,
        isExpired,
        storageUsedBytes,
        storageLimitBytes,
        invoices,
        paymentMethods,
        setPlan,
        setBillingCycle,
        cancelSubscription,
        reactivateSubscription,
        canUploadFile,
        hasReachedAILimit,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
