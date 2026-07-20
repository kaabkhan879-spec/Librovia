import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { CreditCard } from 'lucide-react'

export const AdminPaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'pending' | 'failed' | 'refunds'>('recent')

  const paymentsList = [
    { id: 'tx-101', user: 'sarah.j@example.com', plan: 'Pro Plan (Monthly)', amount: 'PKR 500', status: 'Completed', date: '2026-07-20' },
    { id: 'tx-102', user: 'kaabkhan879@gmail.com', plan: 'Family Plan (Annual)', amount: 'PKR 8,999', status: 'Completed', date: '2026-07-19' },
    { id: 'tx-103', user: 'm.chen@example.com', plan: 'Pro Plan (Monthly)', amount: 'PKR 500', status: 'Pending', date: '2026-07-19' },
    { id: 'tx-104', user: 'alex.test@example.com', plan: 'Pro Plan (Annual)', amount: 'PKR 4,999', status: 'Failed', date: '2026-07-18' },
  ]

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <CreditCard className="h-7 w-7 text-purple-600" />
            Payment & Revenue Manager
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Monitor revenue streams, transaction statuses, failed payments, and refund requests.
          </p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Monthly Revenue</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">PKR 245,500</h3>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Successful Payments</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">412 Transactions</h3>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase">Pending Payments</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">3 Pending</h3>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase">Failed / Refunds</span>
          <h3 className="text-2xl font-black text-rose-600 mt-2">1 Failed</h3>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex gap-2">
          {(['recent', 'pending', 'failed', 'refunds'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold capitalize transition-colors ${
                activeTab === t
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {t} Payments
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Customer Email</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {paymentsList.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{tx.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{tx.user}</td>
                  <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">{tx.plan}</td>
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-white">{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : tx.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
