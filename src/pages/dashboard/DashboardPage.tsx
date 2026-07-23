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
import { PageWrapper } from '../../components/common/PageWrapper'

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (value <= 0) return
    let start = 0
    const end = value
    const duration = 600
    const stepTime = Math.abs(Math.floor(duration / end))
    const timer = setInterval(
      () => {
        start += 1
        setDisplayValue(start)
        if (start >= end) {
          clearInterval(timer)
        }
      },
      Math.max(stepTime, 20)
    )

    return () => clearInterval(timer)
  }, [value])

  return <>{displayValue}</>
}

const STATIC_PARTICLES = Array.from({ length: 18 }).map(() => ({
  width: Math.random() * 5 + 3,
  height: Math.random() * 5 + 3,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 105}%`,
  yEnd: -120 - Math.random() * 180,
  duration: Math.random() * 25 + 25,
  delay: Math.random() * -40,
}))

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

  const [currentTimestamp] = useState(() => Date.now())
  const lastReadStr = useMemo(() => {
    if (!continueReadingBook?.lastReadAt) return 'Not read yet'
    const diff = currentTimestamp - new Date(continueReadingBook.lastReadAt).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 65)
    if (hrs < 24) return `${hrs}h ago`
    return new Date(continueReadingBook.lastReadAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }, [continueReadingBook, currentTimestamp])

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
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  } as const

  return (
    <PageWrapper className="relative min-h-screen space-y-8 overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#111827] to-[#161B2D] pb-16 text-left text-slate-100 select-none">
      {/* Premium subtle radial purple glow behind dashboard content */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-900/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-900/5 blur-[120px]" />

      {/* Subtle moving particles (opacity ~4%) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
        {STATIC_PARTICLES.map((p, idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-purple-500"
            style={{
              width: p.width,
              height: p.height,
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, p.yEnd],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}
      </div>

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
            <div className="h-32 w-full animate-pulse rounded-[20px] bg-slate-800/40" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-28 animate-pulse rounded-[20px] bg-slate-800/30" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="h-64 animate-pulse rounded-[20px] bg-slate-800/30 lg:col-span-2" />
              <div className="h-64 animate-pulse rounded-[20px] bg-slate-800/30" />
            </div>
          </motion.div>
        ) : (
          /* Clean & Minimal Production Dashboard */
          <motion.div
            key="dashboard-clean"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative z-10 space-y-8"
          >
            {/* ==================================================
                SECTION 1: WELCOME CARD
                ================================================== */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                    <span>{greetingIcon}</span>
                    <span>
                      {greetingText}, {user?.displayName || 'Reader'}
                    </span>
                  </h1>
                  <p className="text-slate-450 text-xs font-semibold dark:text-slate-400">
                    Welcome to your digital reading hub
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ==================================================
                SECTION 2: LIBRARY OVERVIEW (3 CARDS)
                ================================================== */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="text-slate-450 text-xs font-extrabold tracking-widest uppercase">
                Library Overview
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Total Books */}
                <div
                  onClick={() => navigate(ROUTES.LIBRARY)}
                  className="group cursor-pointer rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Books
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <BookOpen className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-white">
                        <AnimatedNumber value={totalBooksCount} />
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        volumes on shelves
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-400" />
                  </div>
                </div>

                {/* Total Authors */}
                <div
                  onClick={() => navigate(ROUTES.LIBRARY)}
                  className="group cursor-pointer rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Authors
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-white">
                        <AnimatedNumber value={totalAuthorsCount} />
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        unique writers
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-400" />
                  </div>
                </div>

                {/* Total Collections */}
                <div
                  onClick={() => navigate(ROUTES.COLLECTIONS)}
                  className="group cursor-pointer rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Total Collections
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <FolderOpen className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-2xl font-black text-white">
                        <AnimatedNumber value={totalCollectionsCount} />
                      </span>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        shelves created
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-400" />
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
                  <h3 className="text-slate-450 text-xs font-extrabold tracking-widest uppercase">
                    Continue Reading
                  </h3>

                  {continueReadingBook ? (
                    <div className="group rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)] sm:p-6">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        {/* Enlarged Book Cover */}
                        <img
                          src={continueReadingBook.coverPath}
                          alt={continueReadingBook.title}
                          className="aspect-[0.7/1] w-32 shrink-0 rounded-2xl border border-white/[0.08] object-cover shadow-2xl transition-transform duration-300 group-hover:scale-[1.03] sm:w-36"
                        />

                        {/* Center Content Area */}
                        <div className="min-w-0 flex-1 space-y-3 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-extrabold text-purple-300">
                              {getCollectionName(continueReadingBook.collectionId)}
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-400">
                              {estTimeStr}
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-400/80">
                              • {lastReadStr}
                            </span>
                          </div>

                          <div>
                            <h4 className="line-clamp-2 text-base leading-snug font-black tracking-tight text-white sm:text-lg">
                              {continueReadingBook.title}
                            </h4>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                              By {continueReadingBook.author}
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                              <span className="text-purple-350">
                                {continueReadingBook.progress}% Completed
                              </span>
                              <span>
                                Page {continueReadingBook.currentPage} of{' '}
                                {continueReadingBook.totalPages || 320}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] transition-all duration-300"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Netflix-inspired Resume Button */}
                        <div className="shrink-0 pt-2 sm:self-center sm:pt-0">
                          <Link to={ROUTES.READER.replace(':id', continueReadingBook.id)}>
                            <button className="flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 text-xs font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.97] sm:w-auto">
                              <Play className="h-3.5 w-3.5 fill-current stroke-current" />
                              <span>Resume</span>
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-[20px] border border-dashed border-white/[0.08] bg-[#1B2233] text-xs font-semibold text-slate-400">
                      No book in progress. Open any book from your library to start reading!
                    </div>
                  )}
                </motion.div>

                {/* ==================================================
                    SECTION 4: WEEKLY READING ACTIVITY CHART
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-450 text-xs font-extrabold tracking-widest uppercase">
                      Weekly Reading Activity
                    </h3>
                    <span className="text-slate-450 flex items-center gap-1.5 text-[10px] font-bold">
                      <Calendar className="h-3.5 w-3.5 text-purple-500" /> Last 7 Days
                    </span>
                  </div>

                  <div className="rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-6 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
                      <div>
                        <span className="font-mono text-2xl font-black text-white">
                          {readingTimeWeekHrs} hrs
                        </span>
                        <p className="text-xs font-semibold text-slate-400">
                          Total reading duration this week
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-300">
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
                            <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-xs">
                              {item.minutes}m
                            </span>
                          </div>

                          {/* Animated Bar Fill */}
                          <div className="relative flex h-32 w-full max-w-[42px] items-end overflow-hidden rounded-2xl bg-slate-800">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${item.heightPercent}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`w-full rounded-2xl transition-all duration-200 ${
                                item.isToday
                                  ? 'bg-purple-600 shadow-md ring-2 ring-purple-400/30'
                                  : item.isPeak
                                    ? 'bg-gradient-to-t from-purple-700 to-indigo-500'
                                    : 'bg-purple-500/40 hover:bg-purple-500/60'
                              }`}
                            />
                          </div>

                          {/* Day Label */}
                          <span
                            className={`mt-3 text-xs font-bold ${
                              item.isToday ? 'font-extrabold text-purple-400' : 'text-slate-500'
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
                    <h3 className="text-slate-450 text-xs font-extrabold tracking-widest uppercase">
                      My Subscription
                    </h3>
                  </div>

                  <div className="space-y-4 rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-5 text-left text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                          <Award className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                            Plan
                          </h4>
                          <span className="font-sans text-xs font-black text-white capitalize">
                            {currentPlan.plan_name}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8.5px] font-bold tracking-wider uppercase ${
                          subscriptionStatus === 'Expired'
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                            : subscriptionStatus === 'Canceled'
                              ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                              : 'border-purple-500/20 bg-purple-500/10 text-purple-300'
                        }`}
                      >
                        {subscriptionStatus}
                      </span>
                    </div>

                    {/* Improved Storage Progress Bar */}
                    <div className="space-y-2.5 border-t border-white/[0.08] pt-4">
                      <div className="text-slate-450 flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-1">
                          <HardDrive className="text-slate-450 h-3.5 w-3.5" />
                          <span>Storage Quota</span>
                        </div>
                        <span>
                          {(storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB /{' '}
                          {storageLimitBytes >= 1099511627776
                            ? `${(storageLimitBytes / 1099511627776).toFixed(0)} TB`
                            : `${(storageLimitBytes / 1024 / 1024 / 1024).toFixed(0)} GB`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                        <span className="shrink-0 font-mono text-[10px]">0 GB</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 font-mono text-[10px]">
                          {storageLimitBytes >= 1099511627776 ? '1 TB' : '10 GB'}
                        </span>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>
                          {Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100))}%
                          Used
                        </span>
                        <span>
                          {Math.max(
                            0,
                            (storageLimitBytes - storageUsedBytes) / 1024 / 1024 / 1024
                          ).toFixed(2)}{' '}
                          GB Free
                        </span>
                      </div>
                    </div>

                    {/* Renewal / Expiry */}
                    <div className="grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-4 text-[10.5px]">
                      <div>
                        <span className="text-slate-450 block text-[9px] font-extrabold tracking-wider uppercase">
                          Renewal Date
                        </span>
                        <span className="font-bold text-slate-200">{renewalDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[9px] font-extrabold tracking-wider uppercase">
                          AI Daily Requests
                        </span>
                        <span className="font-bold text-slate-200">
                          {currentPlan.ai_daily_limit === -1
                            ? 'Unlimited'
                            : `${currentPlan.ai_daily_limit} / Day`}
                        </span>
                      </div>
                    </div>

                    {/* Upgrade Plan Button */}
                    <div className="pt-2">
                      <Link to={ROUTES.SUBSCRIPTION} className="block w-full">
                        <button className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] py-2.5 text-center text-xs font-bold text-white uppercase shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-[0.98]">
                          Upgrade Plan
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* ==================================================
                    SECTION 5: RECENT NOTES FEED
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-450 text-xs font-extrabold tracking-widest uppercase">
                      Recent Notes
                    </h3>
                    <Link
                      to={ROUTES.NOTES}
                      className="text-xs font-extrabold text-purple-400 transition-colors hover:text-purple-300"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {recentNotesFeed.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-8 text-center text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-xs font-bold text-white">No notes yet</h4>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                          Your reading notes will appear here.
                        </p>
                      </div>
                    ) : (
                      recentNotesFeed.map((note) => (
                        <Link
                          key={note.id}
                          to={`/reader/${note.bookId}?page=${note.pageNumber}`}
                          className="group block rounded-[20px] border border-white/[0.08] bg-[#1B2233] p-4 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)]"
                        >
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                            <span className="max-w-[170px] truncate text-xs font-extrabold text-white">
                              {getBookTitle(note.bookId)}
                            </span>
                            <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                              Page {note.pageNumber}
                            </span>
                          </div>

                          {note.highlightedText && (
                            <p className="mt-2.5 line-clamp-2 border-l-2 border-purple-400 pl-2.5 text-[10.5px] font-normal text-slate-400 italic">
                              "{note.highlightedText}"
                            </p>
                          )}

                          <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-200">
                            {note.noteText || note.noteTitle || 'Page Bookmark Marker'}
                          </p>

                          <div className="mt-3 flex items-center justify-between pt-1">
                            <span className="text-[9px] font-semibold text-slate-500">
                              {new Date(note.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-purple-400 transition-transform group-hover:translate-x-0.5">
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
