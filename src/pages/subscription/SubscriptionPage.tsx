import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useSubscription } from '../../context/SubscriptionContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../services/supabase'
import { storageService } from '../../services/storage'
import {
  subscriptionsService,
  type SubscriptionPlan,
  type PaymentRequest,
} from '../../services/subscriptions'
import {
  Crown,
  Sparkles,
  Users,
  Check,
  HardDrive,
  Download,
  BookOpen,
  CreditCard,
  FileText,
  Tag,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Lock,
  Clock,
  Upload,
  AlertCircle,
} from 'lucide-react'

interface SystemSettings {
  id: number
  easypaisa_number?: string
  easypaisa_name?: string
  jazzcash_number?: string
  jazzcash_name?: string
  bank_name?: string
  bank_account_number?: string
  bank_account_name?: string
  support_email?: string
  payment_instructions?: string
  whatsapp_number?: string
}

// FAQ items
const FAQS = [
  {
    question: 'Can I change or cancel my plan at any time?',
    answer:
      'Yes, you can upgrade, downgrade, or cancel your subscription whenever you want. Your changes will take effect at the end of your current billing cycle.',
  },
  {
    question: 'How does the 17% annual discount work?',
    answer:
      'When you select Yearly billing, you pay upfront for 12 months and receive a 17% discount compared to monthly payments. That is equivalent to over 2 months free!',
  },
  {
    question: 'What happens to my books and notes if I downgrade?',
    answer:
      'Your uploaded books, highlights, and notes remain safe. If your data exceeds the storage limit of a lower tier, you will retain view access to existing files but need to clear space before uploading new items.',
  },
  {
    question: 'How does Family plan sharing work?',
    answer:
      'A Family plan subscription allows you to invite up to 4 other users. Once they accept, they get access to premium features and family shared library collections.',
  },
  {
    question: 'Are there any hidden payment processing fees?',
    answer: 'No. The prices displayed (PKR) are all-inclusive with zero extra transaction fees.',
  },
]

// Helper to select icon dynamically for database plan records
const getPlanIcon = (planId: string) => {
  switch (planId.toLowerCase()) {
    case 'pro':
      return Crown
    case 'family':
      return Users
    case 'free':
      return BookOpen
    default:
      return Sparkles
  }
}

