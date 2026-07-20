import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import {
  subscriptionsService,
  type SubscriptionPlan,
  DEFAULT_PLANS,
} from '../services/subscriptions'
import { useAuth } from './AuthContext'

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
  subscriptionStatus: 'Active' | 'Auto-renewing' | 'Canceled'
  renewalDate: string
  storageUsedBytes: number
  storageLimitBytes: number
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  setPlan: (planId: string) => void
  setBillingCycle: (cycle: BillingCycle) => void
  cancelSubscription: () => void
  reactivateSubscription: () => void
  canUploadFile: (fileSizeBytes: number) => boolean
  hasReachedAILimit: (dailyRequestsUsed: number) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-003',
    date: 'Jul 15, 2026',
    amount: 'PKR 500',
    planName: 'Pro Plan (Monthly)',
    status: 'Paid',
  },
  {
    id: 'INV-2026-002',
    date: 'Jun 15, 2026',
    amount: 'PKR 500',
    planName: 'Pro Plan (Monthly)',
    status: 'Paid',
  },
  {
    id: 'INV-2026-001',
    date: 'May 15, 2026',
    amount: 'PKR 500',
    planName: 'Pro Plan (Monthly)',
    status: 'Paid',
  },
]

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'visa',
    last4: '4242',
    accountName: 'Kaab Khan',
    expiry: '08/28',
    isDefault: true,
  },
]

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

  const [subscriptionStatus, setSubscriptionStatus] = useState<'Active' | 'Auto-renewing' | 'Canceled'>(
    'Auto-renewing'
  )

  const [storageUsedBytes] = useState(1.2 * 1024 * 1024 * 1024) // 1.2 GB mock usage

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

  // Sync user subscription from DB if logged in
  useEffect(() => {
    if (user?.id) {
      subscriptionsService.getUserSubscription(user.id).then((sub) => {
        if (sub && sub.plan_id) {
          setCurrentPlanId(sub.plan_id)
          if (sub.billing_cycle) setBillingCycleState(sub.billing_cycle as BillingCycle)
        }
      })
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

  const setPlan = (newPlanId: string) => {
    setCurrentPlanId(newPlanId)
    if (newPlanId !== 'free') {
      setSubscriptionStatus('Auto-renewing')
    }
    if (user?.id) {
      subscriptionsService.updateUserSubscription(user.id, newPlanId, billingCycle)
    }
  }

  const setBillingCycle = (cycle: BillingCycle) => {
    setBillingCycleState(cycle)
    if (user?.id && currentPlanId) {
      subscriptionsService.updateUserSubscription(user.id, currentPlanId, cycle)
    }
  }

  const cancelSubscription = () => {
    setSubscriptionStatus('Canceled')
  }

  const reactivateSubscription = () => {
    setSubscriptionStatus('Auto-renewing')
  }

  // Quota validation methods based dynamically on current database plan
  const canUploadFile = (fileSizeBytes: number): boolean => {
    const totalAfterUpload = storageUsedBytes + fileSizeBytes
    return totalAfterUpload <= currentPlan.storage_limit_bytes
  }

  const hasReachedAILimit = (dailyRequestsUsed: number): boolean => {
    if (currentPlan.ai_daily_limit === -1) return false // Unlimited
    return dailyRequestsUsed >= currentPlan.ai_daily_limit
  }

  const renewalDate = 'August 20, 2026'

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
        storageUsedBytes,
        storageLimitBytes: currentPlan.storage_limit_bytes,
        invoices: DEFAULT_INVOICES,
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        setPlan,
        setBillingCycle,
        cancelSubscription,
        reactivateSubscription,
        canUploadFile,
        hasReachedAILimit,
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
