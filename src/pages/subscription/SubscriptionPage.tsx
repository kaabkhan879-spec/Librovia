import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useSubscription } from '../../context/SubscriptionContext'
import { useToast } from '../../context/ToastContext'
import { subscriptionsService, type SubscriptionPlan } from '../../services/subscriptions'
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

  const { showSuccess, showInfo } = useToast()

  // Tab for Future-ready placeholders
  const [activePlaceholderTab, setActivePlaceholderTab] = useState<
    'invoices' | 'payment_methods' | 'promo'
  >('invoices')

  // Selected plan for Upgrade Modal
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionPlan | null>(null)
  const [showPaymentGatewayNotice, setShowPaymentGatewayNotice] = useState(false)
  const [isProcessingUpgrade] = useState(false)

  // FAQ accordion collapse state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Storage metric calculations driven by DB limit
  const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)
  const storageLimitGBText = subscriptionsService.formatStorageLimit(storageLimitBytes)
  const storageRemainingGB = (
    Math.max(0, storageLimitBytes - storageUsedBytes) /
    (1024 * 1024 * 1024)
  ).toFixed(1)
  const storagePercentage = Math.min(
    100,
    Math.round((storageUsedBytes / storageLimitBytes) * 100)
  )

  // Handlers
  const handleUpgradeClick = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) {
      showInfo(`You are already subscribed to the ${plan.plan_name} plan.`)
      return
    }
    setSelectedUpgradePlan(plan)
  }

  const handleConfirmSubscription = () => {
    if (!selectedUpgradePlan) return

    // FUTURE PAYMENT GATEWAY INTEGRATION PLACEHOLDER:
    // 1. Initialize payment checkout session (e.g., Stripe / JazzCash / EasyPaisa / Checkout.com)
    // 2. Launch payment gateway modal or redirect to secure payment URL
    // 3. Only after successful payment verification callback:
    //    await setPlan(selectedUpgradePlan.id)

    // Demo Mode Notice: User subscription, storage limits, AI limits, and offline limits remain UNCHANGED.
    setShowPaymentGatewayNotice(true)
  }

  const handleCloseGatewayNotice = () => {
    setShowPaymentGatewayNotice(false)
    setSelectedUpgradePlan(null)
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
      <div className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-xs transition-all duration-300 dark:border-purple-900/40 dark:bg-slate-900">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
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
                {storageUsedGB} GB <span className="text-xs font-semibold text-slate-400">({storagePercentage}% used)</span>
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
            const numericPrice =
              billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
            const displayPrice = `PKR ${numericPrice.toLocaleString()}`
            const billingSuffix =
              plan.id === 'free'
                ? '/ forever'
                : billingCycle === 'yearly'
                ? '/ year'
                : '/ month'
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
                    ? 'border-2 border-purple-600 bg-white shadow-xl shadow-purple-500/10 ring-4 ring-purple-600/10 lg:-translate-y-2 dark:border-purple-500 dark:bg-slate-900 dark:shadow-purple-950/30'
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
                      : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {badgeText}
                </div>

                {/* Card Header */}
                <div className="space-y-6 flex-1 flex flex-col justify-between">
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
                      className={`premium-button w-full cursor-pointer rounded-2xl py-3.5 text-xs font-black transition-all shadow-md ${
                        isPro
                          ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20'
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
        <div className="text-center space-y-1">
          <h2 className="font-sans text-2xl font-black text-slate-900 dark:text-white">
            Detailed Feature Comparison
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Compare limits dynamically loaded from database records.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[640px] text-left border-collapse">
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
                <td className="p-4 font-bold text-slate-900 sm:p-5 dark:text-white">
                  AI Requests
                </td>
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
                    {p.id === 'family' ? '24/7 Dedicated' : p.id === 'pro' ? 'Priority Support' : 'Community'}
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
                    onClick={() => showInfo('Payment gateway integration is currently under development.')}
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
                      Upgrade to {selectedUpgradePlan.plan_name} Plan
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

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900 dark:border-slate-700 dark:text-white">
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

                {/* Refined Demo Version Note */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-purple-200/80 bg-purple-50/80 p-3.5 text-xs text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/30 dark:text-purple-200">
                  <Lock className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed text-left">
                    <span className="font-bold block text-purple-900 dark:text-purple-300">Demo Version</span>
                    <p className="text-slate-600 dark:text-slate-300">
                      Payment gateway integration is currently under development. Your subscription will only be upgraded after successful payment verification.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(null)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSubscription}
                    disabled={isProcessingUpgrade}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 active:scale-98 transition-all duration-200"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Continue to Payment</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 8. PAYMENT GATEWAY DEMO MODE NOTICE MODAL */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {showPaymentGatewayNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseGatewayNotice}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl border border-purple-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={handleCloseGatewayNotice}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4 py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/70 dark:text-purple-300 shadow-inner">
                  <CreditCard className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-sans text-xl font-black text-slate-900 dark:text-white">
                    Demo Version
                  </h3>
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs font-medium leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 text-left">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Payment gateway integration is currently under development.
                    </p>
                    <p>
                      Your subscription will only be upgraded after successful payment verification.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseGatewayNotice}
                    className="w-full cursor-pointer rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all duration-200 active:scale-98"
                  >
                    Understood & Close
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
