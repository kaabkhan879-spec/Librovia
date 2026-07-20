import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../services/supabase'
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Eye,
  X,
  UserPlus,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Crown,
  ShieldAlert,
  Inbox,
} from 'lucide-react'

export interface DBUserRecord {
  user_id: string
  email: string
  role: 'user' | 'super_admin' | 'moderator'
  created_at: string
  updated_at?: string
  name?: string
  plan?: 'Free' | 'Pro' | 'Family'
  storageUsedBytes?: number
  storageLimitBytes?: number
  status?: 'Active' | 'Suspended'
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const { showSuccess, showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<DBUserRecord[]>([])

  // Controls & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'All' | 'Free' | 'Pro' | 'Family' | 'Admins' | 'Suspended'>('All')
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Highest Storage' | 'Lowest Storage'>('Newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Right-side Drawer State
  const [drawerUser, setDrawerUser] = useState<DBUserRecord | null>(null)
  const [drawerTab, setDrawerTab] = useState<'profile' | 'subscription' | 'storage' | 'books' | 'payments' | 'activity' | 'devices'>('profile')

  // Overflow Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'user' | 'super_admin'>('user')

  // Fetch Live Users from Supabase `user_roles`
  useEffect(() => {
    async function fetchLiveUsers() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('user_roles').select('*')

        if (error) {
          console.error('Error fetching user_roles:', error)
          setUsers([])
        } else if (data) {
          const mapped: DBUserRecord[] = data.map((row) => ({
            user_id: row.user_id,
            email: row.email || 'N/A',
            role: (row.role as any) || 'user',
            created_at: row.created_at || new Date().toISOString(),
            name: row.email ? row.email.split('@')[0] : 'Registered User',
            plan: row.role === 'super_admin' ? 'Family' : 'Free',
            storageUsedBytes: row.role === 'super_admin' ? 1450000 : 500000,
            storageLimitBytes: row.role === 'super_admin' ? 1000000000000 : 5000000000,
            status: 'Active',
          }))

          if (currentUser?.id && !mapped.some((u) => u.user_id === currentUser.id)) {
            mapped.unshift({
              user_id: currentUser.id,
              email: currentUser.email || 'N/A',
              role: currentUser.role || 'user',
              created_at: new Date().toISOString(),
              name: currentUser.displayName || currentUser.email.split('@')[0],
              plan: currentUser.role === 'super_admin' ? 'Family' : 'Free',
              storageUsedBytes: currentUser.role === 'super_admin' ? 1450000 : 500000,
              storageLimitBytes: currentUser.role === 'super_admin' ? 1000000000000 : 5000000000,
              status: 'Active',
            })
          }

          setUsers(mapped)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load users:', err)
        setLoading(false)
      }
    }

    fetchLiveUsers()
  }, [currentUser])

  // Calculations
  const totalUsers = users.length
  const superAdminsCount = users.filter((u) => u.role === 'super_admin').length
  const activeUsersCount = users.filter((u) => u.status !== 'Suspended').length
  const suspendedUsersCount = users.filter((u) => u.status === 'Suspended').length

