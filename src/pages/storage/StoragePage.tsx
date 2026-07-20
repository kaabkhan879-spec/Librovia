import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { subscriptionsService } from '../../services/subscriptions'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { ROUTES } from '../../constants/routes'
import { formatBytes } from '../../utils/helpers'
import { Button } from '../../components/common/Button'
import { DownloadsManagerModal } from '../../components/common/DownloadsManagerModal'
import {
  Cloud,
  Database,
  HardDrive,
  ShieldAlert,
  Sparkles,
  Crown,
  CheckCircle2,
  Download,
  Trash2,
  Info,
} from 'lucide-react'

export const StoragePage: React.FC = () => {
  const { currentPlan, subscriptionStatus, storageLimitBytes } = useSubscription()
  const { showInfo, showSuccess } = useToast()
  const navigate = useNavigate()

  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showDownloadsModal, setShowDownloadsModal] = useState(false)

  useEffect(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()])
      .then(([booksData, colsData]) => {
        setBooks(booksData)
        setCollections(colsData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load storage page details:', err)
        setLoading(false)
      })
  }, [])

  // Dynamic storage calculations from actual uploaded files and subscription quota
  const totalStorageBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.fileSize || 0), 0)
  }, [books])

  const totalStorageStr = useMemo(() => {
    return formatBytes(totalStorageBytes)
  }, [totalStorageBytes])

  const limitStr = useMemo(() => {
    return subscriptionsService.formatStorageLimit(storageLimitBytes)
  }, [storageLimitBytes])

  const storagePercent = useMemo(() => {
    if (!storageLimitBytes) return 0
    return Math.min(100, Math.round((totalStorageBytes / storageLimitBytes) * 100))
  }, [totalStorageBytes, storageLimitBytes])

  const remainingBytes = useMemo(() => {
    return Math.max(0, storageLimitBytes - totalStorageBytes)
  }, [totalStorageBytes, storageLimitBytes])

  const remainingStr = useMemo(() => {
    return formatBytes(remainingBytes)
  }, [remainingBytes])

  const handleClearCache = () => {
    try {
      const keysToKeep = [
        'librovia_theme_mode',
        'librovia-theme',
        'librovia_user_plan',
        'librovia_billing_cycle',
        'sb-ap-south-1-auth-token',
      ]
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.some((k) => key.includes(k))) {
          localStorage.removeItem(key)
        }
      })
      showSuccess('Local browser cache cleared! Your cloud library and notes remain 100% safe.')
    } catch {
      showInfo('Could not clear local cache.')
    }
  }

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
      {/* Offline Downloads Manager Modal */}
      <DownloadsManagerModal
        isOpen={showDownloadsModal}
        onClose={() => setShowDownloadsModal(false)}
      />

      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Cloud Storage
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Monitor your digital library capacity, current plan metrics, and workspace files.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-slate-100 bg-white p-6 h-28 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl shimmer-placeholder shrink-0" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded shimmer-placeholder" />
                    <div className="h-6 w-48 rounded shimmer-placeholder" />
                  </div>
                </div>
                <div className="w-full max-w-md flex-1 space-y-2.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 rounded shimmer-placeholder" />
                    <div className="h-3 w-8 rounded shimmer-placeholder" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Storage Warning Banner */}
            {storagePercent >= 85 && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 rounded-2xl border border-amber-250 bg-amber-50 p-4 text-xs font-semibold text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/15 dark:text-amber-300"
              >
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p>Warning: You are approaching your storage limit. Consider upgrading your plan to prevent upload failures.</p>
              </motion.div>
            )}

            {/* 1. COMPACT CURRENT PLAN SUMMARY CARD */}
            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-purple-200/80 bg-white p-6 shadow-xs dark:border-purple-900/40 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
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

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDownloadsModal(true)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-purple-700 active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>Manage Offline Downloads</span>
                  </button>

                  <Link to={ROUTES.SUBSCRIPTION}>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-98 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Change Plan
                    </button>
                  </Link>
                </div>
              </div>

              {/* Current Plan Summary Metrics */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Current Plan
                  </span>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {currentPlan.plan_name}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Subscription Status
                  </span>
                  <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {subscriptionStatus}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Storage Limit
                  </span>
                  <p className="mt-1 text-sm font-black text-purple-600 dark:text-purple-400">
                    {limitStr}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Books Uploaded
                  </span>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {books.length} {books.length === 1 ? 'Book' : 'Books'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Collections
                  </span>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {collections.length} {collections.length === 1 ? 'Collection' : 'Collections'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 2. DYNAMIC CLOUD STORAGE CARD */}
            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/10">
                    <Database className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Cloud Storage Capacity
                    </span>
                    <h3 className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
                      {totalStorageStr}{' '}
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        used of {limitStr}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="w-full max-w-md flex-1 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Usage limit ({currentPlan.plan_name})</span>
                    <span>{storagePercent}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Storage breakdown details widgets */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className="flex min-h-[90px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Remaining Space
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                    <HardDrive className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-left">
                  <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                    {remainingStr}
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className="flex min-h-[90px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Available Limit ({currentPlan.plan_name})
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                    <Database className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-left">
                  <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                    {limitStr}
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -3 }}
                className="flex min-h-[90px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Total Uploaded Files
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg text-purple-650 bg-purple-50 dark:bg-purple-950/20">
                    <Cloud className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-left">
                  <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                    {books.length} {books.length === 1 ? 'file' : 'files'}
                  </h3>
                </div>
              </motion.div>
            </motion.div>

            {/* List of files occupying storage */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-50 p-5 text-left dark:border-slate-800/40 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                  Library Space Allocation Breakdown
                </h3>

                {/* Cache Deletion Action Button with Clear Tooltip/Explanation */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-950/40 dark:bg-rose-950/30 dark:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Local Cache</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 hidden w-64 rounded-xl border border-slate-200 bg-slate-900 p-2.5 text-[11px] font-medium leading-normal text-slate-200 shadow-xl group-hover:block z-20 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <p>
                        Clears offline PDF cache from local browser storage. Your cloud library books and notes stay 100% safe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="border-b border-slate-50 bg-slate-50/40 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800/40 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-6 py-4.5">Book Details</th>
                      <th className="px-6 py-4.5">Author</th>
                      <th className="px-6 py-4.5 text-right">File Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {books.map((book) => (
                      <tr
                        key={book.id}
                        className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                      >
                        <td className="flex items-center gap-3 px-6 py-4">
                          <img
                            src={book.coverPath}
                            alt=""
                            className="h-9 w-7 shrink-0 rounded object-cover shadow-xs"
                          />
                          <div className="min-w-0">
                            <span className="block max-w-[200px] truncate font-bold text-slate-900 md:max-w-[400px] dark:text-white">
                              {book.title}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-slate-400">
                              Uploaded {new Date(book.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {book.author || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatBytes(book.fileSize)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Premium Upgrade Banner */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-850 to-slate-900 p-6 text-white shadow-lg text-left"
            >
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-purple-500/20 blur-2xl" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5 max-w-xl">
                  <span className="flex items-center gap-1 text-[9px] font-extrabold tracking-widest text-purple-300 uppercase">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Subscription Upgrade
                  </span>
                  <h3 className="text-lg font-black tracking-tight">Need more digital storage space?</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upgrade your plan to unlock up to 1 TB cloud storage, unlimited AI search, unlimited offline downloads, and family sharing.
                  </p>
                </div>
                <div className="shrink-0 pt-2 sm:pt-0">
                  <Button
                    onClick={() => navigate(ROUTES.SUBSCRIPTION)}
                    className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-950 shadow hover:bg-slate-100"
                  >
                    Upgrade Storage Plan
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
