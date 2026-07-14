import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { BarChart3, Info, BookOpen, Award, Calendar, Clock, Flame } from 'lucide-react'

export const AnalyticsPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isEmptyState, setIsEmptyState] = useState(false)

  useEffect(() => {
    booksService.getBooks().then((booksData) => {
      setBooks(booksData)
      setLoading(false)
    })
  }, [])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // calculations
  const completedBooks = useMemo(() => {
    return books.filter((b) => b.progress === 100).length
  }, [books])

  const inProgressBooksCount = useMemo(() => {
    return books.filter((b) => b.progress > 0 && b.progress < 100).length
  }, [books])

  const totalPagesRead = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.progress > 0 ? b.currentPage : 0), 0)
  }, [books])

  const totalReadingSeconds = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.readingTime || 0), 0)
  }, [books])

  const readingTimeStr = useMemo(() => {
    if (totalReadingSeconds > 0) {
      const mins = Math.floor(totalReadingSeconds / 60)
      if (mins >= 60) {
        const hrs = Math.round((totalReadingSeconds / 3600) * 10) / 10
        return `${hrs} hrs`
      }
      return `${mins || 1} mins`
    }
    const minutes = totalPagesRead * 2 // 2 mins per page
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10
      return `${hours} hrs`
    }
    return `${minutes} mins`
  }, [totalReadingSeconds, totalPagesRead])

  const analyticsStats = [
    {
      label: 'Completed Books',
      value: completedBooks,
      icon: Award,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Books In Progress',
      value: inProgressBooksCount,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Pages Logged',
      value: totalPagesRead,
      icon: Calendar,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
    },
    {
      label: 'Time Spent Reading',
      value: readingTimeStr,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="h-4.5 w-4.5 shrink-0 text-purple-600" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts below.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateLoader}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Simulate Loading Skeletons
          </button>
          <button
            onClick={() => setIsEmptyState(!isEmptyState)}
            className={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${isEmptyState ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'} `}
          >
            {isEmptyState ? 'Show Real Analytics' : 'Show Empty States'}
          </button>
        </div>
      </div>

      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Reading Analytics
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Detailed metrics tracking your reading streaks and progress.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isSkeletonLoading || loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </motion.div>
        ) : isEmptyState || books.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Reading Analytics
              </h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Add books to your library and read them to generate useful progress stats.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Stats list grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {analyticsStats.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {item.label}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.color}`}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-3 text-left">
                    <h3 className="text-2xl leading-none font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {item.value}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Streak card */}
            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                Active Reading Streak
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/20">
                  <Flame className="h-8 w-8 fill-current" />
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    2 Days Streak
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    You read 125 pages this week! Keep the momentum going to build a solid reading
                    habit.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
