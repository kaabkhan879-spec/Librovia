import React from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { LineChart } from 'lucide-react'

export const AdminReportsPage: React.FC = () => {
  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <LineChart className="h-7 w-7 text-purple-600" />
            Platform Analytics & Reports
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Track user growth trends, daily active readers, storage volume expansion, AI usage, and revenue metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase">Daily Active Users (DAU)</span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">842 DAU</h3>
          <p className="text-xs font-semibold text-emerald-600 mt-1">+12.4% vs last week</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase">Monthly AI Requests</span>
          <h3 className="text-3xl font-black text-purple-600 mt-2">34,120 Queries</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">Unlimited Pro & Family volume</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-400 uppercase">Storage Growth Rate</span>
          <h3 className="text-3xl font-black text-indigo-600 mt-2">+4.2 GB / day</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">Cloud library uploads expansion</p>
        </div>
      </div>
    </PageWrapper>
  )
}
