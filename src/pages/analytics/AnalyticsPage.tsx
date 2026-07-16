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
      return col ? col.name : 'Classics'
    },
    [collectionsList]
  )

  // calculations
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
    const minutes = totalPagesRead * 1.5 // estimate
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10
      return `${hours} hrs`
    }
    return `${Math.round(minutes)} mins`
  }, [totalReadingSeconds, totalPagesRead])

  // Streaks calculations
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
    return 35 // default mock speed if no timing logs
  }, [totalReadingSeconds, totalPagesRead])

  // Filter books read (lastReadAt exists)
  const readingHistory = useMemo(() => {
    return books
      .filter((b) => b.lastReadAt !== undefined)
      .sort((a, b) => {
        const timeA = new Date(a.lastReadAt!).getTime()
        const timeB = new Date(b.lastReadAt!).getTime()
        return timeB - timeA
      })
  }, [books])

  // Weekly page logs chart
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
      // Mock chart data if empty
      result[1].value = 4
      result[2].value = 12
      result[3].value = 8
      result[4].value = 16
      result[5].value = 6
    }
    return result
  }, [books])

  // Monthly stats report mock
  const monthlyChartData = useMemo(() => {
    return [
      { label: 'Week 1', value: 45 },
      { label: 'Week 2', value: 80 },
      { label: 'Week 3', value: 55 },
      { label: 'Week 4', value: 92 },
    ]
  }, [])

  // Goals progress
  const dailyGoalPages = 20
  const pagesReadToday = useMemo(() => {
    const todayStr = new Date().toDateString()
    return books
      .filter((b) => b.lastReadAt && new Date(b.lastReadAt).toDateString() === todayStr)
      .reduce((acc, b) => acc + Math.min(b.currentPage, 12), 0)
  }, [books])

  const dailyGoalPercent = Math.min(100, Math.round((pagesReadToday / dailyGoalPages) * 100))

  const weeklyGoalPages = 100
  const weeklyGoalProgress = totalPagesRead % 100
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalPages) * 100))

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
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Reading Analytics
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Monitor streaks, reading velocity, goals, and historic logs.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-100 bg-white p-5 h-28 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-20 rounded shimmer-placeholder" />
                    <div className="h-7 w-7 rounded-xl shimmer-placeholder" />
                  </div>
                  <div className="h-7 w-24 rounded-lg shimmer-placeholder" />
                </div>
              ))}
            </div>

            {/* Charts & Targets */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Chart 1 */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 h-56 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 rounded shimmer-placeholder" />
                  <div className="h-3 w-10 rounded shimmer-placeholder" />
                </div>
                <div className="flex items-end justify-between gap-3 h-28 pt-4">
                  {[40, 75, 50, 90, 60, 30, 45].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-md shimmer-placeholder" style={{ height: `${h}%` }} />
                      <div className="h-2 w-5 rounded shimmer-placeholder" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2 */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 h-56 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 rounded shimmer-placeholder" />
                  <div className="h-3 w-16 rounded shimmer-placeholder" />
                </div>
                <div className="flex items-end justify-between gap-6 h-28 pt-4">
                  {[50, 80, 40, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full rounded-t-md shimmer-placeholder" style={{ height: `${h}%` }} />
                      <div className="h-2 w-8 rounded shimmer-placeholder" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals Progress */}
              <div className="rounded-3xl border border-slate-100 bg-white p-6 h-56 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div className="h-3.5 w-24 rounded shimmer-placeholder" />
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <div className="h-3.5 w-3/4 rounded shimmer-placeholder" />
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-2/3 rounded shimmer-placeholder" />
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reading History Logs */}
            <div className="space-y-4">
              <div className="h-4.5 w-36 rounded shimmer-placeholder" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl border border-slate-100 bg-white p-4 h-36 flex justify-between dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex gap-4 flex-1">
                      <div className="aspect-[0.7/1] w-16 shrink-0 rounded-xl shimmer-placeholder" />
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-3 w-16 rounded shimmer-placeholder" />
                        <div className="h-4 w-32 rounded shimmer-placeholder" />
                        <div className="h-3 w-20 rounded shimmer-placeholder" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end border-l border-slate-50 pl-4 w-28 dark:border-slate-800/40 animate-none">
                      <div className="space-y-1.5 w-full flex flex-col items-end">
                        <div className="h-2.5 w-12 rounded shimmer-placeholder" />
                        <div className="h-3 w-16 rounded shimmer-placeholder" />
                      </div>
                      <div className="h-8 w-16 rounded-xl shimmer-placeholder" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <BarChart3 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Analytics Logged
              </h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Start reading books to generate progress statistics and metrics charts.
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
            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <motion.div
                variants={itemVariants}
                className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs premium-card dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Reading Time
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-purple-650 bg-purple-50 dark:bg-purple-950/20">
                    <Clock className="h-4.5 w-4.5 shrink-0" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                    {readingTimeStr}
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs premium-card dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Completed Books
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
                    <Award className="h-4.5 w-4.5 shrink-0" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                    {completedBooks}
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs premium-card dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Reading Velocity
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                    <Zap className="h-4.5 w-4.5 shrink-0" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                    {readingSpeedPgh}{' '}
                    <span className="text-[10px] text-slate-450 font-bold uppercase">pgs / hr</span>
                  </h3>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs premium-card dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Active Streak
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-red-600 bg-red-50 dark:bg-red-950/20">
                    <Flame className="h-4.5 w-4.5 shrink-0" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                    {readingStreak} {readingStreak === 1 ? 'day' : 'days'}
                  </h3>
                </div>
              </motion.div>
            </div>

            {/* Charts & Targets */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Weekly Activity */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:col-span-1"
              >
                <div className="flex items-center justify-between pb-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>Weekly Page Logs</span>
                  <span className="flex items-center gap-1 font-sans text-purple-650">
                    <TrendingUp className="h-3.5 w-3.5" /> High
                  </span>
                </div>
                <div className="flex h-36 items-end justify-between gap-3 px-2 pt-4">
                  {weeklyChartData.map((day, idx) => {
                    const maxVal = Math.max(...weeklyChartData.map((d) => d.value)) || 10
                    const percentHeight = Math.max(10, Math.round((day.value / maxVal) * 90))
                    return (
                      <div key={idx} className="group/bar flex flex-1 flex-col items-center gap-2">
                        <div className="relative flex w-full justify-center">
                          <div className="pointer-events-none absolute -top-8 scale-0 rounded bg-slate-950 px-2 py-1 text-[8px] font-bold text-white shadow-md transition-all group-hover/bar:scale-100">
                            {day.value} pgs
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentHeight}px` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-[16px] rounded-t-lg bg-purple-100 transition-all duration-300 group-hover/bar:bg-purple-600 dark:bg-purple-950/20"
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

              {/* Monthly Activity */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:col-span-1"
              >
                <div className="flex items-center justify-between pb-2 text-[10px] font-bold text-slate-400 uppercase">
                  <span>Monthly History</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">This Month</span>
                </div>
                <div className="flex h-36 items-end justify-between gap-6 px-4 pt-4">
                  {monthlyChartData.map((week, idx) => {
                    const maxVal = Math.max(...monthlyChartData.map((d) => d.value)) || 100
                    const percentHeight = Math.max(10, Math.round((week.value / maxVal) * 90))
                    return (
                      <div key={idx} className="group/bar flex flex-1 flex-col items-center gap-2">
                        <div className="relative flex w-full justify-center">
                          <div className="pointer-events-none absolute -top-8 scale-0 rounded bg-slate-950 px-2 py-1 text-[8px] font-bold text-white shadow-md transition-all group-hover/bar:scale-100">
                            {week.value} pgs
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentHeight}px` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-[24px] rounded-t-lg bg-blue-100 transition-all duration-300 group-hover/bar:bg-blue-500 dark:bg-blue-950/20"
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

              {/* Reading Goals */}
              <motion.div
                variants={itemVariants}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:col-span-1"
              >
                <h3 className="mb-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Reading Goals
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span>Daily: {pagesReadToday} / {dailyGoalPages} pages</span>
                      <span>{dailyGoalPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${dailyGoalPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span>Weekly: {weeklyGoalProgress} / {weeklyGoalPages} pages</span>
                      <span>{weeklyGoalPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-purple-650 transition-all duration-500"
                        style={{ width: `${weeklyGoalPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Reading History Log section */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                Reading History Log
              </h3>

              {readingHistory.length === 0 ? (
                <div className="border-border-base bg-bg-surface/30 flex h-32 items-center justify-center rounded-3xl border border-dashed text-xs text-slate-400">
                  <span>No reading history logs recorded yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {readingHistory.map((book) => (
                    <div
                      key={book.id}
                      className="flex h-36 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex min-w-0 flex-1 gap-4">
                        <img
                          src={book.coverPath}
                          alt={book.title}
                          className="aspect-[0.7/1] w-16 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                            {getCollectionName(book.collectionId)}
                          </span>
                          <h4 className="truncate text-xs leading-tight font-bold text-slate-900 dark:text-white">
                            {book.title}
                          </h4>
                          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                            By {book.author}
                          </p>

                          <div className="w-full pt-1.5">
                            <div className="mb-1 flex justify-between text-[9px] font-semibold text-slate-400">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-purple-600"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4 text-right dark:border-slate-800/40">
                        <div>
                          <span className="block text-[8px] font-semibold text-slate-400 uppercase">
                            Last read
                          </span>
                          <span className="text-slate-655 mt-0.5 block text-[9px] font-bold">
                            {book.lastReadAt
                              ? new Date(book.lastReadAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Not started'}
                          </span>
                          {book.readingTime !== undefined && book.readingTime > 0 && (
                            <p className="mt-1 text-[9px] font-bold text-purple-600">
                              ⏱ {Math.round(book.readingTime / 60) || 1} min read
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex gap-1.5">
                          <Link to={ROUTES.READER.replace(':id', book.id)}>
                            <Button
                              size="sm"
                              className="bg-purple-650 rounded-xl font-bold text-white shadow-xs transition-all hover:bg-purple-700"
                            >
                              Resume
                            </Button>
                          </Link>
                        </div>
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
