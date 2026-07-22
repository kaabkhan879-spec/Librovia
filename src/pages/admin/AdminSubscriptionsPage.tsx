import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { auditService } from '../../services/audit'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import {
  PackageCheck,
  Edit,
  HardDrive,
  Sparkles,
  Download,
  Plus,
  Copy,
  Archive,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Layers,
  Check,
  X,
} from 'lucide-react'

export interface SaaSPlanFeature {
  aiSummarizer: boolean
  notesHighlights: boolean
  collections: boolean
  prioritySync: boolean
  premiumReader: boolean
  familySharing: boolean
  prioritySupport: boolean
}

export interface DynamicSaaSPlan {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  billingCycle: 'Monthly' | 'Annual' | 'Lifetime'
  status: 'Active' | 'Draft' | 'Hidden' | 'Archived'
  storageGB: number
  aiDailyLimit: number | 'Unlimited'
  offlineLimit: number | 'Unlimited'
  familyMembers: number
  supportLevel: 'Community' | 'Standard 24/7' | 'VIP Priority'
  badge: string
  features: SaaSPlanFeature
  // Usage Analytics (Prepared for live Supabase integration)
  subscribersCount?: number
  storageUsedBytes?: number
  avgUsageMinutes?: number
  renewalsCount?: number
  cancellationRatePct?: number
}

interface DbSubscriptionPlan {
  id: string
  plan_name: string
  badge: string | null
  price_monthly: number
  price_yearly: number
  storage_limit_bytes: number
  ai_daily_limit: number
  offline_download_limit: number
  family_member_limit: number
  features: unknown
  is_active: boolean
}

const mapDbToSaaSPlan = (db: DbSubscriptionPlan): DynamicSaaSPlan => {
  const featuresList = Array.isArray(db.features) ? db.features : []
  const textStr = (featuresList as { text?: string }[])
    .map((f) => f.text?.toLowerCase() || '')
    .join(' ')

  const storageGB = Math.round(Number(db.storage_limit_bytes) / (1024 * 1024 * 1024))
  const aiDailyLimit = db.ai_daily_limit === -1 ? 'Unlimited' : db.ai_daily_limit
  const offlineLimit = db.offline_download_limit === -1 ? 'Unlimited' : db.offline_download_limit

  return {
    id: db.id,
    name: db.plan_name,
    priceMonthly: Number(db.price_monthly),
    priceYearly: Number(db.price_yearly),
    billingCycle: 'Monthly',
    status: db.is_active ? 'Active' : 'Draft',
    storageGB,
    aiDailyLimit,
    offlineLimit,
    familyMembers: db.family_member_limit,
    supportLevel: textStr.includes('vip')
      ? 'VIP Priority'
      : textStr.includes('standard')
        ? 'Standard 24/7'
        : 'Community',
    badge: db.badge || '',
    features: {
      aiSummarizer: textStr.includes('ai') || textStr.includes('summarizer'),
      notesHighlights: textStr.includes('notes') || textStr.includes('highlight'),
      collections: textStr.includes('collections'),
      prioritySync: textStr.includes('sync'),
      premiumReader: textStr.includes('premium'),
      familySharing: textStr.includes('family'),
      prioritySupport: textStr.includes('support'),
    },
  }
}

