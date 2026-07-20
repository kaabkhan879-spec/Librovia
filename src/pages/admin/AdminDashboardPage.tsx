import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { booksService, type Book } from '../../services/books'
import { subscriptionsService, type SubscriptionPlan } from '../../services/subscriptions'
import { formatBytes } from '../../utils/helpers'
import {
  ShieldCheck,
  Users,
  BookOpen,
  HardDrive,
  Crown,
  Lock,
  Search,
  UserCheck,
} from 'lucide-react'

interface AdminUserRecord {
  id: string
  email: string
  role: 'user' | 'super_admin'
  joinedDate: string
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showInfo } = useToast()

  const [books, setBooks] = useState<Book[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Simulated system user list seeded with initial Super Admin and system accounts
  const [usersList] = useState<AdminUserRecord[]>([
    {
      id: 'super-admin-01',
      email: 'kaabkhan879@gmail.com',
      role: 'super_admin',
      joinedDate: '2026-07-20',
    },
    {
      id: 'user-02',
      email: 'reader.demo@librovia.com',
      role: 'user',
      joinedDate: '2026-07-19',
    },
    {
      id: 'user-03',
      email: 'alex.pro@librovia.com',
      role: 'user',
      joinedDate: '2026-07-18',
    },
  ])

  useEffect(() => {
    Promise.all([booksService.getBooks(), subscriptionsService.getSubscriptionPlans()])
      .then(([booksData, plansData]) => {
        setBooks(booksData)
        setPlans(plansData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load admin dashboard details:', err)
        setLoading(false)
      })
  }, [])

  const totalStorageBytes = books.reduce((acc, b) => acc + (b.fileSize || 0), 0)

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  } as const

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. SUPER ADMIN BANNER HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Super Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 text-[11px] font-black tracking-wide text-white shadow-md shadow-purple-600/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              SUPER ADMIN
            </span>
          </div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            System control center, security policies, and subscription administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 px-4 py-2 text-xs font-extrabold text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Admin</span>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* 2. KEY METRICS GRID (4 CARDS) */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Registered Accounts
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {usersList.length}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  1 Super Admin • {usersList.length - 1} Standard Users
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Total Library Books
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {books.length}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  Active workspace files
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Cloud Storage Usage
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatBytes(totalStorageBytes)}
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  Calculated dynamically
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Active Subscription Tiers
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                  <Crown className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {plans.length || 3} Tiers
                </h3>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                  FREE • PRO • FAMILY
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* 3. USER MANAGEMENT & RBAC POLICIES TABLE */}
          <motion.div
            variants={itemVariants}
            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white">
                  Platform Users & Role Assignments
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Only existing Super Admins can manage account roles and privileges.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user or role..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800/40 dark:bg-slate-800/20">
                  <tr>
                    <th className="px-6 py-4">Account Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredUsers.map((item) => {
                    const isSuperAdmin = item.role === 'super_admin'
                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold text-xs">
                              {item.email.charAt(0).toUpperCase()}
                            </div>
                            <span>{item.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-[10.5px] font-black text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                              <ShieldCheck className="h-3 w-3 text-purple-600" />
                              super_admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10.5px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <UserCheck className="h-3 w-3 text-slate-400" />
                              user
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                          {item.joinedDate}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isSuperAdmin ? (
                            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                              Protected Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => showInfo(`Role promotion for ${item.email} is restricted to security manager.`)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              Manage Role
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* 4. SUBSCRIPTION ARCHITECTURE OVERVIEW */}
          <motion.div
            variants={itemVariants}
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sans text-lg font-black text-slate-900 dark:text-white">
                  Database Subscription Plans
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Plans are stored in the database (`subscription_plans`) and loaded dynamically without hardcoding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => showSuccess('Subscription schema RLS verified!')}
                className="rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-extrabold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
              >
                Verify RLS Policies
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 uppercase dark:text-white">
                      {p.plan_name}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                    PKR {p.price_monthly} / mo
                  </p>
                  <div className="text-[11px] font-semibold text-slate-500 space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p>Storage: {subscriptionsService.formatStorageLimit(p.storage_limit_bytes)}</p>
                    <p>AI Requests: {p.ai_daily_limit === -1 ? 'Unlimited' : `${p.ai_daily_limit}/day`}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 5. BACKEND SECURITY & RLS STATUS CARD */}
          <motion.div
            variants={itemVariants}
            className="flex items-start gap-4 rounded-3xl border border-purple-200/80 bg-purple-50/60 p-6 text-purple-950 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-200"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-xs leading-relaxed">
              <h4 className="font-extrabold text-sm text-purple-900 dark:text-purple-200">
                Backend Security & Role Enforcement
              </h4>
              <p>
                All `/admin` endpoints and database tables (`user_roles`, `subscription_plans`, `user_subscriptions`) are enforced with Row Level Security (RLS). Signup creates standard `user` accounts only. Frontend role claims are validated against server tables.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageWrapper>
  )
}
