import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { useAuth } from '../../context/AuthContext'
import {
  BookOpen,
  Flame,
  FolderOpen,
  Plus,
  Play,
  Star,
  Eye,
  ChevronRight,
  BookMarked,
  Sparkles,
  Info,
  Users,
  Clock,
  Bookmark,
  Calendar,
  Layers,
  Award,
  Cloud,
  X,
  TrendingUp,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { formatBytes } from '../../utils/helpers'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [previewBook, setPreviewBook] = useState<Book | null>(null)
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])

  const fetchBooks = () => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()]).then(
      ([booksData, colsData]) => {
        setBooks(booksData)
        setCollectionsList(colsData)
        setLoading(false)
      }
    )
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const getCollectionName = (colId: string | undefined) => {
    const col = collectionsList.find((c) => c.id === colId)
    return col ? col.name : 'Classics'
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

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // --- STATS CALCULATIONS ---
  const totalBooks = books.length

  const uniqueAuthors = useMemo(() => {
    return new Set(books.map((b) => b.author).filter(Boolean)).size
  }, [books])

  const totalCollections = collectionsList.length

  const totalStorageBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + b.fileSize, 0)
  }, [books])

  const totalStorage = useMemo(() => {
    return formatBytes(totalStorageBytes)
  }, [totalStorageBytes])

  const storagePercentage = useMemo(() => {
    // assume 1GB limit (1,000,000,000 bytes)
    const limit = 1000000000
    return Math.min(100, Math.round((totalStorageBytes / limit) * 100))
  }, [totalStorageBytes])

  const currentlyReading = books.filter((b) => b.progress > 0 && b.progress < 100).length
  const completedBooks = books.filter((b) => b.progress === 100).length
  const favoritesCount = books.filter((b) => b.isFavorite).length

  const totalPagesRead = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.progress > 0 ? b.currentPage : 0), 0)
  }, [books])

  const readingTimeStr = useMemo(() => {
    const minutes = totalPagesRead * 2 // 2 minutes per page
    if (minutes >= 60) {
      const hours = Math.round((minutes / 60) * 10) / 10
      return `${hours} hrs`
    }
    return `${minutes} mins`
  }, [totalPagesRead])

  // --- HERO GOAL CALCULATIONS ---
  const weeklyGoalTarget = 100
  const weeklyGoalProgress = totalPagesRead % 100
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyGoalProgress / weeklyGoalTarget) * 100))

  const motivationalQuote = useMemo(() => {
    if (books.length === 0) {
      return 'The journey of a lifetime starts with a single page. Upload a book to begin.'
    }
    if (currentlyReading > 0) {
      return 'Consistency is key. You are making great progress in your current book!'
    }
    return 'Read is to the mind what exercise is to the body. Keep feeding your curiosity!'
  }, [books.length, currentlyReading])

  // --- INSIGHTS CALCULATIONS ---
  const mostReadAuthor = useMemo(() => {
    if (books.length === 0) return 'None'
    const authorCounts: Record<string, number> = {}
    books.forEach((b) => {
      if (b.author) {
        authorCounts[b.author] = (authorCounts[b.author] || 0) + 1
      }
    })
    let maxAuthor = 'None'
    let maxCount = 0
    Object.entries(authorCounts).forEach(([auth, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxAuthor = auth
      }
    })
    return maxAuthor
  }, [books])

  const largestCollection = useMemo(() => {
    if (collectionsList.length === 0) return 'None'
    let maxColName = 'None'
    let maxCount = -1
    collectionsList.forEach((col) => {
      const count = books.filter((b) => b.collectionId === col.id).length
      if (count > maxCount) {
        maxCount = count
        maxColName = col.name
      }
    })
    return maxColName !== 'None' && maxCount > 0 ? `${maxColName} (${maxCount} books)` : 'None'
  }, [collectionsList, books])

  const longestBook = useMemo(() => {
    if (books.length === 0) return 'None'
    const longest = [...books].sort((a, b) => b.totalPages - a.totalPages)[0]
    return longest ? `${longest.title} (${longest.totalPages} pages)` : 'None'
  }, [books])

  const recentlyAddedBook = useMemo(() => {
    if (books.length === 0) return 'None'
    const sorted = [...books].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    return sorted ? sorted.title : 'None'
  }, [books])

  const favoriteCollection = useMemo(() => {
    if (collectionsList.length === 0) return 'None'
    const favBooks = books.filter((b) => b.isFavorite)
    if (favBooks.length === 0) return 'None'
    let maxColName = 'None'
    let maxCount = 0
    collectionsList.forEach((col) => {
      const count = favBooks.filter((b) => b.collectionId === col.id).length
      if (count > maxCount) {
        maxCount = count
        maxColName = col.name
      }
    })
    return maxColName !== 'None' && maxCount > 0 ? maxColName : 'None'
  }, [collectionsList, books])

  const avgReadingSession = useMemo(() => {
    return books.length > 0 ? '45 mins' : '0 mins'
  }, [books])

  const booksAddedThisMonth = useMemo(() => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    return books.filter((b) => new Date(b.createdAt).getTime() >= startOfMonth.getTime()).length
  }, [books])

  const recentBooks = useMemo(() => {
    return [...books].slice(0, 4)
  }, [books])

  const continueReadingBook = useMemo(() => {
    const inProgress = books.find((b) => b.progress > 0 && b.progress < 100)
    return inProgress || books[0] || null
  }, [books])

  const collectionsData = useMemo(() => {
    const gradients = [
      'from-purple-500 to-indigo-600',
      'from-fuchsia-500 to-pink-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
    ]
    return collectionsList.map((col, idx) => {
      const count = books.filter((b) => b.collectionId === col.id).length
      const firstBook = books.find((b) => b.collectionId === col.id)
      return {
        id: col.id,
        name: col.name,
        count: count,
        cover: firstBook?.coverPath || null,
        color: gradients[idx % gradients.length],
      }
    })
  }, [collectionsList, books])

  // --- STATS CONFIGURATION ---
  const statsList = [
    {
      title: 'Total Books',
      value: String(totalBooks),
      sub: 'books uploaded',
      icon: BookOpen,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/10',
    },
    {
      title: 'Total Authors',
      value: String(uniqueAuthors),
      sub: 'unique authors',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10',
    },
    {
      title: 'Collections',
      value: String(totalCollections),
      sub: 'total collections',
      icon: FolderOpen,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10',
    },
    {
      title: 'Storage Used',
      value: totalStorage,
      sub: `${storagePercentage}% of 1 GB`,
      icon: Cloud,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/10',
      isStorage: true,
    },
    {
      title: 'Reading Streak',
      value: '2 days',
      sub: 'active streak',
      icon: Flame,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/10',
    },
    {
      title: 'Total Pages',
      value: String(totalPagesRead),
      sub: 'pages logged',
      icon: BookMarked,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10',
    },
    {
      title: 'Reading Time',
      value: readingTimeStr,
      sub: 'est. hours read',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10',
    },
    {
      title: 'Favorite Books',
      value: String(favoritesCount),
      sub: 'starred books',
      icon: Star,
      color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/10',
    },
  ]

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
    <div className="space-y-8 text-left select-none">
      {/* Simulation Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="h-4.5 w-4.5 shrink-0 text-purple-600" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts.</span>
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
            {isEmptyState ? 'Show Real Dashboard' : 'Show Empty States'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSkeletonLoading || loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-28 animate-pulse flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-8 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </motion.div>
        ) : isEmptyState || books.length === 0 ? (
          /* Empty States Layout */
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
          /* Normal Dashboard Render */
          <motion.div
            key="dashboard-content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* 1. Hero Welcome & Continue Reading Card */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
                {/* Left Side: Welcome Info */}
                <div className="flex flex-col justify-between p-6 text-left sm:p-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold tracking-widest text-purple-600 uppercase">
                        Personal Workspace
                      </span>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        Welcome back, {user?.displayName || 'Reader'} 👋
                      </h1>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 italic dark:text-slate-400">
                      "{motivationalQuote}"
                    </p>
                  </div>

                  <div className="mt-8 space-y-3 border-t border-slate-50 pt-6 dark:border-slate-800/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Weekly Reading Goal
                      </span>
                      <span className="font-bold text-purple-600">
                        {weeklyGoalProgress} / {weeklyGoalTarget} pages ({weeklyGoalPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${weeklyGoalPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Continue Reading */}
                {continueReadingBook && (
                  <div className="flex flex-col justify-between bg-slate-50/40 p-6 text-left sm:p-8 dark:bg-slate-900/40">
                    <span className="mb-4 block text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                      Continue Reading
                    </span>
                    <div className="flex flex-1 items-start gap-4">
                      <img
                        src={continueReadingBook.coverPath}
                        alt={continueReadingBook.title}
                        className="aspect-[0.7/1] w-20 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm dark:border-slate-800"
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span className="block w-fit rounded bg-purple-50 px-2 py-0.5 text-[8px] font-bold text-purple-700 uppercase dark:bg-purple-950/20">
                          {getCollectionName(continueReadingBook.collectionId)}
                        </span>
                        <h4 className="truncate text-base font-bold text-slate-950 dark:text-white">
                          {continueReadingBook.title}
                        </h4>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          By {continueReadingBook.author}
                        </p>

                        <div className="mt-4 w-full">
                          <div className="mb-1 flex justify-between text-[9px] font-semibold text-slate-500 uppercase dark:text-slate-400">
                            <span>Read Progress</span>
                            <span>{continueReadingBook.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-purple-600"
                              style={{ width: `${continueReadingBook.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/40">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Page {continueReadingBook.currentPage} of {continueReadingBook.totalPages}
                      </span>
                      <Link to={ROUTES.READER.replace(':id', continueReadingBook.id)}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-purple-600 px-4 py-2 text-xs text-white shadow-sm hover:bg-purple-700"
                          leftIcon={<Play className="h-3.5 w-3.5 fill-current stroke-current" />}
                        >
                          Resume
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 2. Top Statistics Grid (8 Cards) */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8"
            >
              {statsList.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="flex min-h-[110px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4.5 shadow-xs transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <stat.icon className="h-4 w-4 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-3 text-left">
                    <h3 className="text-xl leading-none font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {stat.value}
                    </h3>
                    <p className="mt-1 truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      {stat.sub}
                    </p>
                    {stat.isStorage && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-pink-600"
                          style={{ width: `${storagePercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 3. Main Dashboard Rows (2 Columns Split) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Recent Books & Collections (2/3 width) */}
              <div className="space-y-8 lg:col-span-2">
                {/* Recent Books section */}
                <motion.div variants={itemVariants}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                      Recent Uploads
                    </h3>
                    <Link
                      to={ROUTES.LIBRARY}
                      className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      View Library
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {recentBooks.map((book) => (
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
                          <div className="min-w-0 space-y-1">
                            <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                              {getCollectionName(book.collectionId)}
                            </span>
                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {book.title}
                            </h4>
                            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                              By {book.author}
                            </p>
                            <span className="block pt-2 text-[10px] font-semibold text-slate-400">
                              {book.progress}% Completed
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4 dark:border-slate-800/40">
                          <button
                            onClick={() => toggleStar(book.id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:text-amber-500 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <Star
                              className={`h-4 w-4 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`}
                            />
                          </button>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setPreviewBook(book)}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                              title="Quick Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link to={ROUTES.READER.replace(':id', book.id)}>
                              <button className="flex h-7 cursor-pointer items-center rounded-lg bg-purple-600 px-3.5 text-[9px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-purple-700">
                                Read
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* My Collections section */}
                <motion.div variants={itemVariants}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                      My Collections
                    </h3>
                    <Link
                      to={ROUTES.CATEGORIES}
                      className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Manage Shelves
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {collectionsData.length === 0 ? (
                      <div className="col-span-3 flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                        <span>No collections created yet.</span>
                      </div>
                    ) : (
                      collectionsData.map((col, idx) => (
                        <div
                          key={idx}
                          className="flex h-32 flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4.5 shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              {col.cover ? (
                                <img
                                  src={col.cover}
                                  alt=""
                                  className="h-10 w-8 rounded object-cover shadow-xs"
                                />
                              ) : (
                                <div
                                  className={`h-10 w-8 rounded bg-gradient-to-tr ${col.color} flex shrink-0 items-center justify-center text-white shadow-xs`}
                                >
                                  <FolderOpen className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0 text-left">
                                <h4 className="truncate text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                  {col.name}
                                </h4>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                  {col.count} {col.count === 1 ? 'book' : 'books'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end border-t border-slate-50 pt-2 dark:border-slate-800/40">
                            <Link to={ROUTES.CATEGORIES} className="w-full">
                              <button className="border-slate-150 flex h-7 w-full cursor-pointer items-center justify-center rounded-lg border bg-slate-50 text-[9px] font-bold tracking-wider text-slate-700 uppercase transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800">
                                Open Shelf
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Weekly Activity, Goal Tracker, Library Insights (1/3 width) */}
              <div className="space-y-6">
                {/* 1. Monthly Reading Goal Tracker */}
                <motion.div variants={itemVariants}>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-slate-850 text-xs font-bold tracking-wider uppercase dark:text-white">
                        Monthly Reading Goal
                      </h4>
                      <Award className="h-4.5 w-4.5 text-purple-600" />
                    </div>
                    <div className="space-y-3.5">
                      <div className="flex items-end justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Book target completed
                        </span>
                        <h4 className="text-lg leading-none font-extrabold text-slate-900 dark:text-white">
                          {completedBooks} / 5 books
                        </h4>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, (completedBooks / 5) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Keep reading! Completing {Math.max(0, 5 - completedBooks)} more books
                        achieves your target.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* 2. Reading Activity Graph */}
                <motion.div variants={itemVariants}>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-slate-850 text-xs font-bold tracking-wider uppercase dark:text-white">
                        Weekly Activity
                      </h4>
                      <TrendingUp className="h-4.5 w-4.5 text-purple-600" />
                    </div>
                    {/* Simulated daily pages read graph */}
                    <div className="mt-4 flex h-20 items-end justify-between px-2 select-none">
                      {[
                        { day: 'M', pages: 15, h: 'h-10' },
                        { day: 'T', pages: 30, h: 'h-16' },
                        { day: 'W', pages: 10, h: 'h-7' },
                        {
                          day: 'T',
                          pages: 0,
                          h: 'h-0 bg-transparent border-dashed border border-slate-200 dark:border-slate-700',
                        },
                        { day: 'F', pages: 20, h: 'h-12' },
                        { day: 'S', pages: 45, h: 'h-20' },
                        { day: 'S', pages: 5, h: 'h-4' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex w-7 flex-col items-center gap-1.5">
                          <div
                            className={`w-2.5 rounded-t-sm bg-purple-600 transition-all duration-300 ${item.h}`}
                            title={`${item.pages} pages`}
                          />
                          <span className="text-[9px] font-bold text-slate-400">{item.day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-50 pt-4 text-center dark:divide-slate-800 dark:border-slate-800/40">
                      <div>
                        <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase dark:text-slate-500">
                          Weekly Pages
                        </span>
                        <span className="mt-1.5 block text-xs font-extrabold text-slate-900 dark:text-white">
                          125
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase dark:text-slate-500">
                          Sessions
                        </span>
                        <span className="mt-1.5 block text-xs font-extrabold text-slate-900 dark:text-white">
                          6
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] leading-none font-bold text-slate-400 uppercase dark:text-slate-500">
                          Streak
                        </span>
                        <span className="mt-1.5 block text-xs font-extrabold text-slate-900 dark:text-white">
                          2 days
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 3. Library Insights Section */}
                <motion.div variants={itemVariants}>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-800/40">
                      <h4 className="text-slate-850 text-xs font-bold tracking-wider uppercase dark:text-white">
                        Library Insights
                      </h4>
                      <Sparkles className="h-4.5 w-4.5 text-purple-600" />
                    </div>

                    <div className="space-y-4 text-xs">
                      {[
                        { label: 'Most Read Author', val: mostReadAuthor, icon: Users },
                        { label: 'Largest Collection', val: largestCollection, icon: Layers },
                        { label: 'Longest Book', val: longestBook, icon: Bookmark },
                        { label: 'Recently Added Book', val: recentlyAddedBook, icon: Calendar },
                        { label: 'Favorite Collection', val: favoriteCollection, icon: Star },
                        { label: 'Average Reading Session', val: avgReadingSession, icon: Clock },
                        {
                          label: 'Books Added This Month',
                          val: String(booksAddedThisMonth),
                          icon: Plus,
                        },
                      ].map((insight, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                            <insight.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{insight.label}</span>
                          </div>
                          <span className="max-w-[150px] truncate text-right font-bold text-slate-900 dark:text-white">
                            {insight.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Details Preview Modal Drawer */}
      <AnimatePresence>
        {previewBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border-slate-150 w-full max-w-sm space-y-4 rounded-3xl border bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-extrabold tracking-wider text-purple-600 uppercase">
                  Quick Details
                </h4>
                <button
                  onClick={() => setPreviewBook(null)}
                  className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
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
                  <h5 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {previewBook.title}
                  </h5>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    By {previewBook.author}
                  </p>
                  <span className="mt-2 inline-block rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-purple-700 uppercase dark:bg-purple-950/20">
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
                    className="rounded-xl bg-purple-600 text-white shadow-xs hover:bg-purple-700"
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