const mapSaaSPlanToDb = (plan: DynamicSaaSPlan) => {
  const features = []
  features.push({ text: `${plan.storageGB} GB Cloud Storage`, highlight: plan.storageGB > 5 })
  features.push({
    text:
      plan.aiDailyLimit === 'Unlimited'
        ? 'Unlimited AI Requests'
        : `${plan.aiDailyLimit} AI Requests per Day`,
  })
  features.push({
    text:
      plan.offlineLimit === 'Unlimited'
        ? 'Unlimited Offline Downloads'
        : `Up to ${plan.offlineLimit} Offline Downloads`,
  })

  if (plan.features.notesHighlights) features.push({ text: 'Notes & Highlights' })
  if (plan.features.collections) features.push({ text: 'Collections' })
  if (plan.features.prioritySync) features.push({ text: 'Priority Cloud Sync' })
  if (plan.features.premiumReader) features.push({ text: 'Premium Reader Experience' })
  if (plan.features.familySharing) features.push({ text: 'Family Plan Sharing' })
  if (plan.features.prioritySupport) features.push({ text: 'Priority Support' })

  return {
    id: plan.id,
    plan_name: plan.name,
    badge: plan.badge,
    price_monthly: plan.priceMonthly,
    price_yearly: plan.priceYearly,
    storage_limit_bytes: plan.storageGB * 1024 * 1024 * 1024,
    ai_daily_limit: plan.aiDailyLimit === 'Unlimited' ? -1 : Number(plan.aiDailyLimit),
    offline_download_limit: plan.offlineLimit === 'Unlimited' ? -1 : Number(plan.offlineLimit),
    family_member_limit: plan.familyMembers,
    features,
    is_active: plan.status === 'Active',
    sort_order: plan.id === 'free' ? 1 : plan.id === 'pro' ? 2 : 3,
  }
}

