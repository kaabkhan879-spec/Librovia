import React, { createContext, useContext, useState, useEffect } from 'react'

export type PlanType = 'free' | 'pro' | 'family'
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
  plan: PlanType
  billingCycle: BillingCycle
  subscriptionStatus: 'Active' | 'Auto-renewing' | 'Canceled'
  renewalDate: string
  storageUsedBytes: number
  storageLimitBytes: number
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  setPlan: (plan: PlanType) => void
  setBillingCycle: (cycle: BillingCycle) => void
  cancelSubscription: () => void
  reactivateSubscription: () => void
}

const STORAGE_LIMITS: Record<PlanType, number> = {
  free: 5 * 1024 * 1024 * 1024, // 5 GB
  pro: 300 * 1024 * 1024 * 1024, // 300 GB
  family: 1024 * 1024 * 1024 * 1024, // 1 TB
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-003',
    date: 'Jul 15, 2026',
    amount: 'PKR 1,499',
    planName: 'Pro Plan (Monthly)',
    status: 'Paid',
  },
  {
    id: 'INV-2026-002',
    date: 'Jun 15, 2026',
    amount: 'PKR 1,499',
    planName: 'Pro Plan (Monthly)',
    status: 'Paid',
  },
  {
    id: 'INV-2026-001',
    date: 'May 15, 2026',
    amount: 'PKR 1,499',
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
  const [plan, setPlanState] = useState<PlanType>(() => {
    const saved = localStorage.getItem('librovia_user_plan')
    return (saved as PlanType) || 'free'
  })

  const [billingCycle, setBillingCycleState] = useState<BillingCycle>(() => {
    const saved = localStorage.getItem('librovia_billing_cycle')
    return (saved as BillingCycle) || 'monthly'
  })

  const [subscriptionStatus, setSubscriptionStatus] = useState<'Active' | 'Auto-renewing' | 'Canceled'>(
    'Auto-renewing'
  )

  const [storageUsedBytes] = useState(1.2 * 1024 * 1024 * 1024) // 1.2 GB used mock data

  useEffect(() => {
    localStorage.setItem('librovia_user_plan', plan)
  }, [plan])

  useEffect(() => {
    localStorage.setItem('librovia_billing_cycle', billingCycle)
  }, [billingCycle])

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan)
    if (newPlan !== 'free') {
      setSubscriptionStatus('Auto-renewing')
    }
  }

  const setBillingCycle = (cycle: BillingCycle) => {
    setBillingCycleState(cycle)
  }

  const cancelSubscription = () => {
    setSubscriptionStatus('Canceled')
  }

  const reactivateSubscription = () => {
    setSubscriptionStatus('Auto-renewing')
  }

  const renewalDate = 'August 20, 2026'

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        billingCycle,
        subscriptionStatus,
        renewalDate,
        storageUsedBytes,
        storageLimitBytes: STORAGE_LIMITS[plan],
        invoices: DEFAULT_INVOICES,
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        setPlan,
        setBillingCycle,
        cancelSubscription,
        reactivateSubscription,
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
