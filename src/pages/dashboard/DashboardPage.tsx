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
  Plus,
  Play,
  Star,
  Eye,
  Activity,
  ChevronRight,
  Users,
  Calendar,
  X,
  MessageSquare,
  Search,
  Flame,
  HardDrive,
  Heart,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [previewBook, setPreviewBook] = useState<Book | null>(null)
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [activeNotesTab, setActiveNotesTab] = useState<'all' | 'thoughts' | 'clips' | 'sticky'>(
    'all'
  )

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

  const getBookTitle = (bookId: string) => {
    const found = books.find((b) => b.id === bookId)
    return found ? found.title : 'Book Title'
  }

  const toggleStar = async (id: string) => {
    try {
      const isFav = await booksService.toggleFavorite(id)
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, isFavorite: isFav } : b)))
      if (previewBook && previewBook.id === id) {
        setPreviewBook((prev) => (prev ? { ...prev, isFavorite: isFav } : null))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // --- TOP STATISTICS ---
  const totalBooks = books.length
  const uniqueAuthors = useMemo(() => {
    return new Set(books.map((b) => b.author).filter(Boolean)).size
  }, [books])
  const totalCollections = collectionsList.length

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

  // --- JOURNAL STATISTICS ---
  const notesCount = useMemo(
    () => allNotes.filter((n) => n.noteText && n.noteText.trim()).length,
    [allNotes]
  )
  const highlightsCount = useMemo(
    () => allNotes.filter((n) => n.highlightedText && n.highlightedText.trim()).length,
    [allNotes]
  )
  const bookmarksCount = useMemo(() => allNotes.filter((n) => n.isBookmarked).length, [allNotes])

  // --- CONTINUE READING ---
  const inProgressBooks = useMemo(() => {
    return books.filter((b) => b.progress > 0 && b.progress < 100)
  }, [books])

  const continueReadingBook = useMemo(() => {
    return inProgressBooks[0] || books[0] || null
  }, [inProgressBooks, books])

  // --- RECENTLY ADDED ---
  const recentlyAddedBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [books])

  // --- FAVORITE BOOKS ---
  const favoriteBooks = useMemo(() => {
    return books.filter((b) => b.isFavorite)
  }, [books])

  // --- DYNAMIC RECENT ACTIVITY LOGS ---
  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; desc: string; time: Date }[] = []

    // Map uploads
    books.slice(0, 5).forEach((b) => {
      list.push({
        id: `upload-${b.id}`,
        type: 'upload',
        title: 'New Book Cabinet Upload',
        desc: `"${b.title}" added to ${getCollectionName(b.collectionId)}`,
        time: new Date(b.createdAt),
      })
    })

    // Map in-progress books
    books.forEach((b) => {
      if (b.progress > 0) {
        list.push({
          id: `progress-${b.id}`,
          type: 'progress',
          title: 'Reading Progress Logged',
          desc: `Reached page ${b.currentPage} (${b.progress}%) of "${b.title}"`,
          time: new Date(b.lastReadAt || b.updatedAt || b.createdAt),
        })
      }
    })

    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5)
  }, [books, getCollectionName])

  // --- HERO GOAL CALCULATIONS ---
  const totalPagesRead = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.progress > 0 ? b.currentPage : 0), 0)
  }, [books])
  const weeklyGoalTarget = 100
  const weeklyGoalProgress = totalPagesRead % 100
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalTarget) * 100))

  const motivationalQuote = useMemo(() => {
    if (books.length === 0) {
      return 'The journey of a lifetime starts with a single page. Upload a book to begin.'
    }
    if (inProgressBooks.length > 0) {
      return 'Consistency is key. You are making great progress in your current book!'
    }
    return 'Reading is to the mind what exercise is to the body. Keep feeding your curiosity!'
  }, [books.length, inProgressBooks.length])

  // --- 5 HIGH-FIDELITY STATS CARDS ---
  const totalStorageBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.fileSize || 0), 0)
  }, [books])

  const statsList = useMemo(() => {
    return [
      {
        title: 'Total Books',
        value: String(totalBooks),
        sub: 'books uploaded',
        icon: BookOpen,
        color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/10',
        gradient: 'from-purple-500/5 to-indigo-500/5 dark:from-purple-950/20 dark:to-indigo-950/10',
        borderColor: 'group-hover:border-purple-500/30',
        accentGlow: 'bg-purple-500/20',
      },
      {
        title: 'Total Authors',
        value: String(uniqueAuthors),
        sub: 'unique authors',
        icon: Users,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10',
        gradient: 'from-blue-500/5 to-cyan-500/5 dark:from-blue-950/20 dark:to-cyan-950/10',
        borderColor: 'group-hover:border-blue-500/30',
        accentGlow: 'bg-blue-500/20',
      },
      {
        title: 'Collections',
        value: String(totalCollections),
        sub: 'bookshelves',
        icon: FolderOpen,
        color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10',
        gradient: 'from-indigo-500/5 to-violet-500/5 dark:from-indigo-950/20 dark:to-violet-950/10',
        borderColor: 'group-hover:border-indigo-500/30',
        accentGlow: 'bg-indigo-500/20',
      },
      {
        title: 'Storage Used',
        value: formatBytes(totalStorageBytes),
        sub: 'of 1 GB limit',
        icon: HardDrive,
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/10',
        gradient: 'from-rose-500/5 to-orange-500/5 dark:from-rose-950/20 dark:to-orange-950/10',
        borderColor: 'group-hover:border-rose-500/30',
        accentGlow: 'bg-rose-500/20',
      },
      {
        title: 'Favorites',
        value: String(favoriteBooks.length),
        sub: 'starred volumes',
        icon: Heart,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10',
        gradient: 'from-amber-500/5 to-yellow-500/5 dark:from-amber-950/20 dark:to-yellow-950/10',
        borderColor: 'group-hover:border-amber-500/30',
        accentGlow: 'bg-amber-500/20',
      },
    ]
  }, [totalBooks, uniqueAuthors, totalCollections, totalStorageBytes, favoriteBooks.length])

  // --- FILTERED CATEGORIZED PERSONAL NOTES ---
  const categorizedNotes = useMemo(() => {
    let list = allNotes
    if (activeNotesTab === 'thoughts') {
      list = allNotes.filter((n) => n.noteText && n.noteText.trim() && !n.xPosition && !n.yPosition)
    } else if (activeNotesTab === 'clips') {
      list = allNotes.filter((n) => n.highlightedText && n.highlightedText.trim())
    } else if (activeNotesTab === 'sticky') {
      list = allNotes.filter((n) => n.xPosition !== null && n.xPosition !== undefined)
    }

    if (globalSearchQuery.trim()) {
      const query = globalSearchQuery.toLowerCase()
      list = list.filter((n) => {
        return (
          n.noteText.toLowerCase().includes(query) ||
          (n.highlightedText && n.highlightedText.toLowerCase().includes(query)) ||
          n.tags.some((t) => t.toLowerCase().includes(query))
        )
      })
    }
    return list.slice(0, 5)
  }, [allNotes, activeNotesTab, globalSearchQuery])

  // Animation variants
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
        ) : books.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Your Shelf is Empty
              </h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                You haven't uploaded any books to Librovia yet. Get started by dragging your PDFs
                into the upload tab.
              </p>
            </div>
            <Link to={ROUTES.UPLOAD} className="inline-block">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload Your First Book</Button>
            </Link>
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

                {/* Stat Badges inside Hero Banner */}
                <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0">
                  {/* Streak Widget */}
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

                  {/* Today progress */}
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-2.5 backdrop-blur-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-400">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase">
                        Read Today
                      </span>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {pagesReadToday} {pagesReadToday === 1 ? 'pg' : 'pgs'}
                      </span>
                    </div>
                  </div>

                  {/* Goal completion */}
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 backdrop-blur-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase">
                        <span>Weekly Target</span>
                        <span className="font-mono text-white">
                          {weeklyGoalProgress}/{weeklyGoalTarget} pgs
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

            {/* 2. STATS CARDS GRID - 5 HIGH-FIDELITY SaaS CARDS */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
              {statsList.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Subtle corner glow */}
                  <div
                    className={`absolute -top-10 -right-10 h-20 w-20 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 ${stat.accentGlow}`}
                  />

                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${stat.color}`}
                    >
                      <stat.icon className="h-4.5 w-4.5 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-4 text-left">
                    <h3 className="font-mono text-2xl leading-none font-black tracking-tight text-slate-950 dark:text-white">
                      {stat.value}
                    </h3>
                    <p className="mt-2 truncate text-[9px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* MAIN DASHBOARD BLOCK */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left & Center Main content */}
              <div className="space-y-8 lg:col-span-2">
                {/* 3. CONTINUE READING SECTION */}
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
                                {continueReadingBook.totalPages - continueReadingBook.currentPage}{' '}
                                pages left
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="to-indigo-650 h-full rounded-full bg-gradient-to-r from-purple-500 transition-all duration-500"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="dark:border-slate-850 flex w-full shrink-0 flex-col items-stretch gap-3 border-t border-slate-50 pt-4 sm:w-auto sm:items-end sm:border-t-0 sm:pt-0">
                        <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase sm:block">
                          Last read{' '}
                          {continueReadingBook.lastReadAt
                            ? new Date(continueReadingBook.lastReadAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'recently'}
                        </span>
                        <Link
                          to={ROUTES.READER.replace(':id', continueReadingBook.id)}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-purple-600 font-bold text-white shadow-sm transition-all hover:bg-purple-700"
                            leftIcon={<Play className="h-3.5 w-3.5 fill-current stroke-current" />}
                          >
                            Continue Session
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border-slate-150 flex h-32 items-center justify-center rounded-3xl border border-dashed bg-white text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      <span>No books in progress. Open a volume in My Library to start.</span>
                    </div>
                  )}
                </motion.div>

                {/* RECENTLY ADDED CABINETS */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                      Recently Uploaded
                    </h3>
                    <Link
                      to={ROUTES.LIBRARY}
                      className="flex items-center gap-0.5 text-xs font-bold text-purple-600 hover:text-purple-700"
                    >
                      <span>Explore Library</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {recentlyAddedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="group flex h-32 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex min-w-0 flex-1 gap-4">
                          <img
                            src={book.coverPath}
                            alt={book.title}
                            className="aspect-[0.7/1] w-14 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs transition-transform duration-300 group-hover:scale-105 dark:border-slate-800"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                              {getCollectionName(book.collectionId)}
                            </span>
                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {book.title}
                            </h4>
                            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                              By {book.author}
                            </p>
                            <span className="block flex items-center gap-1 pt-1 text-[8px] font-semibold text-slate-400">
                              <Calendar className="h-3 w-3 shrink-0" />
                              Uploaded{' '}
                              {new Date(book.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="dark:border-slate-850 flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4">
                          <button
                            onClick={() => toggleStar(book.id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-amber-500 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <Star
                              className={`h-4 w-4 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`}
                            />
                          </button>

                          <div className="flex gap-1">
                            <button
                              onClick={() => setPreviewBook(book)}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                              title="Quick Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <Link to={ROUTES.READER.replace(':id', book.id)}>
                              <button className="bg-purple-650 flex h-7 cursor-pointer items-center rounded-lg px-2.5 text-[9px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-purple-700">
                                Open
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* FAVORITES SHELF */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Favorite Books
                  </h3>

                  {favoriteBooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {favoriteBooks.map((book) => (
                        <div
                          key={book.id}
                          className="group flex h-32 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex min-w-0 flex-1 gap-4">
                            <img
                              src={book.coverPath}
                              alt={book.title}
                              className="aspect-[0.7/1] w-14 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs transition-transform duration-300 group-hover:scale-105 dark:border-slate-800"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                                {getCollectionName(book.collectionId)}
                              </span>
                              <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                {book.title}
                              </h4>
                              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                By {book.author}
                              </p>
                              <div className="flex items-center gap-1.5 pt-1">
                                <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                  <div
                                    className="h-full rounded-full bg-purple-600"
                                    style={{ width: `${book.progress}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-semibold text-slate-400">
                                  {book.progress}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="dark:border-slate-850 flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4">
                            <button
                              onClick={() => toggleStar(book.id)}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-amber-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                              title="Unfavorite"
                            >
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            </button>

                            <div className="flex gap-1">
                              <button
                                onClick={() => setPreviewBook(book)}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                title="Quick Preview"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <Link to={ROUTES.READER.replace(':id', book.id)}>
                                <button className="flex h-7 cursor-pointer items-center rounded-lg bg-purple-600 px-2.5 text-[9px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-purple-700">
                                  Open
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-white text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                      <span>
                        No favorites starred yet. Star books in library to list them here.
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Sidebar Widget Columns */}
              <div className="space-y-8">
                {/* 5. QUICK INSIGHTS WIDGET */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Quick Insights
                  </h3>
                  <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {/* Insights list */}
                    <div className="space-y-3.5 font-sans text-xs">
                      {/* Pages read today */}
                      <div className="dark:border-slate-850 flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <span className="dark:text-slate-350 font-bold text-slate-700">
                            Pages Today
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {pagesReadToday} / 20 pgs
                        </span>
                      </div>

                      {/* Reading time */}
                      <div className="dark:border-slate-850 flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className="dark:text-slate-350 font-bold text-slate-700">
                            Reading Duration
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {readingTimeTodayMins} mins
                        </span>
                      </div>

                      {/* Current streak */}
                      <div className="dark:border-slate-850 flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                            <Flame className="h-4 w-4" />
                          </div>
                          <span className="dark:text-slate-350 font-bold text-slate-700">
                            Consecutive Days
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {readingStreak} {readingStreak === 1 ? 'day' : 'days'}
                        </span>
                      </div>

                      {/* Goal completion */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <span className="dark:text-slate-350 font-bold text-slate-700">
                            Weekly Completion
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                          {weeklyGoalPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 4. REDESIGNED PERSONAL NOTES WIDGET */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-xs font-extrabold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                    Personal Notes
                  </h3>

                  <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {/* Tab Switcher */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-1 dark:bg-slate-800">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'thoughts', label: 'Thoughts' },
                        { id: 'clips', label: 'Clips' },
                        { id: 'sticky', label: 'Sticky' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() =>
                            setActiveNotesTab(tab.id as 'all' | 'thoughts' | 'clips' | 'sticky')
                          }
                          className={`flex-1 cursor-pointer rounded-lg py-1.5 text-[9px] font-extrabold tracking-wider uppercase transition-colors ${
                            activeNotesTab === tab.id
                              ? 'text-purple-650 bg-white shadow-xs dark:bg-slate-900'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Stats metrics summary */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="rounded-xl bg-purple-50/50 p-2 dark:bg-purple-950/10">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Notes
                        </span>
                        <span className="font-mono font-extrabold text-purple-600">
                          {notesCount}
                        </span>
                      </div>
                      <div className="rounded-xl bg-sky-50/50 p-2 dark:bg-sky-950/10">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Clips
                        </span>
                        <span className="font-mono font-extrabold text-sky-600">
                          {highlightsCount}
                        </span>
                      </div>
                      <div className="rounded-xl bg-amber-50/50 p-2 dark:bg-amber-950/10">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Saves
                        </span>
                        <span className="font-mono font-extrabold text-amber-600">
                          {bookmarksCount}
                        </span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search current list..."
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                      />
                    </div>

                    {/* Notes listing */}
                    <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
                      {categorizedNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                          <MessageSquare className="mb-2 h-7 w-7 text-slate-300" />
                          <p className="text-[10px] font-semibold">No matching insights found.</p>
                          <p className="mt-1 max-w-[160px] text-[8px] leading-relaxed text-slate-400">
                            Open a PDF book to highlight content or jot down insights.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {categorizedNotes.map((note) => {
                            const isSticky = note.xPosition !== null && note.xPosition !== undefined
                            const isHighlight = note.highlightedText && !note.noteText
                            return (
                              <Link
                                key={note.id}
                                to={`${ROUTES.READER.replace(':id', note.bookId)}?page=${note.pageNumber}`}
                                className="dark:border-slate-850 block rounded-2xl border border-slate-50 bg-slate-50/20 p-3 shadow-2xs transition-all hover:border-purple-300/40 hover:bg-slate-50/50 hover:shadow-xs dark:hover:border-purple-900"
                              >
                                <div className="flex items-center justify-between text-[8px] font-extrabold text-purple-600 uppercase">
                                  <span className="max-w-[120px] truncate">
                                    {getBookTitle(note.bookId)}
                                  </span>
                                  <span className="flex items-center gap-1 rounded-md bg-purple-50/60 px-1.5 py-0.5 dark:bg-purple-950/30">
                                    {isSticky ? '📌' : isHighlight ? '🖍' : '📝'} Page{' '}
                                    {note.pageNumber}
                                  </span>
                                </div>
                                {note.highlightedText && (
                                  <p className="mt-2 line-clamp-2 border-l-2 border-purple-400 pl-2 text-[10px] text-slate-600 italic dark:text-slate-400">
                                    "{note.highlightedText}"
                                  </p>
                                )}
                                {note.noteText && (
                                  <p className="text-slate-750 dark:text-slate-350 mt-1.5 line-clamp-2 text-[10px] font-bold">
                                    {note.noteText}
                                  </p>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ACTIVITY LOG timeline */}
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
