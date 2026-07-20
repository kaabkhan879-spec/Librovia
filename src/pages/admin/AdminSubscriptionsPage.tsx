import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { PackageCheck, Edit, HardDrive, Sparkles, Download } from 'lucide-react'

interface EditablePlan {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  storageGB: number
  aiDailyLimit: number | 'Unlimited'
  offlineLimit: number | 'Unlimited'
  badge: string
}

export const AdminSubscriptionsPage: React.FC = () => {
  const { showSuccess } = useToast()

  const [plans, setPlans] = useState<EditablePlan[]>([
    {
      id: 'free',
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      storageGB: 5,
      aiDailyLimit: 20,
      offlineLimit: 10,
      badge: 'Free Forever',
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: 500,
      priceYearly: 4999,
      storageGB: 300,
      aiDailyLimit: 'Unlimited',
      offlineLimit: 'Unlimited',
      badge: '⭐ Most Popular',
    },
    {
      id: 'family',
      name: 'Family',
      priceMonthly: 899,
      priceYearly: 8999,
      storageGB: 1000,
      aiDailyLimit: 'Unlimited',
      offlineLimit: 'Unlimited',
      badge: '👨‍👩‍👧 Best Value',
    },
  ])

  const [editingPlan, setEditingPlan] = useState<EditablePlan | null>(null)

  const handleSavePlan = () => {
    if (!editingPlan) return
    setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? editingPlan : p)))
    showSuccess(`Subscription plan ${editingPlan.name} updated.`)
    setEditingPlan(null)
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <PackageCheck className="h-7 w-7 text-purple-600" />
            Subscription Plans Manager
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Configure pricing, cloud storage quotas, AI limits, and features for Free, Pro, and Family tiers.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-[10.5px] font-black text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {p.badge}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPlan({ ...p })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Edit className="h-3.5 w-3.5 inline mr-1" />
                  Edit Plan
                </button>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{p.name} Plan</h3>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  PKR {p.priceMonthly.toLocaleString()} <span className="text-xs text-slate-400">/ mo</span>
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><HardDrive className="h-4 w-4 text-purple-500" /> Cloud Storage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.storageGB >= 1000 ? `${p.storageGB / 1000} TB` : `${p.storageGB} GB`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-500" /> AI Limit</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.aiDailyLimit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Download className="h-4 w-4 text-indigo-500" /> Offline Downloads</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.offlineLimit}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setEditingPlan(null)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Configure {editingPlan.name} Plan</h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Monthly Price (PKR)</label>
                <input
                  type="number"
                  value={editingPlan.priceMonthly}
                  onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-1">Storage Limit (GB)</label>
                <input
                  type="number"
                  value={editingPlan.storageGB}
                  onChange={(e) => setEditingPlan({ ...editingPlan, storageGB: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-black text-white hover:bg-purple-700 shadow-md"
              >
                Save Plan Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
