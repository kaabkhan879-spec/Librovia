import React, { useState } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { HardDrive, Search } from 'lucide-react'

interface UserStorageRecord {
  id: string
  name: string
  email: string
  usedStr: string
  limitStr: string
  limitGB: number
}

export const AdminStoragePage: React.FC = () => {
  const { showSuccess } = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const [userStorages, setUserStorages] = useState<UserStorageRecord[]>([
    { id: 'st-01', name: 'Kaab Khan', email: 'kaabkhan879@gmail.com', usedStr: '1.38 MB', limitStr: '1 TB', limitGB: 1000 },
    { id: 'st-02', name: 'Sarah Jenkins', email: 'sarah.j@example.com', usedStr: '42.5 GB', limitStr: '300 GB', limitGB: 300 },
    { id: 'st-03', name: 'Michael Chen', email: 'm.chen@example.com', usedStr: '3.1 GB', limitStr: '5 GB', limitGB: 5 },
    { id: 'st-04', name: 'Elena Rostova', email: 'elena.rostova@example.com', usedStr: '118.2 GB', limitStr: '300 GB', limitGB: 300 },
  ])

  const filtered = userStorages.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpdateStorage = (user: UserStorageRecord, newGB: number) => {
    const newLimitStr = newGB >= 1000 ? `${newGB / 1000} TB` : `${newGB} GB`
    setUserStorages((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, limitGB: newGB, limitStr: newLimitStr } : u))
    )
    showSuccess(`Storage quota for ${user.email} updated to ${newLimitStr}.`)
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <HardDrive className="h-7 w-7 text-purple-600" />
            Storage Manager & Quota Controls
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Search users, adjust custom storage limits (5GB, 300GB, 1TB, 2TB, Unlimited), and monitor disk allocation.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search user by name or email..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Storage Allocation Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Storage Used</th>
                <th className="px-6 py-4">Current Limit</th>
                <th className="px-6 py-4">Quick Adjust Quota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <span className="block font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{u.usedStr}</td>
                  <td className="px-6 py-4 font-black text-purple-600 dark:text-purple-400">{u.limitStr}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[5, 300, 1000, 2000].map((gb) => (
                        <button
                          key={gb}
                          type="button"
                          onClick={() => handleUpdateStorage(u, gb)}
                          className={`rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold transition-colors ${
                            u.limitGB === gb
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