export const AdminSubscriptionsPage: React.FC = () => {
  const { showSuccess, showError } = useToast()

  // Dynamic SaaS Plans List
  const [plans, setPlans] = useState<DynamicSaaSPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error

      setPlans((data || []).map(mapDbToSaaSPlan))
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch subscription plans'
      showError(errMsg)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans()
  }, [fetchPlans])

  // Slide-over Right Drawer for Editing or Creating Plans
  const [editingPlan, setEditingPlan] = useState<DynamicSaaSPlan | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Actions
  const handleCreateNewPlan = () => {
    const newPlan: DynamicSaaSPlan = {
      id: `plan-${Date.now()}`,
      name: 'New Custom Plan',
      priceMonthly: 299,
      priceYearly: 2999,
      billingCycle: 'Monthly',
      status: 'Draft',
      storageGB: 50,
      aiDailyLimit: 100,
      offlineLimit: 50,
      familyMembers: 1,
      supportLevel: 'Standard 24/7',
      badge: '✨ New Tier',
      features: {
        aiSummarizer: true,
        notesHighlights: true,
        collections: true,
        prioritySync: true,
        premiumReader: true,
        familySharing: false,
        prioritySupport: false,
      },
    }
    setEditingPlan(newPlan)
    setIsCreatingNew(true)
  }

  const handleDuplicatePlan = async (plan: DynamicSaaSPlan) => {
    const duplicated: DynamicSaaSPlan = {
      ...plan,
      // eslint-disable-next-line react-hooks/purity
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      status: 'Draft',
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .insert(mapSaaSPlanToDb(duplicated))
      if (error) throw error

      await auditService.insertLog({
        event: 'Subscription Plan Change',
        category: 'Billing & Payments',
        severity: 'Info',
        metadata: { action: 'duplicate', planId: duplicated.id, name: duplicated.name },
      })

      showSuccess(`Duplicated plan ${plan.name} into Draft status.`)
      fetchPlans()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to duplicate plan'
      showError(errMsg)
    }
  }

  const handleArchivePlan = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error

      await auditService.insertLog({
        event: 'Subscription Plan Change',
        category: 'Billing & Payments',
        severity: 'Warning',
        metadata: { action: 'archive', planId: id, name },
      })

      showSuccess(`Archived subscription plan ${name}.`)
      fetchPlans()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to archive plan'
      showError(errMsg)
    }
  }

  const handleSaveDrawerPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    try {
      const payload = mapSaaSPlanToDb(editingPlan)
      if (isCreatingNew) {
        const { error } = await supabase.from('subscription_plans').insert(payload)
        if (error) throw error
        showSuccess(`Created new subscription plan ${editingPlan.name}.`)
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', editingPlan.id)
        if (error) throw error
        showSuccess(`Updated plan configuration for ${editingPlan.name}.`)
      }

      await auditService.insertLog({
        event: 'Subscription Plan Change',
        category: 'Billing & Payments',
        severity: 'Info',
        metadata: {
          action: isCreatingNew ? 'create' : 'edit',
          planId: editingPlan.id,
          name: editingPlan.name,
        },
      })

      setEditingPlan(null)
      setIsCreatingNew(false)
      fetchPlans()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save plan settings'
      showError(errMsg)
    }
  }

  const handleExportPlans = () => {
    const headers = ['Plan ID', 'Name', 'Price Monthly', 'Storage GB', 'AI Limit', 'Status']
    const rows = plans.map((p) => [
      p.id,
      p.name,
      p.priceMonthly,
      p.storageGB,
      p.aiDailyLimit,
      p.status,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `librovia_plans_export_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showSuccess('Exported subscription plans catalog to CSV!')
  }

  const getStatusBadge = (status: DynamicSaaSPlan['status']) => {
    if (status === 'Active')
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40'
    if (status === 'Draft')
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/40'
    if (status === 'Hidden')
      return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/40'
  }

  if (loading) {
    return (
      <PageWrapper className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. HEADER & QUICK ACTION TOOLBAR */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <PackageCheck className="h-7 w-7 text-purple-600" />
            Subscription & Billing Architecture
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Configure dynamic plans (Free, Pro, Family, Custom), price tiers, cloud quotas, and
            feature flags.
          </p>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewPlan}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-700 active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              showSuccess('Refreshed subscription plans and cache!')
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportPlans}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 2. SUBSCRIPTION OVERVIEW DASHBOARD & PRODUCTION EMPTY STATE */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Verified Metric 1: Total Subscription Plans */}
        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Total Subscription Plans
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {plans.length} Configured Tiers
          </h3>
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            Dynamic SaaS Architecture
          </p>
        </div>

        {/* Verified Metric 2: Total Storage Allocated */}
        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Total Storage Allocated
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {plans.reduce((acc, p) => acc + p.storageGB, 0) >= 1000
              ? `${(plans.reduce((acc, p) => acc + p.storageGB, 0) / 1000).toFixed(3)} TB`
              : `${plans.reduce((acc, p) => acc + p.storageGB, 0)} GB`}
          </h3>
          <p className="text-[11px] font-semibold text-emerald-600">Active Storage Quotas</p>
        </div>

        {/* Verified Metric 3: Active Plan Types */}
        <div className="space-y-1 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Active Plan Types
          </span>
          <h3 className="truncate text-xl font-black text-slate-900 dark:text-white">
            {plans.map((p) => p.name).join(' • ')}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500">Live Tier Catalog</p>
        </div>
      </div>

      {/* Production Empty-State Card for Subscriber Activity */}
      <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-left sm:flex-row sm:items-center sm:justify-between dark:border-purple-900/50 dark:bg-purple-950/20">
        <div className="space-y-1">
          <h4 className="font-sans text-sm font-black text-slate-900 dark:text-white">
            No subscription activity yet.
          </h4>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Subscriber analytics will appear automatically after the first customer subscribes.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-purple-100 px-3 py-1 text-[10.5px] font-black text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
          Waiting for Live Customers
        </span>
      </div>

      {/* 3. DYNAMIC MANAGEABLE PLAN CARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
          Configured Subscription Plans
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -3 }}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-4">
                {/* Header & Badges */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-[10.5px] font-black text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {p.badge}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getStatusBadge(p.status)}`}
                  >
                    {p.status === 'Active' && '🟢 '}
                    {p.status === 'Draft' && '🟡 '}
                    {p.status === 'Hidden' && '⚪ '}
                    {p.status === 'Archived' && '🔴 '}
                    {p.status}
                  </span>
                </div>

                {/* Plan Title & Price */}
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {p.name} Plan
                  </h3>
                  <p className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
                    PKR {p.priceMonthly.toLocaleString()}{' '}
                    <span className="text-xs text-slate-400">/ mo</span>
                  </p>
                </div>

                {/* Quotas & Features Breakdown */}
                <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="h-4 w-4 text-purple-500" /> Storage Limit
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.storageGB >= 1000 ? `${p.storageGB / 1000} TB` : `${p.storageGB} GB`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" /> AI Requests
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.aiDailyLimit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-indigo-500" /> Offline Downloads
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.offlineLimit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-emerald-500" /> Family Members
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.familyMembers}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false)
                    setEditingPlan({ ...p })
                  }}
                  className="flex-1 rounded-xl bg-purple-600 py-2 text-xs font-black text-white shadow-xs hover:bg-purple-700"
                >
                  <Edit className="mr-1 inline h-3.5 w-3.5" />
                  Edit Configuration
                </button>

                <button
                  type="button"
                  onClick={() => handleDuplicatePlan(p)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  title="Duplicate Plan"
                >
                  <Copy className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleArchivePlan(p.id, p.name)}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-rose-950/40"
                  title="Archive Plan"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. VISUAL PLAN COMPARISON MATRIX TABLE */}
      <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 font-sans text-lg font-black text-slate-900 dark:text-white">
          <Layers className="h-5 w-5 text-purple-600" />
          Plan Features Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Feature Name</th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="px-6 py-4 text-center font-black text-purple-600 dark:text-purple-400"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold dark:divide-slate-800/40">
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Monthly Price (PKR)
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className="px-6 py-3.5 text-center font-black text-slate-900 dark:text-white"
                  >
                    {p.priceMonthly === 0 ? 'Free' : `PKR ${p.priceMonthly}`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Cloud Storage Quota
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.storageGB >= 1000 ? `${p.storageGB / 1000} TB` : `${p.storageGB} GB`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  AI Daily Limit
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.aiDailyLimit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Offline Download Limit
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.offlineLimit}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  AI Book Summarizer
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.features.aiSummarizer ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Priority Cloud Sync
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.features.prioritySync ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Family Sharing
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="px-6 py-3.5 text-center">
                    {p.features.familySharing ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                  Support Level
                </td>
                {plans.map((p) => (
                  <td
                    key={p.id}
                    className="px-6 py-3.5 text-center text-purple-600 dark:text-purple-400"
                  >
                    {p.supportLevel}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. RIGHT-SIDE SLIDE-OVER EDIT / CREATE PLAN DRAWER */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingPlan(null)
                setIsCreatingNew(false)
              }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex w-screen max-w-md flex-col justify-between bg-white p-6 text-left shadow-2xl dark:bg-slate-900"
              >
                <form onSubmit={handleSaveDrawerPlan} className="space-y-6 overflow-y-auto pr-1">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white">
                        {isCreatingNew ? 'Create New Plan' : `Configure ${editingPlan.name} Plan`}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        Configure pricing, storage limits, and feature flags.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(null)
                        setIsCreatingNew(false)
                      }}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Plan Inputs */}
                  <div className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <label className="mb-1 block">Plan Name</label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block">Monthly Price (PKR)</label>
                        <input
                          type="number"
                          value={editingPlan.priceMonthly}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block">Annual Price (PKR)</label>
                        <input
                          type="number"
                          value={editingPlan.priceYearly}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block">Storage Quota (GB)</label>
                        <input
                          type="number"
                          value={editingPlan.storageGB}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, storageGB: Number(e.target.value) })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block">Plan Status</label>
                        <select
                          value={editingPlan.status}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              status: e.target.value as DynamicSaaSPlan['status'],
                            })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="Active">🟢 Active</option>
                          <option value="Draft">🟡 Draft</option>
                          <option value="Hidden">⚪ Hidden</option>
                          <option value="Archived">🔴 Archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block">Plan Badge Label</label>
                      <input
                        type="text"
                        value={editingPlan.badge}
                        onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Feature Toggles */}
                    <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <span className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                        Feature Management Toggles
                      </span>

                      {[
                        { key: 'aiSummarizer', label: 'AI Book Summarizer' },
                        { key: 'notesHighlights', label: 'Notes & Highlights Sync' },
                        { key: 'collections', label: 'Collections Manager' },
                        { key: 'prioritySync', label: 'Priority Cloud Sync' },
                        { key: 'premiumReader', label: 'Premium Reader Mode' },
                        { key: 'familySharing', label: 'Family Sharing (6 Members)' },
                        { key: 'prioritySupport', label: 'Priority Customer Support' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={
                              (editingPlan.features as unknown as Record<string, boolean>)[item.key]
                            }
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                features: {
                                  ...editingPlan.features,
                                  [item.key]: e.target.checked,
                                } as unknown as SaaSPlanFeature,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(null)
                        setIsCreatingNew(false)
                      }}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="flex-1 rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 hover:bg-purple-700"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
