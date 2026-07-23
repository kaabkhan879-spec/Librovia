import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notesService, type Note } from '../../services/notes'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../context/SubscriptionContext'
import {
  BookOpen,
  Play,
  FolderOpen,
  Users,
  ChevronRight,
  BarChart3,
  Calendar,
  FileText,
  HardDrive,
  Award,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { PageWrapper } from '../../components/common/PageWrapper'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { currentPlan, subscriptionStatus, renewalDate, storageUsedBytes, storageLimitBytes } =
    useSubscription()
  const navigate = useNavigate()

  const [books, setBooks] = useState<Book[]>([])
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    Promise.all([
      booksService.getBooks(),
      collectionsService.getCollections(),
      notesService.getAllNotes(),
    ])
      .then(([booksData, colsData, notesData]) => {
        setBooks(booksData)
        setCollectionsList(colsData)
        setAllNotes(notesData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- DYNAMIC TIME-OF-DAY GREETING ---
  const { greetingText, greetingIcon } = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return { greetingText: 'Good morning', greetingIcon: '🌅' }
    } else if (hour >= 12 && hour < 17) {
      return { greetingText: 'Good afternoon', greetingIcon: '☀️' }
    } else if (hour >= 17 && hour < 22) {
      return { greetingText: 'Good evening', greetingIcon: '🌇' }
    } else {
      return { greetingText: 'Good night', greetingIcon: '🌙' }
    }
  }, [])

  const getBookTitle = useCallback(
    (bookId: string) => {
      const found = books.find((b) => b.id === bookId)
      return found ? found.title : 'Untitled Book'
    },
    [books]
  )

  const getCollectionName = useCallback(
    (colId: string | undefined) => {
      const col = collectionsList.find((c) => c.id === colId)
      return col ? col.name : 'Library'
    },
    [collectionsList]
  )

  // ----------------------------------------------------
  // LIBRARY OVERVIEW METRICS (3 CARDS)
  // ----------------------------------------------------
  const totalBooksCount = useMemo(() => books.length, [books])

  const totalAuthorsCount = useMemo(() => {
    const authorsSet = new Set(books.map((b) => b.author).filter(Boolean))
    return authorsSet.size
  }, [books])

  const totalCollectionsCount = useMemo(() => collectionsList.length, [collectionsList])

  // ----------------------------------------------------
  // CONTINUE READING CARD DATA
  // ----------------------------------------------------
  const continueReadingBook = useMemo(() => {
    const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100)
    if (inProgress.length > 0) {
      return [...inProgress].sort((a, b) => {
        const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0
        const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0
        return timeB - timeA
      })[0]
    }
    return books[0] || null
  }, [books])

  const pagesRemaining = useMemo(() => {
    if (!continueReadingBook) return 0
    return Math.max(0, continueReadingBook.totalPages - continueReadingBook.currentPage)
  }, [continueReadingBook])

  const minutesRemaining = useMemo(() => Math.round(pagesRemaining * 1.2), [pagesRemaining])

  const estTimeStr = useMemo(() => {
    if (minutesRemaining <= 0) return 'Completed'
    if (minutesRemaining >= 60) {
      const hrs = Math.floor(minutesRemaining / 60)
      const mins = minutesRemaining % 60
      return `${hrs}h ${mins}m left`
    }
    return `${minutesRemaining}m left`
  }, [minutesRemaining])

  // ----------------------------------------------------
  // WEEKLY READING CHART (7-DAY GRAPH)
  // ----------------------------------------------------
  const weeklyChartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const todayIndex = (new Date().getDay() + 6) % 7 // Mon = 0, Sun = 6
    const baseValues = [45, 60, 30, 75, 50, 90, 65]
    const maxValue = Math.max(...baseValues)

    return days.map((dayLabel, idx) => {
      const minutes = baseValues[idx]
      const heightPercent = Math.round((minutes / maxValue) * 100)
      const isToday = idx === todayIndex
      return {
        day: dayLabel,
        minutes,
        heightPercent,
        isToday,
        isPeak: minutes === maxValue,
      }
    })
  }, [])

  const readingTimeWeekHrs = useMemo(() => {
    const totalMins = weeklyChartData.reduce((acc, d) => acc + d.minutes, 0)
    return (totalMins / 60).toFixed(1)
  }, [weeklyChartData])

  // ----------------------------------------------------
  // RECENT NOTES FEED (LATEST 4)
  // ----------------------------------------------------
  const recentNotesFeed = useMemo(() => {
    return [...allNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [allNotes])

  // Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  } as const

  return (
    <PageWrapper className="space-y-8 bg-[#F8FAFC] pb-16 text-left select-none dark:bg-slate-950/20">
      <AnimatePresence mode="wait">
        {loading ? (
          /* Skeleton Loading Screen */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="h-32 w-full animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/50" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-3xl bg-slate-200/50 dark:bg-slate-800/40"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="h-64 animate-pulse rounded-3xl bg-slate-200/50 lg:col-span-2 dark:bg-slate-800/40" />
              <div className="h-64 animate-pulse rounded-3xl bg-slate-200/50 dark:bg-slate-800/40" />
            </div>
          </motion.div>
        ) : (
          /* Clean & Minimal Production Dashboard */
          <motion.div
            key="dashboard-clean"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* ==================================================
                SECTION 1: WELCOME CARD
                ================================================== */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    <span>{greetingIcon}</span>
                    <span>
                      {greetingText}, {user?.displayName || 'Reader'}
                    </span>
                  </h1>
                  <p className="text-xs font-semibold text-slate-400">
                    Welcome to your digital reading hub
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ==================================================
                SECTION 2: LIBRARY OVERVIEW (3 CARDS)
                ================================================== */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                Library Overview
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Total Books */}
                <div
                  onClick={() => navigate(ROUTES.LIBRARY)}
                  className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Books
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                        {totalBooksCount}
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        volumes on shelves
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-600 dark:text-slate-600 dark:group-hover:text-purple-400" />
                  </div>
                </div>

                {/* Total Authors */}
                <div
                  onClick={() => navigate(ROUTES.LIBRARY)}
                  className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Authors
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                        {totalAuthorsCount}
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        unique writers
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-600 dark:text-slate-600 dark:group-hover:text-purple-400" />
                  </div>
                </div>

                {/* Total Collections */}
                <div
                  onClick={() => navigate(ROUTES.COLLECTIONS)}
                  className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Collections
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <FolderOpen className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                        {totalCollectionsCount}
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        shelves created
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-600 dark:text-slate-600 dark:group-hover:text-purple-400" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* MAIN 2-COLUMN WORKSPACE GRID */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* LEFT COLUMN (2 COLS) */}
              <div className="space-y-8 lg:col-span-2">
                {/* ==================================================
                    SECTION 3: CONTINUE READING HERO CARD
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                    Continue Reading
                  </h3>

                  {continueReadingBook ? (
                    <div className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        {/* Fixed Aspect Ratio Cover */}
                        <img
                          src={continueReadingBook.coverPath}
                          alt={continueReadingBook.title}
                          className="aspect-[0.7/1] w-28 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-md transition-transform duration-300 group-hover:scale-[1.02] sm:w-32 dark:border-slate-800"
                        />

                        {/* Center Content Area */}
                        <div className="min-w-0 flex-1 space-y-2.5 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              {getCollectionName(continueReadingBook.collectionId)}
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-400">
                              {estTimeStr}
                            </span>
                          </div>

                          <div>
                            <h4 className="line-clamp-2 text-base leading-snug font-black tracking-tight text-slate-900 sm:text-lg dark:text-white">
                              {continueReadingBook.title}
                            </h4>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                              By {continueReadingBook.author}
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              <span>{continueReadingBook.progress}% Completed</span>
                              <span>
                                Page {continueReadingBook.currentPage} of{' '}
                                {continueReadingBook.totalPages || 320}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-purple-600 transition-all duration-300"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Aligned Compact Resume Button (46px height) */}
                        <div className="shrink-0 pt-2 sm:self-center sm:pt-0">
                          <Link to={ROUTES.READER.replace(':id', continueReadingBook.id)}>
                            <Button
                              size="md"
                              className="h-[46px] w-full rounded-2xl bg-purple-600 px-5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:scale-[1.02] hover:bg-purple-700 hover:shadow-md active:scale-[0.98] sm:w-auto sm:px-6"
                              leftIcon={
                                <Play className="h-3.5 w-3.5 fill-current stroke-current" />
                              }
                            >
                              Resume
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      No book in progress. Open any book from your library to start reading!
                    </div>
                  )}
                </motion.div>

                {/* ==================================================
                    SECTION 4: WEEKLY READING ACTIVITY CHART
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                      Weekly Reading Activity
                    </h3>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-purple-600" /> Last 7 Days
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
                      <div>
                        <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                          {readingTimeWeekHrs} hrs
                        </span>
                        <p className="text-xs font-semibold text-slate-400">
                          Total reading duration this week
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                          <BarChart3 className="h-3 w-3" /> Peak:{' '}
                          {Math.max(...weeklyChartData.map((d) => d.minutes))} mins
                        </span>
                      </div>
                    </div>

                    {/* 7-Day Visual Bar Graph */}
                    <div className="mt-6 flex h-44 items-end justify-between gap-3 px-2">
                      {weeklyChartData.map((item, idx) => (
                        <div
                          key={idx}
                          className="group flex h-full flex-1 flex-col items-center justify-end"
                        >
                          {/* Hover Value Badge */}
                          <div className="mb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-xs dark:bg-slate-100 dark:text-slate-900">
                              {item.minutes}m
                            </span>
                          </div>

                          {/* Animated Bar Fill */}
                          <div className="relative flex h-32 w-full max-w-[42px] items-end overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${item.heightPercent}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`w-full rounded-2xl transition-all duration-200 ${
                                item.isToday
                                  ? 'bg-purple-600 shadow-md ring-2 ring-purple-400/30'
                                  : item.isPeak
                                    ? 'bg-gradient-to-t from-purple-700 to-indigo-500'
                                    : 'bg-purple-300 hover:bg-purple-400 dark:bg-purple-900/60 dark:hover:bg-purple-800'
                              }`}
                            />
                          </div>

                          {/* Day Label */}
                          <span
                            className={`mt-3 text-xs font-bold ${
                              item.isToday
                                ? 'font-extrabold text-purple-600 dark:text-purple-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* RIGHT COLUMN (1 COL): RECENT NOTES & SUBSCRIPTION */}
              <div className="space-y-8">
                {/* ==================================================
                    SECTION 4.5: SUBSCRIPTION & STORAGE
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                      My Subscription
                    </h3>
                    <Link
                      to={ROUTES.SUBSCRIPTION}
                      className="text-xs font-extrabold text-purple-600 transition-colors hover:text-purple-700"
                    >
                      Manage Plan
                    </Link>
                  </div>

                  <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                          <Award className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                            Plan
                          </h4>
                          <span className="font-sans text-xs font-black text-slate-900 capitalize dark:text-white">
                            {currentPlan.plan_name}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8.5px] font-bold tracking-wider uppercase ${
                          subscriptionStatus === 'Expired'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : subscriptionStatus === 'Canceled'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                        }`}
                      >
                        {subscriptionStatus}
                      </span>
                    </div>

                    {/* Storage progress */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                          <span>Storage Quota</span>
                        </div>
                        <span>
                          {(storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB of{' '}
                          {storageLimitBytes >= 1099511627776
                            ? `${(storageLimitBytes / 1099511627776).toFixed(0)} TB`
                            : `${(storageLimitBytes / 1024 / 1024 / 1024).toFixed(0)} GB`}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                        <span>
                          {Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))}%
                          Used
                        </span>
                        <span>
                          {Math.max(
                            0,
                            (storageLimitBytes - storageUsedBytes) / 1024 / 1024 / 1024
                          ).toFixed(2)}{' '}
                          GB Remaining
                        </span>
                      </div>
                    </div>

                    {/* Renewal / Expiry */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-[10.5px] dark:border-slate-800">
                      <div>
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase">
                          Renewal Date
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {renewalDate || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase">
                          Daily AI Requests
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {currentPlan.ai_daily_limit === -1
                            ? 'Unlimited'
                            : `${currentPlan.ai_daily_limit} / Day`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ==================================================
                    SECTION 5: RECENT NOTES FEED
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                      Recent Notes
                    </h3>
                    <Link
                      to={ROUTES.NOTES}
                      className="text-xs font-extrabold text-purple-600 transition-colors hover:text-purple-700"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {recentNotesFeed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">
                          No notes yet
                        </h4>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                          Your reading notes will appear here.
                        </p>
                      </div>
                    ) : (
                      recentNotesFeed.map((note) => (
                        <Link
                          key={note.id}
                          to={`/reader/${note.bookId}?page=${note.pageNumber}`}
                          className="group block rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                            <span className="max-w-[170px] truncate text-xs font-extrabold text-slate-900 dark:text-white">
                              {getBookTitle(note.bookId)}
                            </span>
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              Page {note.pageNumber}
                            </span>
                          </div>

                          {note.highlightedText && (
                            <p className="mt-2.5 line-clamp-2 border-l-2 border-purple-400 pl-2.5 text-[10.5px] font-normal text-slate-500 italic dark:text-slate-400">
                              "{note.highlightedText}"
                            </p>
                          )}

                          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {note.noteText || note.noteTitle || 'Page Bookmark Marker'}
                          </p>

                          <div className="mt-3 flex items-center justify-between pt-1">
                            <span className="text-[9px] font-semibold text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-purple-600 transition-transform group-hover:translate-x-0.5">
                              Open Reader <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
