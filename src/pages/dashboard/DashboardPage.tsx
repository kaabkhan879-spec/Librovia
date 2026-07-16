import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notesService, type Note } from '../../services/notes'
import { useAuth } from '../../context/AuthContext'
import {
  BookOpen,
  FolderOpen,
  Play,
  Activity,
  Users,
  X,
  MessageSquare,
  Flame,
  Sparkles,
  Award,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { PageWrapper } from '../../components/common/PageWrapper'

// Defined outside of the component to prevent useMemo dependency warnings
const quotesList = [
  {
    text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
    author: 'George R.R. Martin',
  },
  {
    text: 'Reading is essential for those who seek to rise above the ordinary.',
    author: 'Jim Rohn',
  },
  {
    text: 'Show me a family of readers, and I will show you the people who move the world.',
    author: 'Napoleon Bonaparte',
  },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  {
    text: 'The more that you read, the more things you will know. The more that you learn, the more places you will go.',
    author: 'Dr. Seuss',
  },
  {
    text: 'I have always imagined that Paradise will be a kind of library.',
    author: 'Jorge Luis Borges',
  },
  { text: 'Today a reader, tomorrow a leader.', author: 'Margaret Fuller' },
]

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

  // --- DYNAMIC GREETING ---
  const { dynamicGreeting, greetingIcon } = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return { dynamicGreeting: 'Good morning', greetingIcon: '🌅' }
    } else if (hour >= 12 && hour < 17) {
      return { dynamicGreeting: 'Good afternoon', greetingIcon: '☀️' }
    } else if (hour >= 17 && hour < 22) {
      return { dynamicGreeting: 'Good evening', greetingIcon: '🌇' }
    } else {
      return { dynamicGreeting: 'Good night', greetingIcon: '🌙' }
    }
  }, [])

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


  // --- CONTINUE READING (Show only ONE book) ---
  const continueReadingBook = useMemo(() => {
    const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100)
    if (inProgress.length > 0) {
      return inProgress.sort((a, b) => {
        const timeA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0
        const timeB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0
        return timeB - timeA
      })[0]
    }
    return books[0] || null
  }, [books])

  // Estimated pages & minutes remaining
  const pagesRemaining = useMemo(() => {
    if (!continueReadingBook) return 0
    return Math.max(0, continueReadingBook.totalPages - continueReadingBook.currentPage)
  }, [continueReadingBook])

  const minutesRemaining = useMemo(() => {
    return Math.round(pagesRemaining * 1.2)
  }, [pagesRemaining])

  const estTimeStr = useMemo(() => {
    if (minutesRemaining <= 0) return '0 mins remaining'
    if (minutesRemaining >= 60) {
      const hrs = Math.floor(minutesRemaining / 60)
      const mins = minutesRemaining % 60
      return `${hrs}h ${mins}m remaining`
    }
    return `${minutesRemaining} mins remaining`
  }, [minutesRemaining])

  // --- RECENT NOTES (latest 3 notes) ---
  const latestNotes = useMemo(() => {
    return [...allNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [allNotes])

  // --- DYNAMIC RECENT ACTIVITY LOGS ---
  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; desc: string; time: Date }[] = []

    books.slice(0, 3).forEach((b) => {
      list.push({
        id: `upload-${b.id}`,
        type: 'upload',
        title: 'Book Uploaded',
        desc: `"${b.title}" added to library.`,
        time: new Date(b.createdAt),
      })
    })

    allNotes.slice(0, 3).forEach((n) => {
      list.push({
        id: `note-${n.id}`,
        type: 'note',
        title: 'Note Added',
        desc: `Added annotation on page ${n.pageNumber} of "${getBookTitle(n.bookId)}".`,
        time: new Date(n.createdAt),
      })
    })

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

  // --- GOALS PROGRESS RING ---
  const dailyGoalPages = 20
  const dailyGoalPercent = Math.min(100, Math.round((pagesReadToday / dailyGoalPages) * 100))

  const weeklyGoalPages = 100
  const weeklyGoalProgress = totalPagesRead % 100
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalPages) * 100))

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (weeklyGoalPercent / 100) * circumference

  const statsList = useMemo(() => {
    return [
      {
        title: 'Total Books',
        value: String(books.length),
        sub: 'volumes on shelves',
        trend: '+1 this week',
        icon: BookOpen,
        color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/20',
      },
      {
        title: 'Total Authors',
        value: String(new Set(books.map((b) => b.author).filter(Boolean)).size),
        sub: 'unique writers',
        trend: 'Optimal',
        icon: Users,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      },
      {
        title: 'Collections',
        value: String(collectionsList.length),
        sub: 'index tags',
        trend: 'Structured',
        icon: FolderOpen,
        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20',
      },
    ]
  }, [books, collectionsList])


  const quoteOfTheDay = useMemo(() => {
    const day = new Date().getDay()
    return quotesList[day]
  }, [])

  // Animation variants
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
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  } as const

  return (
    <PageWrapper className="space-y-12 bg-[#F6F8FC] pb-16 text-left select-none dark:bg-slate-950/10">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {/* Hero Banner Skeleton */}
            <div className="relative overflow-hidden rounded-[28px] bg-slate-100 dark:bg-slate-900/60 p-6 sm:p-8 h-48 flex items-center justify-between">
              <div className="space-y-3.5 w-1/2">
                <div className="h-3 w-20 rounded-lg shimmer-placeholder" />
                <div className="h-8 w-60 rounded-xl shimmer-placeholder" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded-full shimmer-placeholder" />
                  <div className="h-5 w-20 rounded-full shimmer-placeholder" />
                </div>
              </div>
              <div className="h-10 w-32 rounded-xl shimmer-placeholder hidden sm:block" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-100 bg-white p-5 h-28 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 rounded shimmer-placeholder" />
                    <div className="h-8 w-8 rounded-xl shimmer-placeholder" />
                  </div>
                  <div className="h-7 w-12 rounded-lg shimmer-placeholder" />
                </div>
              ))}
            </div>

            {/* Bottom Grid Columns Skeleton */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Column Skeletons */}
              <div className="space-y-8 lg:col-span-2">
                {/* Continue Reading */}
                <div className="space-y-4">
                  <div className="h-4 w-28 rounded shimmer-placeholder" />
                  <div className="rounded-3xl border border-slate-100 bg-white p-6 h-36 flex gap-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-full aspect-[0.7/1] rounded-xl shimmer-placeholder shrink-0" />
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-2">
                        <div className="h-4 w-40 rounded shimmer-placeholder" />
                        <div className="h-3.5 w-24 rounded shimmer-placeholder" />
                      </div>
                      <div className="h-6 w-32 rounded-lg shimmer-placeholder" />
                    </div>
                  </div>
                </div>

                {/* Quote of the Day */}
                <div className="rounded-3xl border border-slate-100 bg-white/40 p-6 h-24 flex flex-col items-center justify-center gap-2.5 dark:border-slate-800/40">
                  <div className="h-3 w-3/4 rounded shimmer-placeholder" />
                  <div className="h-2.5 w-1/4 rounded shimmer-placeholder" />
                </div>
              </div>

              {/* Right Column Skeletons */}
              <div className="space-y-8">
                {/* Reading Goals */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 h-48 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                  <div className="h-4 w-24 rounded shimmer-placeholder" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded shimmer-placeholder" />
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded shimmer-placeholder" />
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>

                {/* Recent Notes */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 h-56 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                  <div className="h-4 w-24 rounded shimmer-placeholder" />
                  <div className="space-y-3">
                    <div className="h-3.5 w-full rounded shimmer-placeholder" />
                    <div className="h-3.5 w-5/6 rounded shimmer-placeholder" />
                    <div className="h-3.5 w-4/5 rounded shimmer-placeholder" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            {/* ==================================================
                SECTION 1: PREMIUM HERO
                ================================================== */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-purple-900/60 via-indigo-950/70 to-slate-900/60 p-8 text-white shadow-2xl backdrop-blur-xl sm:p-10"
            >
              {/* Glowing animated background blobs */}
              <motion.div
                animate={{
                  x: [0, 15, -10, 0],
                  y: [0, -20, 15, 0],
                  scale: [1, 1.1, 0.95, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"
              />
              <motion.div
                animate={{
                  x: [0, -15, 10, 0],
                  y: [0, 20, -15, 0],
                  scale: [1, 0.9, 1.05, 1],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-widest text-purple-300 uppercase">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      Workspace Home
                    </span>
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl flex items-center gap-3">
                      <span className="animate-pulse">{greetingIcon}</span>
                      <span>{dynamicGreeting}, {user?.displayName || 'Reader'}</span>
                    </h1>
                  </div>

                  {/* Inline micro-progress badges */}
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[9.5px] font-bold text-white backdrop-blur-md">
                      <Flame className="h-3 w-3 fill-orange-400 text-orange-400" />
                      {readingStreak} {readingStreak === 1 ? 'day' : 'days'} streak
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[9.5px] font-bold text-white backdrop-blur-md">
                      <Award className="h-3 w-3 text-purple-300" />
                      {weeklyGoalPercent}% weekly goal
                    </span>
                  </div>

                  <p className="max-w-xl text-xs leading-relaxed text-slate-300 italic">
                    "Consistent reading habits compound knowledge. You're building a world-class
                    digital shelf."
                  </p>
                </div>

                {/* Single Primary Action: Continue Reading */}
                {continueReadingBook && (
                  <div className="shrink-0 text-left">
                    <Link to={ROUTES.READER.replace(':id', continueReadingBook.id)}>
                      <Button
                        size="md"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-bold text-indigo-950 shadow-lg transition-all hover:bg-slate-100"
                        leftIcon={<Play className="h-3.5 w-3.5 fill-current stroke-current" />}
                      >
                        Continue Reading
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ==================================================
                SECTION 2: QUICK STATISTICS (6 CARDS)
                ================================================== */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              {statsList.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="group premium-card relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <stat.icon className="h-4 w-4 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-left">
                    <h3 className="font-mono text-xl leading-none font-black tracking-tight text-slate-950 dark:text-white">
                      {stat.value}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[8px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                        {stat.sub}
                      </p>
                      <span className="text-purple-650 shrink-0 rounded-full bg-purple-50 px-1.5 py-0.5 text-[7px] font-extrabold uppercase dark:bg-purple-950/20">
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* MAIN WORKSPACE GRID LAYOUT */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Column (col-span-2) */}
              <div className="space-y-8 lg:col-span-2">
                {/* ==================================================
                    SECTION 3: CONTINUE READING
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Continue Reading
                  </h3>

                  {continueReadingBook ? (
                    <div className="group premium-card relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-100/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70 md:flex-row md:items-center gap-6">
                      <div className="flex min-w-0 flex-1 items-start gap-6">
                        <div className="relative shrink-0">
                          <img
                            src={continueReadingBook.coverPath}
                            alt={continueReadingBook.title}
                            className="aspect-[0.7/1] w-28 rounded-2xl border border-slate-200/60 object-cover shadow-lg transition-all duration-300 group-hover:scale-[1.04] group-hover:-rotate-1 dark:border-slate-800/60"
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-inner" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-purple-750 inline-block rounded bg-purple-50 px-2.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase dark:bg-purple-950/30 dark:text-purple-400">
                              {getCollectionName(continueReadingBook.collectionId)}
                            </span>
                            {continueReadingBook.lastReadAt && (
                              <span className="text-[9px] text-slate-400 font-semibold">
                                Opened {new Date(continueReadingBook.lastReadAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <h4 className="truncate text-lg font-black tracking-tight text-slate-950 dark:text-white">
                            {continueReadingBook.title}
                          </h4>
                          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                            By {continueReadingBook.author}
                          </p>

                          <div className="mt-4 w-full max-w-[320px] space-y-1.5">
                            <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase">
                              <span>{continueReadingBook.progress}% completed</span>
                              <span>
                                Page {continueReadingBook.currentPage} of{' '}
                                {continueReadingBook.totalPages || 320}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="progress-bar-fill to-indigo-650 h-full rounded-full bg-gradient-to-r from-purple-500"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                            <p className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <span>⏱</span>
                              <span>{pagesRemaining} pages remaining • approx. {estTimeStr}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="dark:border-slate-850 flex w-full shrink-0 flex-col items-stretch gap-3 border-t border-slate-50 pt-4 sm:w-auto sm:items-end sm:border-t-0 sm:pt-0">
                        <Link
                          to={ROUTES.READER.replace(':id', continueReadingBook.id)}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="md"
                            className="bg-purple-650 w-full rounded-2xl font-bold text-white shadow-md hover:bg-purple-700 sm:w-auto"
                            leftIcon={<Play className="h-4 w-4 fill-current stroke-current" />}
                          >
                            Resume Study
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border-slate-150 flex h-36 items-center justify-center rounded-3xl border border-dashed bg-white text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      <span>
                        No reading session logged yet. Open a book in My Library to start.
                      </span>
                    </div>
                  )}
                </motion.div>
                {/* ==================================================
                    SECTION 9: QUOTE OF THE DAY
                    ================================================== */}
                <motion.div variants={itemVariants} className="pt-2">
                  <div className="dark:border-slate-850 rounded-3xl border border-slate-100 bg-white/40 p-6 text-center dark:bg-slate-900/30">
                    <p className="mx-auto max-w-lg font-serif text-sm leading-relaxed text-slate-700 italic dark:text-slate-300">
                      "{quoteOfTheDay.text}"
                    </p>
                    <span className="mt-3 block text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                      — {quoteOfTheDay.author}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Right Sidebar Column */}
              <div className="space-y-8">
                {/* ==================================================
                    SECTION 6: READING GOALS
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Reading Goals
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-5">
                      {/* SVG Progress Ring */}
                      <div className="relative h-20 w-20 shrink-0">
                        <svg className="h-full w-full -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="fill-none stroke-slate-100 dark:stroke-slate-800"
                            strokeWidth="7"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="fill-none stroke-purple-600 transition-all duration-500"
                            strokeWidth="7"
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
                            Daily Goal Progress
                          </span>
                          <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
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
                            Weekly Goal Progress
                          </span>
                          <span className="text-slate-650 font-mono text-[10px] font-bold dark:text-slate-400">
                            {weeklyGoalProgress} / {weeklyGoalPages} pages read
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ==================================================
                    SECTION 5: RECENT NOTES
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                      Recent Notes
                    </h3>
                    <Link
                      to={ROUTES.NOTES}
                      className="hover:text-purple-750 text-[10px] font-extrabold tracking-wider text-purple-600 uppercase"
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
                          <div className="text-purple-650 flex items-center justify-between text-[8px] font-extrabold uppercase">
                            <span className="max-w-[120px] truncate">
                              {getBookTitle(note.bookId)}
                            </span>
                            <span>Page {note.pageNumber} ↗</span>
                          </div>
                          {note.highlightedText && (
                            <p className="text-slate-650 dark:text-slate-450 mt-1.5 line-clamp-2 border-l-2 border-purple-400 pl-2 text-[9px] italic">
                              "{note.highlightedText}"
                            </p>
                          )}
                          <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-slate-800 dark:text-slate-300">
                            {note.noteText || <em className="text-slate-455">Bookmark marker</em>}
                          </p>
                          <span className="block pt-1 text-right text-[7px] font-semibold text-slate-400">
                            {new Date(note.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* ==================================================
                    SECTION 7: ACTIVITY TIMELINE
                    ================================================== */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Activity Timeline
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {recentActivities.length > 0 ? (
                      <div className="dark:border-slate-850 relative ml-2.5 space-y-6 border-l border-slate-100 pl-5 text-left">
                        {recentActivities.map((act) => {
                          const iconColor =
                            act.type === 'upload'
                              ? 'text-purple-650 bg-purple-50 dark:bg-purple-950/20'
                              : act.type === 'note'
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
                                : 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20'

                          return (
                            <div key={act.id} className="relative">
                              <span
                                className={`absolute top-0.5 -left-[30px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${iconColor}`}
                              >
                                <Activity className="h-3 w-3 shrink-0" />
                              </span>
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-[10px] leading-tight font-extrabold text-slate-900 dark:text-white">
                                  {act.title}
                                </p>
                                <p className="text-[9.5px] leading-tight font-semibold text-slate-500 dark:text-slate-400">
                                  {act.desc}
                                </p>
                                <span className="text-slate-450 block pt-0.5 font-mono text-[8px]">
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
                <h4 className="purple-650 text-xs font-extrabold tracking-widest uppercase">
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
                  <span className="text-purple-750 mt-2 inline-block rounded bg-purple-50 px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase dark:bg-purple-950/20">
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
    </PageWrapper>
  )
}