export const SubscriptionPage: React.FC = () => {
  const {
    plans,
    loadingPlans,
    currentPlan,
    currentPlanId,
    billingCycle,
    subscriptionStatus,
    storageUsedBytes,
    storageLimitBytes,
    invoices,
    paymentMethods,
    setBillingCycle,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription()

  const { showSuccess, showInfo, showError } = useToast()

  // Tab for Future-ready placeholders
  const [activePlaceholderTab, setActivePlaceholderTab] = useState<
    'invoices' | 'payment_methods' | 'promo' | 'requests'
  >('invoices')

  // Selected plan for Upgrade Modal
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionPlan | null>(null)
  const [upgradeStep, setUpgradeStep] = useState<'summary' | 'payment' | 'success'>('summary')
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])

  // Form fields
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Bank Transfer'>(
    'EasyPaisa'
  )
  const [transactionId, setTransactionId] = useState('')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null)
  const [userNote, setUserNote] = useState('')
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // FAQ accordion collapse state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const fetchUserRequests = useCallback(async () => {
    try {
      const reqs = await subscriptionsService.getPaymentRequests()
      setPaymentRequests(reqs)
    } catch (err) {
      console.error('Failed to fetch payment requests:', err)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const initData = async () => {
      try {
        const reqs = await subscriptionsService.getPaymentRequests()
        if (isMounted) setPaymentRequests(reqs)
      } catch (err) {
        console.error(err)
      }
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()
        if (error) throw error
        if (isMounted) setSystemSettings(data as SystemSettings)
      } catch (err) {
        console.error(err)
      }
    }
    initData()
    return () => {
      isMounted = false
    }
  }, [])

  // Storage metric calculations driven by DB limit
  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)
  const storageLimitGBText = subscriptionsService.formatStorageLimit(storageLimitBytes)
  const storageRemainingGB = (
    Math.max(0, storageLimitBytes - storageUsedBytes) /
    (1024 * 1024 * 1024)
  ).toFixed(1)
  const storagePercentage = Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))

  // Handlers
  const handleUpgradeClick = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) {
      showInfo(`You are already subscribed to the ${plan.plan_name} plan.`)
      return
    }
    setSelectedUpgradePlan(plan)
    setUpgradeStep('summary')
  }

  const handleContinueToPayment = () => {
    if (!selectedUpgradePlan) return
    const price =
      billingCycle === 'yearly'
        ? selectedUpgradePlan.price_yearly
        : selectedUpgradePlan.price_monthly
    setPaidAmount(price)
    setUpgradeStep('payment')
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshotFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCloseUpgradeModal = () => {
    setSelectedUpgradePlan(null)
    setUpgradeStep('summary')
    setPaymentMethod('EasyPaisa')
    setTransactionId('')
    setPaidAmount(0)
    setScreenshotFile(null)
    setScreenshotPreviewUrl(null)
    setUserNote('')
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUpgradePlan) return
    if (!transactionId.trim()) {
      showError('Transaction ID is required')
      return
    }
    if (!screenshotFile) {
      showError('Please upload a proof of payment screenshot')
      return
    }
    if (paidAmount <= 0) {
      showError('Amount paid must be greater than zero')
      return
    }

    setSubmittingRequest(true)
    try {
      const screenshotPath = await storageService.uploadScreenshot(screenshotFile)

      await subscriptionsService.submitPaymentRequest({
        plan_id: selectedUpgradePlan.id,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        amount: paidAmount,
        screenshot_url: screenshotPath,
        note: userNote,
      })

      showSuccess('Your payment has been submitted successfully!')
      fetchUserRequests()
      setUpgradeStep('success')
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to submit payment request'
      showError(msg)
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <PageWrapper className="relative min-h-screen space-y-10 pb-24 text-left select-none">
      {/* ==================================================================== */}
      {/* 1. HERO HEADER & BILLING TOGGLE */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-b from-purple-50/70 via-white to-slate-50 p-8 text-center shadow-xs dark:border-purple-950/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-100/80 px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-purple-700 uppercase shadow-2xs dark:border-purple-800/60 dark:bg-purple-950/60 dark:text-purple-300">
            <Sparkles className="h-4 w-4 fill-purple-400 text-purple-600 dark:text-purple-400" />
            <span>Database-Driven SaaS Pricing</span>
          </div>

          <h1 className="font-sans text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Unlock the Full Power of{' '}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 bg-clip-text text-transparent">
              Librovia
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300">
            Choose the perfect plan for your reading journey. Enjoy expanded cloud storage,
            unlimited AI search, offline access, and collaborative family tools.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
            <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 shadow-inner dark:border-slate-800 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`relative z-10 cursor-pointer rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'text-purple-700 shadow-sm dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {billingCycle === 'monthly' && (
                  <motion.div
                    layoutId="billing-toggle-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-slate-900"
                  />
                )}
                <span className="relative z-10">Monthly Billing</span>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`relative z-10 flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 ${
                  billingCycle === 'yearly'
                    ? 'text-purple-700 shadow-sm dark:text-purple-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {billingCycle === 'yearly' && (
                  <motion.div
                    layoutId="billing-toggle-bg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-slate-900"
                  />
                )}
                <span className="relative z-10">Yearly Billing</span>
                <span className="relative z-10 inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white shadow-2xs">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CURRENT ACTIVE PLAN SUMMARY BANNER */}
      {/* ==================================================================== */}
      <div className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-xs transition-all duration-300 dark:border-purple-900/40 dark:bg-slate-900">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                  Current Plan
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-black text-slate-900 capitalize dark:text-white">
                    {currentPlan.plan_name} Plan
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>

            {currentPlan.id !== 'free' && (
              <button
                type="button"
                onClick={() => {
                  if (subscriptionStatus === 'Canceled') {
                    reactivateSubscription()
                    showSuccess('Auto-renewal reactivated!')
                  } else {
                    cancelSubscription()
                    showInfo('Subscription canceled. You retain access until end of period.')
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {subscriptionStatus === 'Canceled' ? 'Reactivate Plan' : 'Cancel Renewal'}
              </button>
            )}
          </div>

          {/* Current Plan Details Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Plan Name
              </span>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {currentPlan.plan_name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Storage Limit
              </span>
              <p className="mt-1 text-sm font-black text-purple-600 dark:text-purple-400">
                {storageLimitGBText}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Storage Used
              </span>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {storageUsedGB} GB{' '}
                <span className="text-xs font-semibold text-slate-400">
                  ({storagePercentage}% used)
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Billing Status
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {billingCycle === 'yearly' ? 'Yearly Billing (Save 17%)' : 'Monthly Billing'}
              </p>
            </div>
          </div>

          {/* Storage usage progress bar */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Cloud Storage Progress</span>
              </span>
              <span className="font-mono text-[11px]">
                {storageUsedGB} GB / {storageLimitGBText}
              </span>
            </div>

            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{storageRemainingGB} GB remaining</span>
              <span>{storagePercentage}% used</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. DYNAMIC PRICING CARDS FROM DATABASE (`subscription_plans`) */}
      {/* ==================================================================== */}
      {loadingPlans ? (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id
            const isPro = plan.id === 'pro'
            const numericPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
            const displayPrice = `PKR ${numericPrice.toLocaleString()}`
            const billingSuffix =
              plan.id === 'free' ? '/ forever' : billingCycle === 'yearly' ? '/ year' : '/ month'
            const Icon = getPlanIcon(plan.id)

            // Badge formatting
            const badgeText =
              plan.id === 'free'
                ? 'Free Forever'
                : plan.id === 'pro'
                  ? '⭐ Most Popular'
                  : '👨‍👩‍👧 Best Value'

            return (
              <div
                key={plan.id}
                className={`premium-card relative flex h-full flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  isPro
                    ? 'border-2 border-purple-600 bg-white shadow-xl ring-4 shadow-purple-500/10 ring-purple-600/10 lg:-translate-y-2 dark:border-purple-500 dark:bg-slate-900 dark:shadow-purple-950/30'
                    : 'border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {/* Badge from DB record */}
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-black tracking-wide uppercase shadow-md ${
                    isPro
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : plan.id === 'family'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {badgeText}
                </div>

                {/* Card Header */}
                <div className="flex flex-1 flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          isPro
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Save 17%
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                        {plan.plan_name}
                      </h3>
                      <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price Display */}
                    <div className="border-b border-slate-100 pb-6 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="font-sans text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          {displayPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {billingSuffix}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                        <p className="mt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                          Billed annually (Save 17%)
                        </p>
                      )}
                    </div>

                    {/* Dynamic Features List from DB */}
                    <div className="space-y-3.5">
                      <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Included Features
                      </span>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300"
                          >
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                feat.highlight || isPro
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span
                              className={
                                feat.highlight ? 'font-bold text-slate-900 dark:text-white' : ''
                              }
                            >
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 pt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-purple-200 bg-purple-50 py-3.5 text-xs font-black text-purple-700 shadow-xs dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpgradeClick(plan)}
                      className={`premium-button w-full cursor-pointer rounded-2xl py-3.5 text-xs font-black shadow-md transition-all ${
                        isPro
                          ? 'bg-purple-600 text-white shadow-purple-600/20 hover:bg-purple-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                      }`}
                    >
                      {plan.id === 'free' ? 'Switch to Free' : `Upgrade to ${plan.plan_name}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. DYNAMIC PLAN COMPARISON TABLE */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-6">
        <div className="space-y-1 text-center">
          <h2 className="font-sans text-2xl font-black text-slate-900 dark:text-white">
            Detailed Feature Comparison
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Compare limits dynamically loaded from database records.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-extrabold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white">
                <th className="p-4 sm:p-5">Features</th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className={`p-4 text-center sm:p-5 ${
                      p.id === 'pro' ? 'text-purple-700 dark:text-purple-400' : ''
                    }`}
                  >
                    {p.plan_name} {p.badge ? `(${p.badge.replace('⭐ ', '')})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Storage Space
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center sm:p-5 ${
                      p.id === 'pro' ? 'font-bold text-purple-600 dark:text-purple-400' : ''
                    }`}
                  >
                    {subscriptionsService.formatStorageLimit(p.storage_limit_bytes)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">AI Requests</td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center sm:p-5 ${
                      p.id === 'pro' ? 'font-bold text-purple-600 dark:text-purple-400' : ''
                    }`}
                  >
                    {subscriptionsService.formatAILimit(p.ai_daily_limit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Offline Downloads
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center sm:p-5 ${
                      p.id === 'pro' ? 'font-bold text-purple-600 dark:text-purple-400' : ''
                    }`}
                  >
                    {subscriptionsService.formatOfflineLimit(p.offline_download_limit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Family Members
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className={`p-4 text-center sm:p-5 ${
                      p.family_member_limit > 1
                        ? 'font-bold text-emerald-600 dark:text-emerald-400'
                        : ''
                    }`}
                  >
                    {subscriptionsService.formatFamilyLimit(p.family_member_limit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Reader Experience
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="p-4 text-center sm:p-5">
                    {p.id === 'free' ? 'Basic Reader' : 'Premium Reader'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">Support</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-4 text-center sm:p-5">
                    {p.id === 'family'
                      ? '24/7 Dedicated'
                      : p.id === 'pro'
                        ? 'Priority Support'
                        : 'Community'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. FUTURE-READY PLACEHOLDERS */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-6">
        <div className="space-y-1">
          <h2 className="font-sans text-xl font-black text-slate-900 dark:text-white">
            Billing Management & History
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            View past receipts, manage stored payment methods, or redeem promo codes.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* Tab buttons */}
          <div className="flex gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActivePlaceholderTab('invoices')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activePlaceholderTab === 'invoices'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Invoices & Receipts</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlaceholderTab('payment_methods')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activePlaceholderTab === 'payment_methods'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment Methods</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlaceholderTab('promo')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activePlaceholderTab === 'promo'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Promo Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlaceholderTab('requests')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activePlaceholderTab === 'requests'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Payment Requests</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="pt-6">
            {activePlaceholderTab === 'invoices' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                        <th className="pb-3">Invoice Number</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {inv.id}
                          </td>
                          <td className="py-3.5">{inv.date}</td>
                          <td className="py-3.5 font-bold">{inv.planName}</td>
                          <td className="py-3.5">{inv.amount}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => showInfo(`Downloading mock receipt ${inv.id}.pdf`)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <Download className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePlaceholderTab === 'payment_methods' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Visa ending in {pm.last4}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400">
                            Expires {pm.expiry} • Primary Method
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Default
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      showInfo('Payment gateway integration is currently under development.')
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-3 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100/60 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>+ Add Payment Method</span>
                  </button>
                </div>
              </div>
            )}

            {activePlaceholderTab === 'promo' && (
              <div className="max-w-md space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Redeem Promo Code or Coupon
                  </label>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Coming Soon
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Promo Code (Coming Soon)"
                    className="flex-1 cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
                  />
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-2xl bg-slate-300 px-4 py-2.5 text-xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-600"
                  >
                    Apply Code
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Promo code redemption feature is currently under development.
                </p>
              </div>
            )}

            {activePlaceholderTab === 'requests' && (
              <div className="space-y-4">
                {paymentRequests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                          <th className="pb-3">Submitted Date</th>
                          <th className="pb-3">Plan</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Transaction ID</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold dark:divide-slate-800/40">
                        {paymentRequests.map((req) => (
                          <tr key={req.id} className="text-slate-600 dark:text-slate-300">
                            <td className="py-3.5 font-mono text-slate-400">
                              {new Date(req.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 font-bold text-purple-600 uppercase dark:text-purple-400">
                              {req.plan_id}
                            </td>
                            <td className="py-3.5">{req.payment_method}</td>
                            <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                              PKR {req.amount.toLocaleString()}
                            </td>
                            <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                              {req.transaction_id}
                            </td>
                            <td className="py-3.5">
                              {req.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  Approved
                                </span>
                              )}
                              {req.status === 'Rejected' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                  Rejected
                                </span>
                              )}
                              {req.status === 'Pending Verification' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                  Pending Verification
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 text-right">
                              {req.status === 'Rejected' && req.rejection_reason && (
                                <span className="block text-[10.5px] font-medium text-rose-500">
                                  Reason: {req.rejection_reason}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                    No payment requests submitted.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-6">
        <div className="space-y-1 text-center">
          <h2 className="font-sans text-2xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Have questions about Librovia plans? Find your answers here.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full cursor-pointer items-center justify-between p-4 text-left text-xs font-extrabold text-slate-900 transition-colors hover:bg-slate-50/80 dark:text-white dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs leading-relaxed font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-300"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 7. UPGRADE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {selectedUpgradePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseUpgradeModal}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl border border-purple-100 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseUpgradeModal}
                disabled={submittingRequest}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              {upgradeStep === 'summary' ? (
                <div className="space-y-6">
                  {/* Modal Title */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                        Upgrade to {selectedUpgradePlan.plan_name} Plan
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {billingCycle === 'yearly'
                          ? 'Annual Billing (Save 17%)'
                          : 'Monthly Billing'}
                      </p>
                    </div>
                  </div>

                  {/* Plan Summary Box */}
                  <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>Selected Plan</span>
                      <span>{selectedUpgradePlan.plan_name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>Base Price</span>
                      <span>
                        PKR{' '}
                        {(billingCycle === 'yearly'
                          ? selectedUpgradePlan.price_yearly
                          : selectedUpgradePlan.price_monthly
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900 dark:border-slate-700 dark:text-white">
                      <span>Total Due Today</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        PKR{' '}
                        {(billingCycle === 'yearly'
                          ? selectedUpgradePlan.price_yearly
                          : selectedUpgradePlan.price_monthly
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Promo Code Disabled with Coming Soon */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-extrabold text-slate-600 uppercase dark:text-slate-300">
                        Promo Code
                      </label>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9.5px] font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Coming Soon
                      </span>
                    </div>
                    <input
                      type="text"
                      disabled
                      placeholder="Promo Code (Coming Soon)"
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2 text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
                    />
                  </div>

                  {/* Manual Verification Note */}
                  <div className="flex items-start gap-2.5 rounded-2xl border border-purple-200/80 bg-purple-50/80 p-3.5 text-xs text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-200">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    <div className="space-y-0.5 text-left text-[11px] leading-relaxed">
                      <span className="block font-bold text-purple-900 dark:text-purple-300">
                        Manual Verification
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        We support local wallets (JazzCash, EasyPaisa, Bank Transfer). The plan
                        activates immediately upon admin transaction approval.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseUpgradeModal}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all duration-200 hover:bg-purple-700 active:scale-98"
                    >
                      <Crown className="h-4 w-4" />
                      <span>Continue to Payment</span>
                    </button>
                  </div>
                </div>
              ) : upgradeStep === 'payment' ? (
                // Step 2: Payment Gateway & Submission form
                <form
                  onSubmit={handleSubmitPayment}
                  className="max-h-[80vh] space-y-4 overflow-y-auto pr-1"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Make a Manual Payment
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Pay exactly{' '}
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          PKR {paidAmount.toLocaleString()}
                        </span>{' '}
                        to upgrade
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Instructions */}
                  <div className="rounded-2xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <p className="mb-1 font-semibold text-slate-900 dark:text-white">
                      Instructions:
                    </p>
                    <p>
                      {systemSettings?.payment_instructions ||
                        'Please transfer the select package price to any details below and upload screenshot.'}
                    </p>
                  </div>

                  {/* Payment Details channels */}
                  <div className="space-y-2 rounded-2xl border border-slate-200/65 bg-slate-50/50 p-3.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                    {paymentMethod === 'EasyPaisa' &&
                      (systemSettings?.easypaisa_number && systemSettings?.easypaisa_name ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                            <span className="text-slate-500">Account Holder:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {systemSettings.easypaisa_name}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Mobile Number:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {systemSettings.easypaisa_number}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-center font-bold text-rose-500">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>
                            Payment details are not configured. Please contact the administrator.
                          </span>
                        </div>
                      ))}

                    {paymentMethod === 'JazzCash' &&
                      (systemSettings?.jazzcash_number && systemSettings?.jazzcash_name ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                            <span className="text-slate-500">Account Holder:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {systemSettings.jazzcash_name}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Mobile Number:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {systemSettings.jazzcash_number}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-center font-bold text-rose-500">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>
                            Payment details are not configured. Please contact the administrator.
                          </span>
                        </div>
                      ))}

                    {paymentMethod === 'Bank Transfer' &&
                      (systemSettings?.bank_name &&
                      systemSettings?.bank_account_number &&
                      systemSettings?.bank_account_name ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                            <span className="text-slate-500">Bank Name:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {systemSettings.bank_name}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                            <span className="text-slate-500">Account Holder:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {systemSettings.bank_account_name}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                            <span className="text-slate-500">Account Number:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {systemSettings.bank_account_number}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">IBAN:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {systemSettings.bank_account_number}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-center font-bold text-rose-500">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>
                            Payment details are not configured. Please contact the administrator.
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Form inputs */}
                  <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div>
                      <label className="mb-1 block text-[11px] font-extrabold text-slate-500 uppercase">
                        Select Payment Wallet/Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setPaymentMethod(
                            e.target.value as 'EasyPaisa' | 'JazzCash' | 'Bank Transfer'
                          )
                        }
                        className="focus:border-purple-650 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-extrabold text-slate-500 uppercase">
                          Amount Paid (PKR)
                        </label>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          required
                          className="focus:border-purple-650 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-extrabold text-slate-500 uppercase">
                          Transaction ID / Ref ID
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          required
                          placeholder="e.g. 1029384756"
                          className="focus:border-purple-650 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-extrabold text-slate-500 uppercase">
                        Upload Receipt Screenshot
                      </label>
                      <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          required={!screenshotPreviewUrl}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        {screenshotPreviewUrl ? (
                          <div className="relative max-h-32 w-full overflow-hidden rounded-xl border border-slate-100">
                            <img
                              src={screenshotPreviewUrl}
                              alt="Receipt Preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-[10px] font-extrabold tracking-wider text-white uppercase">
                              Change Screenshot
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center">
                            <Upload className="mx-auto mb-1 h-6 w-6 text-slate-400" />
                            <span className="block text-[10px] font-bold text-slate-500">
                              Click or drag screenshot here
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">
                              JPEG, PNG, WEBP (Max 5MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-extrabold text-slate-500 uppercase">
                        Optional Note
                      </label>
                      <textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="Add any details for payment verification..."
                        rows={2}
                        className="focus:border-purple-650 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={submittingRequest}
                      onClick={() => setUpgradeStep('summary')}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-700 active:scale-98 disabled:opacity-50"
                    >
                      {submittingRequest ? 'Submitting...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              ) : (
                // Step 3: Success screen with WhatsApp support trigger
                <div className="space-y-6 py-4 text-center select-none">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner dark:bg-emerald-950/70 dark:text-emerald-400">
                    <CheckCircle2 className="h-8 w-8 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                      Payment Submitted Successfully! ⏳
                    </h3>
                    <p className="mx-auto max-w-sm text-xs leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                      Your payment request for the{' '}
                      <span className="font-bold text-purple-600 uppercase dark:text-purple-400">
                        {selectedUpgradePlan?.plan_name}
                      </span>{' '}
                      plan has been received. Our team will verify and activate your subscription
                      shortly.
                    </p>
                  </div>

                  {systemSettings?.whatsapp_number && (
                    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-slate-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-slate-300">
                      <p className="text-[11px] leading-normal font-bold text-slate-800 dark:text-white">
                        Need quick activation? Message us on WhatsApp for fast verification!
                      </p>
                      <a
                        href={`https://wa.me/${systemSettings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hello Support! I have submitted a manual payment request for my upgrade to the ${selectedUpgradePlan?.plan_name.toUpperCase()} plan (TxID: ${transactionId}). Please verify and approve it quickly. Thank you!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-700 active:scale-98"
                      >
                        <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.414 9.866-9.84.002-2.628-1.02-5.1-2.878-6.958C16.398 1.95 13.933 1.929 12 1.929c-5.436 0-9.86 4.415-9.864 9.843-.001 1.848.493 3.654 1.432 5.228l-.995 3.635 3.73-.977-.256-.489zm13.125-9.351c-.321-.16-1.9-.938-2.193-1.047-.293-.108-.507-.162-.72.16-.213.32-.825 1.047-1.012 1.261-.187.213-.373.24-.693.08-.32-.16-1.353-.499-2.577-1.591-.951-.849-1.593-1.898-1.78-2.218-.187-.32-.02-.493.14-.653.144-.144.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.734-.987-2.373-.259-.626-.523-.538-.72-.547-.187-.008-.4-.01-.613-.01-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.293.16.2 2.257 3.447 5.467 4.833.764.331 1.36.528 1.823.675.77.244 1.472.21 2.027.128.618-.092 1.9-.777 2.167-1.493.267-.717.267-1.33.187-1.46-.08-.13-.293-.21-.613-.37z" />
                        </svg>
                        <span>Contact Support on WhatsApp</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCloseUpgradeModal}
                      className="w-full cursor-pointer rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all duration-200 hover:bg-purple-700 active:scale-98"
                    >
                      Close & Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
