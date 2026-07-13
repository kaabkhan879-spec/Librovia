import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { useAuth } from '../../context/AuthContext'
import {
  BookOpen,
  Flame,
  HardDrive,
  CheckCircle2,
  FolderOpen,
  Plus,
  Play,
  Star,
  Eye,
  Activity,
  ChevronRight,
  BookMarked,
  Sparkles,
  Info,
  UploadCloud,
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

  const fetchBooks = () => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const toggleStar = async (id: string) => {
    try {
      const isFav = await booksService.toggleFavorite(id)
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, isFavorite: isFav } : b)))
    } catch (err) {
      console.error(err)
    }
  }

  // Dynamic calculations
  const totalBooks = books.length
  const currentlyReading = books.filter((b) => b.progress > 0 && b.progress < 100).length
  const completedBooks = books.filter((b) => b.progress === 100).length
  const favoritesCount = books.filter((b) => b.isFavorite).length
  const totalStorage = useMemo(() => {
    const bytes = books.reduce((acc, b) => acc + b.fileSize, 0)
    return formatBytes(bytes)
  }, [books])

  const stats = [
    {
      title: 'Total Books',
      value: String(totalBooks),
      sub: 'In cloud shelf',
      icon: BookOpen,
      color: 'text-indigo-500',
    },
    {
      title: 'Currently Reading',
      value: String(currentlyReading),
      sub: 'Active now',
      icon: BookMarked,
      color: 'text-cyan-500',
    },
    {
      title: 'Completed Books',
      value: String(completedBooks),
      sub: 'Read finished',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Favorites',
      value: String(favoritesCount),
      sub: 'Starred books',
      icon: Star,
      color: 'text-amber-500',
    },
    {
      title: 'Storage Used',
      value: totalStorage,
      sub: '1 GB limit',
      icon: HardDrive,
      color: 'text-purple-500',
    },
    {
      title: 'Reading Streak',
      value: '2 days',
      sub: 'Active streak',
      icon: Flame,
      color: 'text-red-500',
    },
  ]

  const recentBooks = useMemo(() => {
    return [...books].slice(0, 4)
  }, [books])

  const continueReadingBook = useMemo(() => {
    const inProgress = books.find((b) => b.progress > 0 && b.progress < 100)
    return inProgress || books[0] || null
  }, [books])

  const collections = [
    {
      name: 'Programming',
      count: books.filter((b) => b.categoryId === 'cat-2').length,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      name: 'Self-Help',
      count: books.filter((b) => b.categoryId === 'cat-3').length,
      color: 'from-amber-500 to-orange-600',
    },
    {
      name: 'Classics',
      count: books.filter((b) => b.categoryId === 'cat-1').length,
      color: 'from-purple-500 to-pink-600',
    },
  ]

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  }

  return (
    <div className="space-y-8 text-left select-none">
      {/* Simulation Controls row */}
      <div className="bg-bg-surface border-border-base flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="text-primary-500 h-4.5 w-4.5 shrink-0" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateLoader}
            className="border-border-base bg-bg-app text-text-sub hover:bg-bg-surface cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors"
          >
            Simulate Loading Skeletons
          </button>
          <button
            onClick={() => setIsEmptyState(!isEmptyState)}
            className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${isEmptyState ? 'bg-primary-600 border-primary-600 text-white' : 'bg-bg-app border-border-base text-text-sub hover:bg-bg-surface'} `}
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
            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-28 animate-pulse flex-col justify-between rounded-2xl border p-4"
              >
                <div className="bg-border-light h-4 w-1/2 rounded" />
                <div className="bg-border-light h-8 w-1/3 rounded" />
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
            className="border-border-base bg-bg-surface mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed p-12 text-center"
          >
            <div className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-lg font-bold">Your Shelf is Empty</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
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
            {/* 1. Welcome Header Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1.5">
                <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Welcome back, {user?.displayName || 'Reader'} 👋
                </h1>
                <p className="text-text-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="text-primary-500 h-3.5 w-3.5 animate-pulse" />
                  "Every great reader was once a beginner."
                </p>
              </div>

              {/* Streak Badge */}
              <div className="inline-flex items-center gap-2.5 self-start rounded-2xl border border-red-100 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-600 select-none dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Flame className="h-5 w-5 shrink-0 fill-red-500 text-red-500" />
                <div>
                  <span className="block text-[8px] leading-none tracking-wider text-red-500 uppercase opacity-80">
                    Streak
                  </span>
                  <span className="mt-0.5 block text-sm leading-none">2 Days Running</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Statistics Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="bg-bg-surface border-border-base hover:border-primary-500/20 flex min-h-[110px] flex-col justify-between rounded-2xl border p-4.5 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-text-muted text-[10px] leading-none font-bold tracking-wider uppercase">
                      {stat.title}
                    </span>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color} shrink-0`} />
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-text-main text-2xl leading-none font-extrabold tracking-tight">
                      {stat.value}
                    </h3>
                    <p className="text-text-sub mt-1 text-[9px] leading-none font-bold tracking-wider uppercase">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 3. Continue Reading & Quick Actions split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Continue Reading Large Card */}
              {continueReadingBook && (
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                    Continue Reading
                  </h3>
                  <div className="from-primary-600 shadow-primary-500/10 relative flex flex-col items-stretch justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br to-indigo-600 p-6 text-white shadow-lg sm:flex-row">
                    <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-2xl select-none" />

                    <div className="flex flex-1 items-start gap-4.5 text-left sm:items-center">
                      <img
                        src={continueReadingBook.coverPath}
                        alt={continueReadingBook.title}
                        className="aspect-[0.7/1] w-20 shrink-0 rounded-lg border border-white/10 object-cover shadow-lg"
                      />
                      <div className="space-y-2">
                        <span className="inline-block rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                          {continueReadingBook.categoryId === 'cat-2' ? 'Programming' : 'Self-Help'}
                        </span>
                        <h4 className="font-sans text-lg font-bold tracking-tight">
                          {continueReadingBook.title}
                        </h4>
                        <p className="text-xs text-indigo-100">{continueReadingBook.author}</p>

                        <div className="mt-2 w-full max-w-[200px]">
                          <div className="mb-1 flex justify-between text-[9px] font-bold tracking-wider text-indigo-100 uppercase">
                            <span>Reading Progress</span>
                            <span>{continueReadingBook.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                            <div
                              className="h-full bg-white"
                              style={{ width: `${continueReadingBook.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start justify-between border-t border-white/10 pt-4 text-left sm:items-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-right">
                      <div className="space-y-1">
                        <span className="block text-[9px] tracking-wider text-indigo-200 uppercase">
                          Pages logged
                        </span>
                        <span className="block text-sm font-bold">
                          {continueReadingBook.currentPage} / {continueReadingBook.totalPages}
                        </span>
                      </div>
                      <Link
                        to={ROUTES.READER.replace(':id', continueReadingBook.id)}
                        className="mt-4 sm:mt-0"
                      >
                        <Button className="text-primary-600 flex items-center gap-1.5 border-transparent bg-white px-5 py-2.5 font-bold shadow-sm hover:bg-slate-50">
                          <Play className="fill-primary-600 stroke-primary-600 h-3.5 w-3.5" />
                          Resume Reading
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Actions Panel */}
              <motion.div
                variants={itemVariants}
                className={!continueReadingBook ? 'lg:col-span-3' : ''}
              >
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Quick Actions
                </h3>
                <div className="bg-bg-surface border-border-base flex h-full flex-col justify-between space-y-3 rounded-3xl border p-5 shadow-sm">
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <Link
                      to={ROUTES.UPLOAD}
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <UploadCloud className="text-primary-500 h-5 w-5 shrink-0" />
                      <span className="text-text-main mt-4 text-xs font-bold">Upload Book</span>
                    </Link>
                    <Link
                      to={ROUTES.LIBRARY}
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <BookOpen className="h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="text-text-main mt-4 text-xs font-bold">Open Library</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4. Book Grid - Recently Added */}
            <motion.div variants={itemVariants}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-muted text-sm font-bold tracking-wider uppercase">
                  Recently Added Books
                </h3>
                <Link
                  to={ROUTES.LIBRARY}
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs font-bold hover:underline"
                >
                  View All Shelf
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentBooks.map((book) => {
                  return (
                    <motion.div
                      key={book.id}
                      whileHover={{ y: -4 }}
                      className="bg-bg-surface border-border-base hover:border-primary-500/20 flex h-56 flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all"
                    >
                      <div className="flex gap-4">
                        <img
                          src={book.coverPath}
                          alt={book.title}
                          className="border-border-light aspect-[0.7/1] w-14 shrink-0 rounded border object-cover shadow-md"
                        />
                        <div className="min-w-0 space-y-1">
                          <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                            {book.categoryId === 'cat-2' ? 'Programming' : 'Self-Help'}
                          </span>
                          <h4 className="text-text-main truncate text-xs font-bold">
                            {book.title}
                          </h4>
                          <p className="text-text-sub truncate text-[10px]">By {book.author}</p>
                        </div>
                      </div>

                      {/* Progress and bottom actions bar */}
                      <div className="border-border-light mt-3 space-y-3 border-t pt-3">
                        <div>
                          <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold tracking-wider uppercase">
                            <span>Read count</span>
                            <span>{book.progress}%</span>
                          </div>
                          <div className="bg-border-light h-1.5 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-primary-600 h-full"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleStar(book.id)}
                            className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                          >
                            <Star
                              className={`h-4 w-4 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                            />
                          </button>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setPreviewBook(book)}
                              className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                              title="Quick Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link to={ROUTES.READER.replace(':id', book.id)}>
                              <button className="bg-primary-600 hover:bg-primary-700 flex h-7 cursor-pointer items-center rounded-lg px-3 text-[9px] font-bold tracking-wider text-white uppercase transition-colors">
                                Open
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* 5. Collections & Activity row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* My Collections grid */}
              <motion.div variants={itemVariants} className="text-left lg:col-span-2">
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  My Collections
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {collections.map((col, idx) => (
                    <div
                      key={idx}
                      className="border-border-base bg-bg-surface hover:border-primary-500/20 flex h-28 flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${col.color} flex items-center justify-center text-white`}
                        >
                          <FolderOpen className="h-4.5 w-4.5" />
                        </div>
                        <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-1.5 py-0.5 text-[10px] font-bold">
                          {col.count} Books
                        </span>
                      </div>
                      <h4 className="text-text-main mt-4 truncate text-xs font-bold tracking-wider uppercase">
                        {col.name}
                      </h4>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity List */}
              <motion.div variants={itemVariants}>
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Recent Activity
                </h3>
                <div className="bg-bg-surface border-border-base flex h-full flex-col justify-between rounded-3xl border p-5 shadow-sm">
                  <div className="flex-1 space-y-4">
                    {books.slice(0, 3).map((act, idx) => (
                      <div key={idx} className="flex gap-3 text-left">
                        <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-text-main text-xs font-bold">Uploaded "{act.title}"</p>
                          <p className="text-text-muted mt-0.5 text-[9px]">Recently synced</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
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
              className="bg-bg-surface border-border-base w-full max-w-sm space-y-4 rounded-2xl border p-6 text-left shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-primary-600 text-sm font-extrabold tracking-wider uppercase">
                  Quick Details
                </h4>
                <button
                  onClick={() => setPreviewBook(null)}
                  className="text-text-muted hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-1"
                >
                  <XIcon className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="flex gap-4">
                <img
                  src={previewBook.coverPath}
                  alt={previewBook.title}
                  className="border-border-light aspect-[0.7/1] w-16 shrink-0 rounded border object-cover shadow"
                />
                <div>
                  <h5 className="text-text-main text-sm font-bold">{previewBook.title}</h5>
                  <p className="text-text-sub mt-0.5 text-xs">By {previewBook.author}</p>
                  <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mt-2 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                    {previewBook.categoryId === 'cat-2' ? 'Programming' : 'Self-Help'}
                  </span>
                </div>
              </div>
              <p className="text-text-sub font-sans text-xs leading-relaxed">
                {previewBook.description || 'No synopsis provided.'}
              </p>
              <div className="border-border-light flex justify-end gap-2 border-t pt-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewBook(null)}>
                  Close
                </Button>
                <Link
                  to={ROUTES.READER.replace(':id', previewBook.id)}
                  onClick={() => setPreviewBook(null)}
                >
                  <Button size="sm">Open Reader</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface XIconProps {
  className?: string
}

const XIcon: React.FC<XIconProps> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)