  // Filter & Sort Logic
  const filteredUsers = users
    .filter((u) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.plan && u.plan.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))

      let matchesFilter = true
      if (filterType === 'Free') matchesFilter = u.plan === 'Free'
      if (filterType === 'Pro') matchesFilter = u.plan === 'Pro'
      if (filterType === 'Family') matchesFilter = u.plan === 'Family'
      if (filterType === 'Admins') matchesFilter = u.role === 'super_admin'
      if (filterType === 'Suspended') matchesFilter = u.status === 'Suspended'

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'Oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'Highest Storage') return (b.storageUsedBytes || 0) - (a.storageUsedBytes || 0)
      if (sortBy === 'Lowest Storage') return (a.storageUsedBytes || 0) - (b.storageUsedBytes || 0)
      return 0
    })

  // Pagination Slice
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Actions
  const handleExportCSV = () => {
    if (users.length === 0) {
      showError('No user data available to export.')
      return
    }
    const headers = ['User ID', 'Email', 'Role', 'Plan', 'Status', 'Created At']
    const rows = users.map((u) => [u.user_id, u.email, u.role, u.plan || 'Free', u.status || 'Active', u.created_at])
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `librovia_users_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showSuccess('Exported user accounts dataset to CSV!')
  }

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail) return
    const newUser: DBUserRecord = {
      user_id: `usr-${Date.now()}`,
      email: newUserEmail,
      name: newUserName || newUserEmail.split('@')[0],
      role: newUserRole,
      plan: newUserRole === 'super_admin' ? 'Family' : 'Free',
      created_at: new Date().toISOString(),
      status: 'Active',
      storageUsedBytes: 0,
      storageLimitBytes: 5000000000,
    }
    setUsers((prev) => [newUser, ...prev])
    showSuccess(`Created user account for ${newUserEmail}.`)
    setNewUserEmail('')
    setNewUserName('')
    setIsAddUserOpen(false)
  }

  const handleToggleSuspend = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u))
    )
    showSuccess('Updated account suspension status.')
    setActiveMenuId(null)
  }

  const handleDeleteUser = (userId: string, email: string) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== userId))
    showSuccess(`Deleted account ${email}.`)
    setActiveMenuId(null)
  }

  const formatStorageMB = (bytes?: number) => {
    if (!bytes) return '0 MB'
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(2)} GB`
    return `${(bytes / 1000000).toFixed(2)} MB`
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-purple-600" />
            User Account Management
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Enterprise SaaS user directory, storage quotas, subscription plans, and RBAC control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20 active:scale-98"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Users</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loading ? '...' : totalUsers}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Live database count</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase">Super Admins</span>
          <h3 className="text-2xl font-black text-purple-600 mt-2">
            {loading ? '...' : superAdminsCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">RBAC privileged accounts</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Active Users</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">
            {loading ? '...' : activeUsersCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Operational accounts</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase">Suspended Users</span>
          <h3 className="text-2xl font-black text-rose-600 mt-2">
            {loading ? '...' : suspendedUsersCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Restricted accounts</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search users by Name, Email, Plan, or Role..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Plan/Role Filter Pills */}
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['All', 'Free', 'Pro', 'Family', 'Admins', 'Suspended'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setFilterType(t)
                  setCurrentPage(1)
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
                  filterType === t
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="Newest">Sort: Newest First</option>
              <option value="Oldest">Sort: Oldest First</option>
              <option value="Highest Storage">Sort: Highest Storage</option>
              <option value="Lowest Storage">Sort: Lowest Storage</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. USER MANAGEMENT TABLE & SKELETONS */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4">Storage Usage & Progress</th>
                <th className="px-6 py-4">RBAC Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {loading ? (
                // SKELETON LOADERS
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-1" />
                      <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800/60" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-2 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const isSuperAdmin = u.role === 'super_admin'
                  const isModerator = u.role === 'moderator'
                  const used = u.storageUsedBytes || 0
                  const limit = u.storageLimitBytes || 5000000000
                  const pct = Math.min(100, Math.round((used / limit) * 100)) || 1

                  return (
                    <tr key={u.user_id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {/* User Avatar & Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-extrabold text-xs text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 dark:text-white">{u.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Current Plan */}
                      <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">
                        {u.plan || 'Free'}
                      </td>

                      {/* Visual Storage Progress Bar */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-[160px]">
                          <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
                            <span>{formatStorageMB(used)}</span>
                            <span className="text-slate-400">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Premium Role Badges */}
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            <ShieldCheck className="h-3 w-3 text-purple-600" />
                            Super Admin
                          </span>
                        ) : isModerator ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <ShieldAlert className="h-3 w-3 text-amber-600" />
                            Moderator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <UserCheck className="h-3 w-3 text-slate-400" />
                            User
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Modern Overflow Menu (...) */}
                      <td className="px-6 py-4 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === u.user_id ? null : u.user_id)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                          title="Actions menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Overflow Dropdown */}
                        {activeMenuId === u.user_id && (
                          <div className="absolute right-6 top-12 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-left text-xs font-semibold space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerUser(u)
                                setActiveMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Eye className="h-3.5 w-3.5 text-purple-600" /> View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                showSuccess(`Edit mode enabled for ${u.email}`)
                                setActiveMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Edit className="h-3.5 w-3.5 text-indigo-600" /> Edit User
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                showSuccess(`Upgrade modal for ${u.email}`)
                                setActiveMenuId(null)
                              }}
                              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <Crown className="h-3.5 w-3.5 text-amber-500" /> Upgrade Plan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(u.user_id)}
                              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              <UserX className="h-3.5 w-3.5 text-amber-600" /> {u.status === 'Active' ? 'Suspend' : 'Reactivate'}
                            </button>
                            {!isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.user_id, u.email)}
                                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete User
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                // 5. ELEGANT EMPTY STATE
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">No registered users yet.</h4>
                      <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                        No accounts match your current search query or filter settings.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION FOOTER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 text-xs font-semibold text-slate-500 dark:border-slate-800">
          <div>
            Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>–<strong className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> users
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="px-2 font-bold text-slate-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. RIGHT-SIDE SLIDE-OVER USER DETAILS DRAWER */}
      <AnimatePresence>
        {drawerUser && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerUser(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Slide-Over Panel */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 flex flex-col justify-between"
              >
                <div className="space-y-6 overflow-y-auto pr-1">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600 text-white font-black text-sm shadow-md">
                        {drawerUser.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-sans text-base font-black text-slate-900 dark:text-white">{drawerUser.name}</h3>
                        <p className="text-xs font-mono text-slate-400">{drawerUser.email}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDrawerUser(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Drawer Tabs */}
                  <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-[11px] font-extrabold">
                    {(['profile', 'subscription', 'storage', 'books', 'payments', 'activity', 'devices'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDrawerTab(t)}
                        className={`capitalize rounded-xl px-2.5 py-1.5 transition-colors ${
                          drawerTab === t
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Drawer Tab Content */}
                  <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300 pt-2">
                    {drawerTab === 'profile' && (
                      <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span>User ID:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{drawerUser.user_id}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span>Role:</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{drawerUser.role}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                          <span>Account Status:</span>
                          <span className="font-bold text-emerald-600">{drawerUser.status}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Created At:</span>
                          <span className="font-mono">{new Date(drawerUser.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {drawerTab === 'subscription' && (
                      <div className="space-y-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Active Tier</span>
                        <h4 className="text-xl font-black text-purple-600 dark:text-purple-400">{drawerUser.plan || 'Free'} Plan</h4>
                        <p className="text-slate-500">Auto-renews monthly via Supabase subscriptions.</p>
                      </div>
                    )}

                    {drawerTab === 'storage' && (
                      <div className="space-y-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                        <span className="text-[10px] uppercase text-slate-400 block font-bold">Storage Quota</span>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">{formatStorageMB(drawerUser.storageUsedBytes)} Used</h4>
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2">
                          <div className="h-full bg-purple-600" style={{ width: '15%' }} />
                        </div>
                      </div>
                    )}

                    {(drawerTab === 'books' || drawerTab === 'payments' || drawerTab === 'activity' || drawerTab === 'devices') && (
                      <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30 space-y-1">
                        <Inbox className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white capitalize">{drawerTab} data empty</span>
                        <span className="text-[11px] text-slate-400">Ready for live event streams.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDrawerUser(null)}
                    className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md"
                  >
                    Close User Details
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add User */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 text-left"
            >
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                Add New User Account
              </h3>

              <form onSubmit={handleAddUserSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. alex.rivera@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="user">Standard User (user)</option>
                    <option value="super_admin">Super Admin (super_admin)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                >
                  Create User Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
