import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notesService, type Note } from '../../services/notes'
import { useAuth } from '../../context/AuthContext'
import { formatBytes } from '../../utils/helpers'
import {
  BookOpen,
  FolderOpen,
  Play,
  Activity,
  Users,
  X,
  MessageSquare,
  Flame,
  HardDrive,
  Clock,
  BookOpenCheck,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [previewBook, setPreviewBook] = useState<Book | null>(null)
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])

  const fetchBooks = () => {
    Promise.all([
      booksService.getBooks(),
      collectionsService.getCollections(),
      notesService.getAllNotes(),
    ]).then(([booksData, colsData, notesData]) => {
      setBooks(booksData)
      setCollectionsList(colsData)
      setAllNotes(notesData)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const getCollectionName = useCallback(
    (colId: string | undefined) => {
      const col = collectionsList.find((c) => c.id === colId)
      return col ? col.name : 'Classics'
    },
    [collectionsList]
  )

  const getBookTitle = useCallback(
    (bookId: string) => {
      const found = books.find((b) => b.id === bookId)
      return found ? found.title : 'Book Title'
    },
    [books]
  )

  // --- STREAK & LOGS CALCULATIONS ---
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

  const pagesReadToday = useMemo(() => {
    const todayStr = new Date().toDateString()
    return books
      .filter((b) => b.lastReadAt && new Date(b.lastReadAt).toDateString() === todayStr)
      .reduce((acc, b) => acc + Math.min(b.currentPage, 12), 0)
  }, [books])

  const readingTimeTodayMins = useMemo(() => {
    return Math.round(pagesReadToday * 1.5)
  }, [pagesReadToday])

  // --- CONTINUE READING (Show only ONE book) ---
  const continueReadingBook = useMemo(() => {
    const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100)
    if (inProgress.length > 0) {
      // sort by lastReadAt desc
      return inProgress.sort((a, b) => {
        const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0
        const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0
        return timeB - timeA
      })[0]
    }
    return books[0] || null
  }, [books])

  // --- RECENT NOTES (latest 3 notes) ---
  const latestNotes = useMemo(() => {
    return [...allNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [allNotes])

  // --- DYNAMIC RECENT ACTIVITY LOGS ---
  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; desc: string; time: Date }[] = []

    // Map uploads
    books.slice(0, 4).forEach((b) => {
      list.push({
        id: `upload-${b.id}`,
        type: 'upload',
        title: 'Book Uploaded',
        desc: `"${b.title}" added to library.`,
        time: new Date(b.createdAt),
      })
    })

    // Map note updates
    allNotes.slice(0, 4).forEach((n) => {
      list.push({
        id: `note-${n.id}`,
        type: 'note',
        title: 'Note Added',
        desc: `Added annotation on page ${n.pageNumber} of "${getBookTitle(n.bookId)}".`,
        time: new Date(n.createdAt),
      })
    })

    // Map completed books
    books.forEach((b) => {
      if (b.progress === 100) {
        list.push({
          id: `completed-${b.id}`,
          type: 'goal',
          title: 'Book Finished',
          desc: `Completed reading "${b.title}".`,
          time: new Date(b.lastReadAt || b.updatedAt || b.createdAt),
        })
      }
    })

    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5)
  }, [books, allNotes, getBookTitle])

  // --- STATS CALCULATIONS ---
  const totalPagesRead = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.progress > 0 ? b.currentPage : 0), 0)
  }, [books])

  const completedBooksCount = useMemo(() => {
    return books.filter((b) => b.progress === 100).length
  }, [books])

  const totalReadingSeconds = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.readingTime || 0), 0)
  }, [books])

  const totalReadingTimeStr = useMemo(() => {
    const mins = Math.floor(totalReadingSeconds / 60)
    if (mins >= 60) {
      return `${(totalReadingSeconds / 3600).toFixed(1)} hrs`
    }
    return `${mins} mins`
  }, [totalReadingSeconds])

  const totalStorageBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.fileSize || 0), 0)
  }, [books])

  const statsList = useMemo(() => {
    return [
      {
        title: 'Total Books',
        value: String(books.length),
        sub: 'volumes on shelves',
        icon: BookOpen,
        color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/20',
      },
      {
        title: 'Total Authors',
        value: String(new Set(books.map((b) => b.author).filter(Boolean)).size),
        sub: 'unique writers',
        icon: Users,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      },
      {
        title: 'Total Collections',
        value: String(collectionsList.length),
        sub: 'index tags',
        icon: FolderOpen,
        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20',
      },
      {
        title: 'Storage Used',
        value: formatBytes(totalStorageBytes),
        sub: 'of 1 GB limit',
        icon: HardDrive,
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
      },
      {
        title: 'Reading Time',
        value: totalReadingTimeStr,
        sub: 'active study',
        icon: Clock,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
      },
      {
        title: 'Completed Books',
        value: String(completedBooksCount),
        sub: 'finished volumes',
        icon: BookOpenCheck,
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
      },
    ]
  }, [books, collectionsList, totalStorageBytes, totalReadingTimeStr, completedBooksCount])

  // Reading Goals settings
  const dailyGoalPages = 20
  const dailyGoalPercent = Math.min(100, Math.round((pagesReadToday / dailyGoalPages) * 100))

  const weeklyGoalPages = 100
  const weeklyGoalProgress = totalPagesRead % 100
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalPages) * 100))

  const motivationalQuote = useMemo(() => {
    if (books.length === 0) {
      return 'The journey of a lifetime starts with a single page. Upload a book to begin.'
    }
    if (books.some((b) => b.progress > 0 && b.progress < 100)) {
      return 'Consistency is key. You are making great progress in your current book!'
    }
    return 'Reading is to the mind what exercise is to the body. Keep feeding your curiosity!'
  }, [books])

  // Chart Data Calculations (pages read per day of the week)
  const weeklyChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = days.map((label) => ({ label, value: 0 }))

    // Distribute pages read today or recently read books
    books.forEach((b) => {
      if (b.lastReadAt) {
        const d = new Date(b.lastReadAt)
        const dayIdx = d.getDay()
        // Accumulate currentPage as a mock representation of activity index
        result[dayIdx].value += Math.min(b.currentPage, 8)
      }
    })

    // Fallback seed values if data is empty so chart looks visually rich and alive
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

  // Total reading sessions count
  const readingSessionsCount = useMemo(() => {
    return books.filter((b) => b.lastReadAt).length || books.length
  }, [books])

  // SVG Progress Ring components
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (weeklyGoalPercent / 100) * circumference

  // Animation configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

  return (
    <div className="space-y-8 bg-slate-50/40 text-left select-none dark:bg-slate-950/10">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
          >
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-28 animate-pulse flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-8 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* 1. PREMIUM GRADIENT HERO BANNER */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:p-8"
            >
              {/* Abstract mesh shapes */}
              <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-extrabold tracking-widest text-purple-300 uppercase">
                      Overview Dashboard
                    </span>
                    <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                      Welcome back, {user?.displayName || 'Reader'} 👋
                    </h1>
                  </div>
                  <p className="max-w-xl text-xs leading-relaxed text-slate-300 italic">
                    "{motivationalQuote}"
                  </p>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0">
                  {/* Streak widget */}
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-2.5 backdrop-blur-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/25 text-orange-400">
                      <Flame className="h-4.5 w-4.5 animate-pulse fill-current" />
                    </div>
                    <div>
                      <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase">
                        Active Streak
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {readingStreak} {readingStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Goal Progress */}
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase">
                        <span>Weekly Target</span>
                        <span className="font-mono text-white">
                          {weeklyGoalProgress}/{weeklyGoalPages} pgs
                        </span>
                      </div>
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all duration-500"
                          style={{ width: `${weeklyGoalPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. QUICK STATISTICS ROW - 6 METRICS */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {statsList.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4.5 shadow-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <stat.icon className="h-4 w-4 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-4 text-left">
                    <h3 className="font-mono text-xl leading-none font-black tracking-tight text-slate-950 dark:text-white">
                      {stat.value}
                    </h3>
                    <p className="mt-2 truncate text-[8px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* MAIN DASHBOARD BLOCKS */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Pane (col-span-2) */}
              <div className="space-y-8 lg:col-span-2">
                {/* 2. CONTINUE READING SHELF */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Continue Reading
                  </h3>

                  {continueReadingBook ? (
                    <div className="group flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex min-w-0 flex-1 items-start gap-5">
                        <div className="relative shrink-0">
                          <img
                            src={continueReadingBook.coverPath}
                            alt={continueReadingBook.title}
                            className="aspect-[0.7/1] w-20 rounded-2xl border border-slate-100 object-cover shadow-md transition-transform duration-300 group-hover:scale-[1.03] group-hover:-rotate-1 dark:border-slate-800"
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-inner" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <span className="block w-fit rounded bg-purple-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-purple-700 uppercase dark:bg-purple-950/30 dark:text-purple-400">
                            {getCollectionName(continueReadingBook.collectionId)}
                          </span>
                          <h4 className="truncate text-base font-extrabold text-slate-950 dark:text-white">
                            {continueReadingBook.title}
                          </h4>
                          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                            By {continueReadingBook.author}
                          </p>

                          <div className="mt-4 w-full max-w-[280px]">
                            <div className="mb-1.5 flex justify-between text-[9px] font-extrabold text-slate-400 uppercase">
                              <span>{continueReadingBook.progress}% completed</span>
                              <span>
                                Page {continueReadingBook.currentPage} of{' '}
                                {continueReadingBook.totalPages || 320}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="to-indigo-650 h-full rounded-full bg-gradient-to-r from-purple-50 transition-all duration-500"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="dark:border-slate-850 flex w-full shrink-0 flex-col items-stretch gap-3 border-t border-slate-50 pt-4 sm:w-auto sm:items-end sm:border-t-0 sm:pt-0">
                        <Link
                          to={ROUTES.READER.replace(':id', continueReadingBook.id)}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="sm"
                            className="bg-purple-650 w-full rounded-xl font-bold text-white shadow-sm transition-all hover:bg-purple-700"
                            leftIcon={<Play className="h-3.5 w-3.5 fill-current stroke-current" />}
                          >
                            Continue Reading
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border-slate-150 flex h-32 items-center justify-center rounded-3xl border border-dashed bg-white text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      <span>
                        No reading session logged yet. Open a book in My Library to start.
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* 4. READING ACTIVITY WEEKLY GRAPH */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Reading Activity
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center">
                      {/* Left: chart details */}
                      <div className="space-y-2 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Pages Logged
                        </span>
                        <h4 className="font-mono text-3xl font-black text-slate-950 dark:text-white">
                          {totalPagesRead}{' '}
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            Total Pages
                          </span>
                        </h4>
                        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
                          <span>📊 {readingSessionsCount} sessions this week</span>
                          <span>⏱ {readingTimeTodayMins} mins today</span>
                        </div>
                      </div>

                      {/* Right: SVG Bar Chart */}
                      <div className="flex-1">
                        <div className="flex h-28 items-end justify-between gap-2 px-2 pt-4">
                          {weeklyChartData.map((day, idx) => {
                            // Find highest page value to scale relatively
                            const maxVal = Math.max(...weeklyChartData.map((d) => d.value)) || 10
                            const percentHeight = Math.max(8, Math.round((day.value / maxVal) * 80))
                            return (
                              <div
                                key={idx}
                                className="group/bar flex flex-1 flex-col items-center gap-1.5"
                              >
                                <div className="relative flex w-full justify-center">
                                  {/* Tooltip */}
                                  <div className="pointer-events-none absolute -top-8 scale-0 rounded bg-slate-900 px-2 py-1 text-[8px] font-bold text-white shadow-md transition-all group-hover/bar:scale-100">
                                    {day.value} pgs
                                  </div>
                                  <div
                                    className="group-hover/bar:bg-purple-650 w-full max-w-[24px] rounded-t-lg bg-purple-200 transition-all duration-300 dark:bg-purple-950/40"
                                    style={{ height: `${percentHeight}px` }}
                                  />
                                </div>
                                <span className="font-mono text-[9px] font-bold text-slate-400">
                                  {day.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Sidebar Widgets */}
              <div className="space-y-8">
                {/* 6. READING GOALS PROGRESS RING */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Reading Goals
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-5">
                      {/* SVG Progress Ring */}
                      <div className="relative h-20 w-20 shrink-0">
                        <svg className="h-full w-full -rotate-90">
                          {/* Track circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="fill-none stroke-slate-100 dark:stroke-slate-800"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="fill-none stroke-purple-600 transition-all duration-500"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {weeklyGoalPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Goal details */}
                      <div className="min-w-0 flex-1 space-y-2.5 text-left">
                        <div className="space-y-0.5">
                          <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase">
                            Daily Target
                          </span>
                          <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                            {pagesReadToday} / {dailyGoalPages} pages
                          </span>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${dailyGoalPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase">
                            Weekly Target
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                            {weeklyGoalProgress} / {weeklyGoalPages} pgs completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 5. RECENT NOTES */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                      Recent Notes
                    </h3>
                    <Link
                      to={ROUTES.PROFILE}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {latestNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                        <MessageSquare className="mb-2 h-6 w-6 text-slate-300" />
                        <p className="text-[10px] font-bold">No notes written yet</p>
                      </div>
                    ) : (
                      latestNotes.map((note) => (
                        <Link
                          key={note.id}
                          to={`${ROUTES.READER.replace(':id', note.bookId)}?page=${note.pageNumber}`}
                          className="dark:border-slate-850 block rounded-2xl border border-slate-50 bg-slate-50/30 p-3 shadow-2xs transition-all hover:border-purple-300/40 hover:bg-slate-50/50 hover:shadow-xs dark:hover:border-purple-900"
                        >
                          <div className="flex items-center justify-between text-[8px] font-extrabold text-purple-600 uppercase">
                            <span className="max-w-[120px] truncate">
                              {getBookTitle(note.bookId)}
                            </span>
                            <span>Page {note.pageNumber} ↗</span>
                          </div>
                          {note.highlightedText && (
                            <p className="text-slate-650 dark:text-slate-450 mt-1.5 line-clamp-2 border-l-2 border-purple-400 pl-2 text-[10px] italic">
                              "{note.highlightedText}"
                            </p>
                          )}
                          <p className="mt-1 line-clamp-2 text-[10px] font-bold text-slate-800 dark:text-slate-300">
                            {note.noteText || <em className="text-slate-400">Bookmark marker</em>}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* 7. RECENT ACTIVITY TIMELINE */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Recent Activity
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {recentActivities.length > 0 ? (
                      <div className="relative ml-2.5 space-y-6 border-l border-slate-100 pl-5 text-left dark:border-slate-800">
                        {recentActivities.map((act) => {
                          const iconColor =
                            act.type === 'upload'
                              ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/15'
                              : act.type === 'note'
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/15'
                                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15'

                          return (
                            <div key={act.id} className="relative">
                              <span
                                className={`absolute top-0.5 -left-[30px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${iconColor}`}
                              >
                                <Activity className="h-3 w-3 shrink-0" />
                              </span>
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[10px] font-extrabold text-slate-900 dark:text-white">
                                  {act.title}
                                </p>
                                <p className="text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400">
                                  {act.desc}
                                </p>
                                <span className="block font-mono text-[8px] text-slate-400">
                                  {act.time.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  •{' '}
                                  {act.time.toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                        No recent activities recorded.
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Details modal box */}
      <AnimatePresence>
        {previewBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 p-4 font-sans backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between border-b border-slate-50 pb-2.5 dark:border-slate-800">
                <h4 className="text-purple-650 text-xs font-extrabold tracking-widest uppercase">
                  Quick Details
                </h4>
                <button
                  onClick={() => setPreviewBook(null)}
                  className="hover:text-slate-650 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="flex gap-4">
                <img
                  src={previewBook.coverPath}
                  alt={previewBook.title}
                  className="aspect-[0.7/1] w-16 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {previewBook.title}
                  </h5>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    By {previewBook.author}
                  </p>
                  <span className="mt-2 inline-block rounded bg-purple-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-purple-700 uppercase dark:bg-purple-950/20">
                    {getCollectionName(previewBook.collectionId)}
                  </span>
                </div>
              </div>
              <p className="max-h-32 overflow-y-auto font-sans text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {previewBook.description || 'No synopsis provided.'}
              </p>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button size="sm" variant="outline" onClick={() => setPreviewBook(null)}>
                  Close
                </Button>
                <Link
                  to={ROUTES.READER.replace(':id', previewBook.id)}
                  onClick={() => setPreviewBook(null)}
                >
                  <Button
                    size="sm"
                    className="bg-purple-650 rounded-xl text-white shadow-xs hover:bg-purple-700"
                  >
                    Open Reader
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
