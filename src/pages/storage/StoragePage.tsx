import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { Cloud, Database, HardDrive, ShieldAlert, Sparkles } from 'lucide-react'
import { formatBytes } from '../../utils/helpers'
import { Button } from '../../components/common/Button'

export const StoragePage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [])

  // Calculate storage usage
  const totalStorageBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + b.fileSize, 0)
  }, [books])

  const totalStorageStr = useMemo(() => {
    return formatBytes(totalStorageBytes)
  }, [totalStorageBytes])

  const limitBytes = 1000000000 // 1 GB allocation
  const limitStr = formatBytes(limitBytes)

  const storagePercent = useMemo(() => {
    return Math.min(100, Math.round((totalStorageBytes / limitBytes) * 100))
  }, [totalStorageBytes])

  // Remaining space calculation
  const remainingBytes = useMemo(() => {
    return Math.max(0, limitBytes - totalStorageBytes)
  }, [totalStorageBytes])

  const remainingStr = useMemo(() => {
    return formatBytes(remainingBytes)
  }, [remainingBytes])

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

  const handleUpgradeAlert = () => {
    alert('Librovia Premium checkout flow is currently disabled during testing. High capacity tiers will be unlocked in Phase 5!')
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Cloud Storage
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Monitor your digital library workspace files capacity and limits.
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
            <div className="h-44 animate-pulse rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
          </motion.div>
        ) : books.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20">
              <Cloud className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Storage Used</h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                You haven't uploaded any books yet. Once you upload PDF documents, they will occupy
                your cloud space here.
              </p>
            </div>
            <Link to={ROUTES.LIBRARY} className="inline-block">
              <Button>Browse Library</Button>
            </Link>
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

            {/* Usage Summary Card */}
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
                      Capacity Meter
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
                    <span>Usage limit</span>
                    <span>{storagePercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-purple-600 transition-all duration-500"
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
                    Storage Allocation Limit
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
              <div className="border-b border-slate-50 p-5 text-left dark:border-slate-800/40">
                <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                  Library Space Allocation Breakdown
                </h3>
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

            {/* Premium Upgrade Card */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-850 to-slate-900 p-6 text-white shadow-lg text-left"
            >
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-purple-500/20 blur-2xl" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5 max-w-xl">
                  <span className="flex items-center gap-1 text-[9px] font-extrabold tracking-widest text-purple-300 uppercase">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Premium Tier
                  </span>
                  <h3 className="text-lg font-black tracking-tight">Need more digital shelving space?</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upgrade to **Librovia Premium** for 50 GB cloud storage, unlimited file sizes, custom tagging categories, and advanced priority annotations sync.
                  </p>
                </div>
                <div className="shrink-0 pt-2 sm:pt-0">
                  <Button
                    onClick={handleUpgradeAlert}
                    className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-950 shadow hover:bg-slate-100"
                  >
                    Upgrade Storage
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
