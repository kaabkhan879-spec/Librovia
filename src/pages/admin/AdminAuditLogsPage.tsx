import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { ClipboardList } from 'lucide-react'

export const AdminAuditLogsPage: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Role Changes' | 'Storage Changes' | 'Subscription Changes' | 'User Deletions' | 'Admin Actions' | 'Login History'>('All')

  const auditLogs = [
    { id: 'lg-01', category: 'Role Changes', action: 'Super Admin role assigned to kaabkhan879@gmail.com', actor: 'System Migration', timestamp: '2026-07-20 02:21:00' },
    { id: 'lg-02', category: 'Subscription Changes', action: 'User sarah.j@example.com upgraded to Pro Plan', actor: 'Payment Gateway', timestamp: '2026-07-20 01:15:30' },
    { id: 'lg-03', category: 'Storage Changes', action: 'Storage quota for m.chen@example.com increased to 300GB', actor: 'kaabkhan879@gmail.com', timestamp: '2026-07-19 22:40:12' },
    { id: 'lg-04', category: 'Login History', action: 'Successful Super Admin login via Supabase Auth', actor: 'kaabkhan879@gmail.com', timestamp: '2026-07-19 18:05:00' },
  ]

  const filtered = auditLogs.filter((l) => filterCategory === 'All' || l.category === filterCategory)

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <ClipboardList className="h-7 w-7 text-purple-600" />
            System Audit Logs & Security History
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Immutable log history tracking role modifications, storage adjustments, subscription updates, and admin actions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        {(['All', 'Role Changes', 'Storage Changes', 'Subscription Changes', 'User Deletions', 'Admin Actions', 'Login History'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
              filterCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Log ID</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Action Detail</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{log.id}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{log.action}</td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{log.actor}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
