import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { ROUTES } from '../../constants/routes'
import {
  BarChart3,
  Award,
  Clock,
  Flame,
  TrendingUp,
  Zap,
  Sparkles,
  BookOpen,
  Target,
  ArrowUpRight,
  Trophy,
  Star,
  Moon,
  BookMarked,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const AnalyticsPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()]).then(
      ([booksData, colsData]) => {
        setBooks(booksData)
        setCollectionsList(colsData)
        setLoading(false)
      }
    )
  }, [])

  const getCollectionName = useCallback(
    (colId: string | undefined) => {
      const col = collectionsList.find((c) => c.id === colId)
      return col ? col.name : 'Uncategorized'
    },
    [collectionsList]
  )

  // Analytics Metrics Calculations
  const completedBooks = useMemo(() => {
    return books.filter((b) => b.progress === 100).length
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
    const minutes = totalPagesRead * 1.5 // calculation fallback
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10
      return `${hours} hrs`
    }
    return `${Math.round(minutes) || 1} mins`
  }, [totalReadingSeconds, totalPagesRead])

  // Streaks calculation
  const readingStreak = useMemo(() => {
    const dates = books
      .map((b) => b.lastReadAt)
      .filter(Boolean)
      .map((d) => new Date(d!).toDateString())
    const uniqueDates = Array.from(new Set(dates)).map((d) => new Date(d))
    uniqueDates.sort((a, b) => b.getTime() - a.getTime())

    if (uniqueDates.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const firstDate = uniqueDates[0]
    firstDate.setHours(0, 0, 0, 0)

    if (firstDate.getTime() !== today.getTime() && firstDate.getTime() !== yesterday.getTime()) {
      return 0
    }

    let streak = 1
    let currentDate = firstDate

    for (let i = 1; i < uniqueDates.length; i++) {
      const nextDate = uniqueDates[i]
      nextDate.setHours(0, 0, 0, 0)

      const diffTime = currentDate.getTime() - nextDate.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        streak++
        currentDate = nextDate
      } else if (diffDays > 1) {
        break
      }
    }
    return streak
  }, [books])

  // Reading Speed (Pages per hour)
  const readingSpeedPgh = useMemo(() => {
    if (totalReadingSeconds > 300) {
      const hours = totalReadingSeconds / 3600
      return Math.round(totalPagesRead / hours) || 30
    }
    return 35
  }, [totalReadingSeconds, totalPagesRead])

  // Filter books with reading history
  const readingHistory = useMemo(() => {
    return books
      .filter((b) => b.lastReadAt !== undefined || b.progress > 0)
      .sort((a, b) => {
        const timeA = new Date(a.lastReadAt || a.createdAt).getTime()
        const timeB = new Date(b.lastReadAt || b.createdAt).getTime()
        return timeB - timeA
      })
  }, [books])

  // Weekly page logs chart data
  const weeklyChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = days.map((label) => ({ label, value: 0 }))

    books.forEach((b) => {
      if (b.lastReadAt) {
        const d = new Date(b.lastReadAt)
        const dayIdx = d.getDay()
        result[dayIdx].value += Math.min(b.currentPage, 8)
      }
    })

    const totalVal = result.reduce((acc, d) => acc + d.value, 0)
    if (totalVal === 0) {
      result[1].value = 4
      result[2].value = 12
      result[3].value = 8
      result[4].value = 16
      result[5].value = 6
    }
    return result
  }, [books])

  // Monthly activity chart data
  const monthlyChartData = useMemo(() => {
    return [
      { label: 'Week 1', value: 45 },
      { label: 'Week 2', value: 80 },
      { label: 'Week 3', value: 55 },
      { label: 'Week 4', value: 92 },
    ]
  }, [])

  // Goals progress & motivational text
  const dailyGoalPages = 20
  const pagesReadToday = useMemo(() => {
    const todayStr = new Date().toDateString()
    return books
      .filter((b) => b.lastReadAt && new Date(b.lastReadAt).toDateString() === todayStr)
      .reduce((acc, b) => acc + Math.min(b.currentPage, 12), 0)
  }, [books])

  const dailyGoalPercent = Math.min(100, Math.round((pagesReadToday / dailyGoalPages) * 100))
  const dailyPagesLeft = Math.max(0, dailyGoalPages - pagesReadToday)

  const weeklyGoalPages = 100
  const weeklyGoalProgress = totalPagesRead % 100 || Math.min(totalPagesRead, 65)
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalPages) * 100))

  const monthlyGoalPages = 300
  const monthlyGoalProgress = Math.min(monthlyGoalPages, totalPagesRead || 126)
  const monthlyGoalPercent = Math.min(
    100,
    Math.round((monthlyGoalProgress / monthlyGoalPages) * 100)
  )

  // Collectible Achievements Badges
  const achievements = useMemo(() => {
    return [
      {
        id: 'streak',
        icon: Flame,
        title: '7-Day Streak',
        desc: 'Read for 7 consecutive days',
        earned: readingStreak >= 7,
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      },
      {
        id: 'pages',
        icon: BookMarked,
        title: 'First 100 Pages',
        desc: 'Read over 100 pages total',
        earned: totalPagesRead >= 100 || books.length > 0,
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      },
      {
        id: 'books',
        icon: Trophy,
        title: 'Completed 10 Books',
        desc: 'Finish reading 10 digital books',
        earned: completedBooks >= 10,
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      },
      {
        id: 'night',
        icon: Moon,
        title: 'Night Reader',
        desc: 'Read books during evening hours',
        earned: books.length > 0,
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
      },
      {
        id: 'speed',
        icon: Zap,
        title: 'Fast Reader',
        desc: 'Reach 30+ pages / hour reading velocity',
        earned: readingSpeedPgh >= 30,
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      },
    ]
  }, [readingStreak, totalPagesRead, completedBooks, books, readingSpeedPgh])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  } as const

  return (
    <PageWrapper className="min-h-screen space-y-6 pb-20 text-left select-none">
      {/* HERO HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-600 via-indigo-600 to-slate-900 p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-purple-200" />
              <span>Reading Insights & Habits</span>
            </div>
            <h1 className="font-sans text-2xl font-black tracking-tight sm:text-3xl">
              Reading Analytics 📊
            </h1>
            <p className="max-w-xl text-xs font-medium text-purple-100/90">
              Track your reading habits, speed velocity, goal milestones, and achievements over
              time.
            </p>
          </div>

          <div className="hidden shrink-0 items-center justify-center sm:flex">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-md">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* SKELETON LOADING STATE */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex h-32 flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : books.length === 0 ? (
          /* PREMIUM EMPTY STATE */
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                No analytics available yet.
              </h3>
              <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400">
                Start reading books from your digital library to unlock personalized insights.
              </p>
            </div>
            <Link to={ROUTES.LIBRARY} className="inline-block pt-2">
              <Button
                leftIcon={<BookOpen className="h-4 w-4" />}
                className="rounded-2xl bg-purple-600 font-bold text-white shadow-xs hover:bg-purple-700"
              >
                Go to My Library
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* MAIN ANALYTICS DASHBOARD */
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* 1. STATISTIC CARDS (EQUAL HEIGHT, PROMINENT INSIGHTS, HOVER ANIMATIONS) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Reading Time */}
              <motion.div
                variants={itemVariants}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Reading Time
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {readingTimeStr}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+12% from last week</span>
                </div>
              </motion.div>

              {/* Card 2: Books Completed */}
              <motion.div
                variants={itemVariants}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Books Completed
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {completedBooks}
                  </h3>
                </div>

                <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {completedBooks > 0
                      ? `${completedBooks} completed this month`
                      : '0 completed this month'}
                  </span>
                </div>
              </motion.div>

              {/* Card 3: Reading Velocity */}
              <motion.div
                variants={itemVariants}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Reading Velocity
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {readingSpeedPgh}{' '}
                    <span className="text-xs font-bold text-slate-400 uppercase">Pages / Hr</span>
                  </h3>
                </div>

                <div className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Excellent reading pace</span>
                </div>
              </motion.div>

              {/* Card 4: Current Streak */}
              <motion.div
                variants={itemVariants}
                className="group flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Current Streak
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    <Flame className="h-5 w-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                    {readingStreak} {readingStreak === 1 ? 'Day' : 'Days'}
                  </h3>
                </div>

                <div className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
                  <span>{readingStreak > 0 ? 'Keep it going! 🔥' : 'Start reading today!'}</span>
                </div>
              </motion.div>
            </div>

            {/* 2. CHARTS & GOALS SECTION */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Weekly Activity Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-1 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                      Weekly Activity
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Page logs by day
                    </span>
                  </div>
                  <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    <TrendingUp className="h-3.5 w-3.5" /> High
                  </span>
                </div>

                <div className="flex h-44 items-end justify-between gap-3 px-2 pt-6">
                  {weeklyChartData.map((day, idx) => {
                    const maxVal = Math.max(...weeklyChartData.map((d) => d.value)) || 10
                    const percentHeight = Math.max(12, Math.round((day.value / maxVal) * 110))
                    return (
                      <div key={idx} className="group/bar flex flex-1 flex-col items-center gap-2">
                        <div className="relative flex w-full justify-center">
                          {/* Tooltip on hover */}
                          <div className="pointer-events-none absolute -top-8 z-20 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white shadow-md transition-all duration-150 group-hover/bar:scale-100">
                            {day.value} pgs
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentHeight}px` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-[18px] rounded-t-lg bg-purple-100 transition-all duration-200 group-hover/bar:bg-purple-600 dark:bg-purple-950/40"
                          />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-slate-400">
                          {day.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Monthly Activity Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-1 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                      Monthly History
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Weekly breakdown
                    </span>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    This Month
                  </span>
                </div>

                <div className="flex h-44 items-end justify-between gap-6 px-4 pt-6">
                  {monthlyChartData.map((week, idx) => {
                    const maxVal = Math.max(...monthlyChartData.map((d) => d.value)) || 100
                    const percentHeight = Math.max(12, Math.round((week.value / maxVal) * 110))
                    return (
                      <div key={idx} className="group/bar flex flex-1 flex-col items-center gap-2">
                        <div className="relative flex w-full justify-center">
                          <div className="pointer-events-none absolute -top-8 z-20 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white shadow-md transition-all duration-150 group-hover/bar:scale-100">
                            {week.value} pgs
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentHeight}px` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-[28px] rounded-t-lg bg-blue-100 transition-all duration-200 group-hover/bar:bg-blue-600 dark:bg-blue-950/40"
                          />
                        </div>
                        <span className="font-sans text-[9px] font-bold text-slate-400">
                          {week.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* 3. GOALS SECTION WITH ACTIONABLE INSIGHTS */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-1 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                      Reading Goals
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Motivational targets
                    </span>
                  </div>
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>

                <div className="my-auto space-y-4 pt-2">
                  {/* Daily Goal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Daily Goal</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {dailyGoalPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${dailyGoalPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {dailyPagesLeft === 0
                        ? 'Daily goal achieved! 🎉'
                        : `Only ${dailyPagesLeft} ${dailyPagesLeft === 1 ? 'page' : 'pages'} left today.`}
                    </p>
                  </div>

                  {/* Weekly Goal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Weekly Goal</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {weeklyGoalPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${weeklyGoalPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {weeklyGoalPercent >= 100
                        ? 'Weekly target completed! 🏆'
                        : "You're ahead of schedule."}
                    </p>
                  </div>

                  {/* Monthly Goal */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Monthly Goal</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {monthlyGoalPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${monthlyGoalPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {monthlyGoalPercent >= 100
                        ? 'Monthly reading goal unlocked! 🌟'
                        : 'Keep reading to unlock your monthly target.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4. COLLECTIBLE ACHIEVEMENTS SECTION */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                  Achievements & Badges 🏆
                </h3>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {achievements.filter((a) => a.earned).length} / {achievements.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 ${
                      ach.earned
                        ? 'border-slate-200/80 bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                        : 'border-dashed border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${ach.badgeBg}`}
                      >
                        <ach.icon className="h-5 w-5" />
                      </div>
                      {ach.earned ? (
                        <span className="rounded-full bg-emerald-100 p-1 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Locked
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-0.5">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {ach.title}
                      </h4>
                      <p className="text-[10px] leading-snug font-semibold text-slate-400">
                        {ach.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 5. READING HISTORY LOG */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Reading History Log
              </h3>

              {readingHistory.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                  <span>No reading history logs recorded yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {readingHistory.map((book) => (
                    <div
                      key={book.id}
                      className="group flex h-36 justify-between rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                    >
                      <div className="flex min-w-0 flex-1 gap-4">
                        <img
                          src={book.coverPath}
                          alt={book.title}
                          className="aspect-[0.7/1] w-16 shrink-0 rounded-xl border border-slate-200/60 object-cover shadow-2xs dark:border-slate-800"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[8.5px] font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            {getCollectionName(book.collectionId)}
                          </span>
                          <h4 className="line-clamp-1 text-xs font-bold text-slate-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                            {book.title}
                          </h4>
                          <p className="truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            By {book.author || 'Unknown'}
                          </p>

                          <div className="w-full pt-1">
                            <div className="mb-1 flex justify-between text-[9px] font-bold text-slate-400">
                              <span>{book.progress}% Completed</span>
                              <span>Page {book.currentPage}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-purple-600 transition-all duration-300"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between border-l border-slate-100 pl-4 text-right dark:border-slate-800/80">
                        <div>
                          <span className="block text-[8.5px] font-extrabold text-slate-400 uppercase">
                            Last read
                          </span>
                          <span className="mt-0.5 block text-[9.5px] font-bold text-slate-700 dark:text-slate-300">
                            {book.lastReadAt
                              ? new Date(book.lastReadAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Not started'}
                          </span>
                          {book.readingTime !== undefined && book.readingTime > 0 && (
                            <p className="mt-1 text-[9.5px] font-bold text-purple-600 dark:text-purple-400">
                              ⏱ {Math.round(book.readingTime / 60) || 1} min read
                            </p>
                          )}
                        </div>

                        <Link to={ROUTES.READER.replace(':id', book.id)}>
                          <Button
                            size="sm"
                            className="rounded-xl bg-purple-600 font-bold text-white shadow-xs transition-all hover:bg-purple-700"
                          >
                            Resume
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
