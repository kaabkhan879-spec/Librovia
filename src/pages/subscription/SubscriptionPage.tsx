import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useSubscription, type PlanType } from '../../context/SubscriptionContext'
import { useToast } from '../../context/ToastContext'
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
} from 'lucide-react'

// Features list structure for pricing cards
interface PlanFeature {
  text: string
  highlight?: boolean
}

interface PricingPlanData {
  id: PlanType
  name: string
  badge?: string
  monthlyPrice: string
  monthlyNumber: number
  yearlyPrice: string
  yearlyNumber: number
  yearlySave: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  features: PlanFeature[]
  buttonText: string
  isPopular?: boolean
}

const PLANS_DATA: PricingPlanData[] = [
  {
    id: 'free',
    name: 'FREE',
    monthlyPrice: 'PKR 0',
    monthlyNumber: 0,
    yearlyPrice: 'PKR 0',
    yearlyNumber: 0,
    yearlySave: 'Always Free',
    description: 'Perfect for casual readers getting started with digital book management.',
    icon: BookOpen,
    features: [
      { text: '5 GB Cloud Storage' },
      { text: '20 AI Requests per Day' },
      { text: 'Up to 10 Offline Downloads' },
      { text: 'Unlimited Reading' },
      { text: 'Notes & Highlights' },
      { text: 'Collections' },
      { text: 'Basic Reader' },
    ],
    buttonText: 'Get Started',
  },
  {
    id: 'pro',
    name: 'PRO',
    badge: '⭐ Most Popular',
    monthlyPrice: 'PKR 1,499',
    monthlyNumber: 1499,
    yearlyPrice: 'PKR 14,999',
    yearlyNumber: 14999,
    yearlySave: 'Save 17%',
    description: 'Designed for avid readers, researchers, and AI-powered studying.',
    icon: Crown,
    isPopular: true,
    features: [
      { text: '300 GB Cloud Storage', highlight: true },
      { text: 'Unlimited AI', highlight: true },
      { text: 'Unlimited Offline Downloads', highlight: true },
      { text: 'Faster AI Responses' },
      { text: 'Premium Reader Experience' },
      { text: 'Priority Sync' },
      { text: 'Premium Support' },
    ],
    buttonText: 'Upgrade to Pro',
  },
  {
    id: 'family',
    name: 'FAMILY',
    badge: 'Best Value',
    monthlyPrice: 'PKR 2,999',
    monthlyNumber: 2999,
    yearlyPrice: 'PKR 29,999',
    yearlyNumber: 29999,
    yearlySave: 'Save 17%',
    description: 'Shared digital library experience for families and reading groups.',
    icon: Users,
    features: [
      { text: '1 TB Shared Storage', highlight: true },
      { text: 'Up to 5 Members', highlight: true },
      { text: 'Unlimited AI' },
      { text: 'Unlimited Offline Downloads' },
      { text: 'Shared Library' },
      { text: 'Shared Collections' },
      { text: 'Family Reading' },
    ],
    buttonText: 'Upgrade to Family',
  },
]

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
      'With the Family plan, the primary owner can invite up to 4 family members (5 total accounts). Each member gets their own private reading workspace plus access to shared collections.',
  },
  {
    question: 'Are there any hidden payment processing fees?',
    answer:
      'No. The prices displayed (PKR) are all-inclusive with zero extra transaction fees.',
  },
]

