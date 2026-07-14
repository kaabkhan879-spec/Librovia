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
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [previewBook, setPreviewBook] = useState<Book | null>(null)
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])

  // Journal statistics & search state
  const [allNotes, setAllNotes] = useState<Note[]>([])
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

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
    return 'Read is to the mind what exercise is to the body. Keep feeding your curiosity!'
  }, [books.length, inProgressBooks.length])

  // Stats Configuration
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
      title: 'Total Collections',
      value: String(totalCollections),
      sub: 'bookshelves',
      icon: FolderOpen,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10',
    },
  ]

  // Global search filtering notes
  const filteredGlobalNotes = useMemo(() => {
    if (!globalSearchQuery.trim()) return []
    const query = globalSearchQuery.toLowerCase()
    return allNotes.filter((n) => {
      return (
        n.noteText.toLowerCase().includes(query) ||
        (n.highlightedText && n.highlightedText.toLowerCase().includes(query)) ||
        n.tags.some((t) => t.toLowerCase().includes(query))
      )
    })
  }, [allNotes, globalSearchQuery])

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
            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold tracking-widest text-purple-600 uppercase">
                      Welcome back
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                      Welcome back, {user?.displayName || 'Reader'} 👋
                    </h1>
                  </div>
                  <p className="max-w-xl text-xs leading-relaxed text-slate-500 italic dark:text-slate-400">
                    "{motivationalQuote}"
                  </p>
                </div>

                <div className="w-full shrink-0 space-y-3 border-t border-slate-50 pt-4 md:w-64 md:border-t-0 md:pt-0 dark:border-slate-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      Weekly Reading Goal
                    </span>
                    <span className="font-bold text-purple-600">
                      {weeklyGoalProgress} / {weeklyGoalTarget} pgs
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
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
            >
              {statsList.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="flex min-h-[100px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <stat.icon className="h-4.5 w-4.5 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-3 text-left">
                    <h3 className="text-2xl leading-none font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {stat.value}
                    </h3>
                    <p className="mt-1.5 truncate text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                {/* Continue reading shelf */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                      Continue Reading
                    </h3>
                  </div>

                  {continueReadingBook ? (
                    <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex min-w-0 flex-1 items-start gap-4.5">
                        <img
                          src={continueReadingBook.coverPath}
                          alt={continueReadingBook.title}
                          className="aspect-[0.7/1] w-16 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                            {getCollectionName(continueReadingBook.collectionId)}
                          </span>
                          <h4 className="truncate text-sm font-bold text-slate-950 dark:text-white">
                            {continueReadingBook.title}
                          </h4>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            By {continueReadingBook.author}
                          </p>

                          <div className="mt-3 w-full max-w-[240px]">
                            <div className="mb-1 flex justify-between text-[9px] font-semibold text-slate-500 uppercase dark:text-slate-400">
                              <span>Progress</span>
                              <span>{continueReadingBook.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-purple-600"
                                style={{ width: `${continueReadingBook.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 items-end justify-between gap-3 border-t border-slate-50 pt-4 sm:w-auto sm:flex-col sm:border-t-0 sm:pt-0 dark:border-slate-800/40">
                        <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline dark:text-slate-500">
                          Page {continueReadingBook.currentPage} of {continueReadingBook.totalPages}
                        </span>
                        <Link
                          to={ROUTES.READER.replace(':id', continueReadingBook.id)}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                            leftIcon={<Play className="h-3.5 w-3.5 fill-current stroke-current" />}
                          >
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                      <span>No books in progress. Open a book in My Library to start.</span>
                    </div>
                  )}
                </motion.div>

                {/* Recently Added Books */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                      Recently Added
                    </h3>
                    <Link
                      to={ROUTES.LIBRARY}
                      className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {recentlyAddedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="flex h-32 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex min-w-0 flex-1 gap-4">
                          <img
                            src={book.coverPath}
                            alt={book.title}
                            className="aspect-[0.7/1] w-14 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
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
                            <span className="block flex items-center gap-1 pt-1 text-[9px] font-medium text-slate-400">
                              <Calendar className="h-3 w-3 shrink-0" />
                              Added{' '}
                              {new Date(book.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
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
                </motion.div>

                {/* Favorite Books */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                      Favorite Books
                    </h3>
                  </div>

                  {favoriteBooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {favoriteBooks.map((book) => (
                        <div
                          key={book.id}
                          className="flex h-32 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex min-w-0 flex-1 gap-4">
                            <img
                              src={book.coverPath}
                              alt={book.title}
                              className="aspect-[0.7/1] w-14 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
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

                          <div className="flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4 dark:border-slate-800/40">
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
                    <div className="flex h-28 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                      <span>
                        No favorites starred. Mark books as favorites in your library to see them
                        here.
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Sidebar Widgets */}
              <div className="space-y-8">
                {/* Journal widget & Global Notes Search */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="flex items-center gap-1 text-left text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                    <MessageSquare className="text-purple-650 h-4.5 w-4.5" />
                    <span>📒 Personal Notes</span>
                  </h3>

                  <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-purple-50/50 p-2 dark:bg-purple-950/20">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Notes
                        </span>
                        <span className="font-mono text-sm font-extrabold text-purple-600">
                          {notesCount}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-sky-50/50 p-2 dark:bg-sky-950/20">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Clips
                        </span>
                        <span className="font-mono text-sm font-extrabold text-sky-600">
                          {highlightsCount}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-amber-50/50 p-2 dark:bg-amber-950/20">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">
                          Saves
                        </span>
                        <span className="font-mono text-sm font-extrabold text-amber-600">
                          {bookmarksCount}
                        </span>
                      </div>
                    </div>

                    {/* Global Search Bar */}
                    <div className="relative">
                      <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search all notes (e.g. AI)..."
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-9 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                      />
                    </div>

                    {/* Dynamic search results list or recent notes list */}
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {globalSearchQuery.trim() ? (
                        filteredGlobalNotes.length === 0 ? (
                          <p className="py-4 text-center text-[10px] text-slate-400">
                            No matching notes found for "{globalSearchQuery}".
                          </p>
                        ) : (
                          filteredGlobalNotes.map((note) => (
                            <Link
                              key={note.id}
                              to={`${ROUTES.READER.replace(':id', note.bookId)}?page=${note.pageNumber}`}
                              className="block space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/30 p-3 transition-all hover:border-purple-300 hover:bg-white dark:border-slate-800 dark:hover:border-purple-900"
                            >
                              <div className="flex items-center justify-between text-[8px] font-bold text-purple-600 uppercase">
                                <span className="max-w-[120px] truncate">
                                  {getBookTitle(note.bookId)}
                                </span>
                                <span>Page {note.pageNumber} ↗</span>
                              </div>
                              {note.highlightedText && (
                                <p className="line-clamp-2 border-l-2 border-purple-400 bg-slate-50 pl-2 text-[10px] italic dark:bg-slate-800">
                                  "{note.highlightedText}"
                                </p>
                              )}
                              <p className="line-clamp-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                {note.noteText}
                              </p>
                            </Link>
                          ))
                        )
                      ) : allNotes.length === 0 ? (
                        <p className="text-slate-450 py-6 text-center text-[10px]">
                          No notes written. Open a book to record insights!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <span className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                            Recent Thoughts
                          </span>
                          {allNotes.slice(0, 3).map((note) => (
                            <Link
                              key={note.id}
                              to={`${ROUTES.READER.replace(':id', note.bookId)}?page=${note.pageNumber}`}
                              className="dark:border-slate-850 block space-y-1.5 rounded-2xl border border-slate-50 bg-white p-3 shadow-xs transition-all hover:border-purple-300/30 hover:bg-slate-50/40 dark:hover:border-purple-900/40"
                            >
                              <div className="flex items-center justify-between text-[8px] font-bold text-purple-600 uppercase">
                                <span className="max-w-[120px] truncate">
                                  {getBookTitle(note.bookId)}
                                </span>
                                <span>Page {note.pageNumber} ↗</span>
                              </div>
                              <p className="dark:text-slate-350 truncate text-[10px] font-semibold text-slate-700">
                                {note.noteText || <em className="text-slate-400">Bookmark clip</em>}
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Activity Feed logs */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-left text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-white">
                    Recent Activity
                  </h3>
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {recentActivities.length > 0 ? (
                      <div className="relative ml-3 space-y-6 border-l border-slate-100 pl-5 text-left dark:border-slate-800">
                        {recentActivities.map((act) => {
                          const iconColor =
                            act.type === 'upload'
                              ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/15'
                              : act.type === 'collection'
                                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/15'
                                : act.type === 'favorite'
                                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/15'
                                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/15'

                          return (
                            <div key={act.id} className="relative">
                              <span
                                className={`absolute top-0.5 -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${iconColor}`}
                              >
                                <Activity className="h-3 w-3 shrink-0" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {act.title}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                  {act.desc}
                                </p>
                                <span className="mt-1 block text-[8px] font-semibold text-slate-400">
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
                      <div className="flex h-32 items-center justify-center text-xs text-slate-500">
                        No recent activities.
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