export const SubscriptionPage: React.FC = () => {
  const {
    plan: currentPlan,
    billingCycle,
    subscriptionStatus,
    renewalDate,
    storageUsedBytes,
    storageLimitBytes,
    invoices,
    paymentMethods,
    setPlan,
    setBillingCycle,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription()

  const { showSuccess, showInfo, showError } = useToast()

  // Tab for Future-ready placeholders
  const [activePlaceholderTab, setActivePlaceholderTab] = useState<
    'invoices' | 'payment_methods' | 'promo'
  >('invoices')

  // Selected plan for Upgrade Modal
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PricingPlanData | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false)

  // FAQ accordion collapse state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Storage metric calculations
  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)
  const storageLimitGB = (storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0)
  const storageRemainingGB = (
    (storageLimitBytes - storageUsedBytes) /
    (1024 * 1024 * 1024)
  ).toFixed(1)
  const storagePercentage = Math.min(
    100,
    Math.round((storageUsedBytes / storageLimitBytes) * 100)
  )

  // Handlers
  const handleUpgradeClick = (planData: PricingPlanData) => {
    if (planData.id === currentPlan) {
      showInfo(`You are already subscribed to the ${planData.name} plan.`)
      return
    }
    setSelectedUpgradePlan(planData)
    setPromoInput('')
    setPromoApplied(false)
    setPromoDiscount(0)
  }

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (code === 'WELCOME10' || code === 'LIBROVIA17') {
      setPromoApplied(true)
      setPromoDiscount(15) // 15% discount
      showSuccess(`Promo code '${code}' applied! 15% extra discount added.`)
    } else if (code === '') {
      showError('Please enter a promo code.')
    } else {
      showError('Invalid or expired promo code.')
    }
  }

  const handleConfirmSubscription = () => {
    if (!selectedUpgradePlan) return
    setIsProcessingUpgrade(true)

    setTimeout(() => {
      setPlan(selectedUpgradePlan.id)
      setIsProcessingUpgrade(false)
      setSelectedUpgradePlan(null)
      showSuccess(
        `Successfully updated plan to ${selectedUpgradePlan.name}! (Payment Gateway Placeholder)`
      )
    }, 900)
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
            <span>Simple, Transparent Pricing</span>
          </div>

          <h1 className="font-sans text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Unlock the Full Power of <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 bg-clip-text text-transparent">Librovia</span>
          </h1>

          <p className="mx-auto max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Choose the perfect plan for your reading journey. Enjoy expanded cloud storage, unlimited AI search, offline access, and collaborative family tools.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      <div className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-xs dark:border-purple-900/40 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Active Plan details */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Crown className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                  Current Active Plan
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {subscriptionStatus}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 capitalize dark:text-white">
                {currentPlan} Plan
              </h2>
              {currentPlan !== 'free' && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Renews on <span className="font-bold text-slate-700 dark:text-slate-200">{renewalDate}</span> ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                </p>
              )}
            </div>
          </div>

          {/* Storage Bar */}
          <div className="min-w-[280px] flex-1 max-w-md rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Storage Usage</span>
              </span>
              <span className="font-mono text-[11px]">
                {storageUsedGB} GB / {currentPlan === 'family' ? '1 TB' : `${storageLimitGB} GB`}
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {currentPlan !== 'free' ? (
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {subscriptionStatus === 'Canceled' ? 'Reactivate Plan' : 'Cancel Renewal'}
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500">
                Upgrade to unlock higher limits
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PRICING CARDS (FREE, PRO, FAMILY) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
        {PLANS_DATA.map((planData) => {
          const isCurrent = currentPlan === planData.id
          const isPro = planData.isPopular
          const displayPrice =
            billingCycle === 'yearly' ? planData.yearlyPrice : planData.monthlyPrice
          const billingSuffix =
            planData.id === 'free'
              ? '/ forever'
              : billingCycle === 'yearly'
              ? '/ year'
              : '/ month'

          return (
            <div
              key={planData.id}
              className={`premium-card relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                isPro
                  ? 'border-2 border-purple-600 bg-white shadow-xl shadow-purple-500/10 ring-4 ring-purple-600/10 lg:-translate-y-2 dark:border-purple-500 dark:bg-slate-900 dark:shadow-purple-950/30'
                  : 'border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              {/* Badge for Pro or Family */}
              {planData.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-black tracking-wide uppercase shadow-md ${
                    isPro
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {planData.badge}
                </div>
              )}

              {/* Card Header */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isPro
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <planData.icon className="h-6 w-6" />
                  </div>

                  {billingCycle === 'yearly' && planData.id !== 'free' && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {planData.yearlySave}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                    {planData.name}
                  </h3>
                  <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                    {planData.description}
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
                  {billingCycle === 'yearly' && planData.id !== 'free' && (
                    <p className="mt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Billed annually (Save 17%)
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3.5">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Included Features
                  </span>
                  <ul className="space-y-2.5">
                    {planData.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            feat.highlight || isPro
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className={feat.highlight ? 'font-bold text-slate-900 dark:text-white' : ''}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button / Empty State Handling */}
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
                    onClick={() => handleUpgradeClick(planData)}
                    className={`premium-button w-full cursor-pointer rounded-2xl py-3.5 text-xs font-black transition-all shadow-md ${
                      isPro
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20'
                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    }`}
                  >
                    {planData.id === 'free' ? 'Switch to Free' : planData.buttonText}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ==================================================================== */}
      {/* 4. PLAN COMPARISON TABLE */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-1">
          <h2 className="font-sans text-2xl font-black text-slate-900 dark:text-white">
            Detailed Feature Comparison
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Compare all features across Free, Pro, and Family plans side-by-side.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-extrabold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white">
                <th className="p-4 sm:p-5">Features</th>
                <th className="p-4 text-center sm:p-5">Free</th>
                <th className="p-4 text-center text-purple-700 sm:p-5 dark:text-purple-400">
                  Pro ⭐
                </th>
                <th className="p-4 text-center sm:p-5">Family 👨‍👩‍👧</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Storage Space
                </td>
                <td className="p-4 text-center sm:p-5">5 GB</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  300 GB
                </td>
                <td className="p-4 text-center font-bold sm:p-5">1 TB Shared</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  AI Usage
                </td>
                <td className="p-4 text-center sm:p-5">20 Requests / Day</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Unlimited
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Offline Downloads
                </td>
                <td className="p-4 text-center sm:p-5">Up to 10 Books</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Unlimited
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Collections
                </td>
                <td className="p-4 text-center sm:p-5">Standard</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Custom & Smart
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Shared Collections</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Reader Experience
                </td>
                <td className="p-4 text-center sm:p-5">Basic Reader</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Premium Experience
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Family Reading Mode</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">Notes</td>
                <td className="p-4 text-center sm:p-5">Standard Notes</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Voice & Smart Notes
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Shared Notes</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Highlights
                </td>
                <td className="p-4 text-center sm:p-5">3 Colors</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Unlimited Colors
                </td>
                <td className="p-4 text-center font-bold sm:p-5">Shared Annotations</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  Family Sharing
                </td>
                <td className="p-4 text-center text-slate-400 sm:p-5">✕</td>
                <td className="p-4 text-center text-slate-400 sm:p-5">✕</td>
                <td className="p-4 text-center font-bold text-emerald-600 sm:p-5 dark:text-emerald-400">
                  Up to 5 Members
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">Support</td>
                <td className="p-4 text-center sm:p-5">Community</td>
                <td className="p-4 text-center font-bold text-purple-600 sm:p-5 dark:text-purple-400">
                  Priority Support
                </td>
                <td className="p-4 text-center font-bold sm:p-5">24/7 Dedicated Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. FUTURE-READY PLACEHOLDERS (INVOICES, PAYMENT METHODS, PROMO CODES) */}
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
          <div className="flex border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
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
          </div>

          {/* Tab Content */}
          <div className="pt-6">
            {activePlaceholderTab === 'invoices' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] dark:border-slate-800">
                        <th className="pb-3">Invoice Number</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
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
                    onClick={() => showInfo('Add Payment Method integration coming soon.')}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-3 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100/60 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>+ Add Payment Method (Gateway Placeholder)</span>
                  </button>
                </div>
              </div>
            )}

            {activePlaceholderTab === 'promo' && (
              <div className="max-w-md space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Redeem Promo Code or Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code (e.g. WELCOME10)"
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 transition-all focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-purple-700 shadow-xs"
                  >
                    Apply Code
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Try using code <span className="font-mono font-bold text-purple-600 dark:text-purple-400">WELCOME10</span> or <span className="font-mono font-bold text-purple-600 dark:text-purple-400">LIBROVIA17</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-1">
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
                      className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-medium leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-300"
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
      {/* 7. UPGRADE CONFIRMATION MODAL (PAYMENT PLACEHOLDER FLOW) */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {selectedUpgradePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUpgradePlan(null)}
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
                onClick={() => setSelectedUpgradePlan(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-6">
                {/* Modal Title */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                      Upgrade to {selectedUpgradePlan.name} Plan
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {billingCycle === 'yearly' ? 'Annual Billing (Save 17%)' : 'Monthly Billing'}
                    </p>
                  </div>
                </div>

                {/* Plan Summary Box */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Selected Plan</span>
                    <span>{selectedUpgradePlan.name}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Base Price</span>
                    <span>
                      {billingCycle === 'yearly'
                        ? selectedUpgradePlan.yearlyPrice
                        : selectedUpgradePlan.monthlyPrice}
                    </span>
                  </div>

                  {promoApplied && (
                    <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Promo Discount ({promoDiscount}%)</span>
                      <span>Applied</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900 dark:border-slate-700 dark:text-white">
                    <span>Total Due Today</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {billingCycle === 'yearly'
                        ? selectedUpgradePlan.yearlyPrice
                        : selectedUpgradePlan.monthlyPrice}
                    </span>
                  </div>
                </div>

                {/* Promo Code Input in Modal */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase dark:text-slate-300">
                    Have a promo code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="e.g. WELCOME10"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Payment Gateway Disclaimer Note */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-bold">Payment Gateway Placeholder</span>: Clicking confirm will update your account tier immediately in local state. No real monetary charges will occur.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(null)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSubscription}
                    disabled={isProcessingUpgrade}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    {isProcessingUpgrade ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Updating Plan...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        <span>Confirm & Upgrade</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
