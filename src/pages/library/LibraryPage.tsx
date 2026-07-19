import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notificationsService } from '../../services/notifications'
import {
  BookOpen,
  Search,
  Plus,
  Play,
  Star,
  List,
  Grid,
  Trash2,
  Download,
  FolderOpen,
  MoreVertical,
  Edit2,
  Calendar,
  X,
  Info,
  FilterX,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export type SortType = 'recently-opened' | 'newest' | 'a-z' | 'z-a' | 'progress' | 'size'
export type FormatFilter = 'all' | 'pdf' | 'epub'
export type StatusTab = 'all' | 'reading' | 'completed' | 'favorites'

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Search & 300ms Debounce
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Compact Dropdown Filter States
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('all')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortType>('recently-opened')

  // Status Tab Filter
  const [activeTab, setActiveTab] = useState<StatusTab>(() => {
    if (tabParam === 'favorites') return 'favorites'
    if (tabParam === 'reading') return 'reading'
    if (tabParam === 'completed') return 'completed'
    return 'all'
  })
  const [prevTabParam, setPrevTabParam] = useState<string | null>(tabParam)

  // Sync state if URL search param updates dynamically
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam)
    if (tabParam === 'favorites') setActiveTab('favorites')
    else if (tabParam === 'reading') setActiveTab('reading')
    else if (tabParam === 'completed') setActiveTab('completed')
    else if (tabParam === 'all') setActiveTab('all')
  }

  // Modals & Menu States
  const [activeMenuBookId, setActiveMenuBookId] = useState<string | null>(null)
  const [renamingBook, setRenamingBook] = useState<Book | null>(null)
  const [renameTitleInput, setRenameTitleInput] = useState('')
  const [movingBook, setMovingBook] = useState<Book | null>(null)
  const [movingCollectionId, setMovingCollectionId] = useState('')

  const menuRef = useRef<HTMLDivElement | null>(null)
  const searchBarRef = useRef<HTMLInputElement>(null)

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        const activeElem = document.activeElement
        if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA')) {
          return
        }
        e.preventDefault()
        searchBarRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const fetchBooksAndCollections = useCallback(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()]).then(
      ([booksData, cols]) => {
        setCollections(cols)
        setBooks(booksData)
      }
    )
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([booksService.getBooks(), collectionsService.getCollections()])
      .then(([booksData, cols]) => {
        if (!active) return
        setCollections(cols)
        setBooks(booksData)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuBookId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const isFav = await booksService.toggleFavorite(id)
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, isFavorite: isFav } : b)))
      setActiveMenuBookId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteBook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const bookToDelete = books.find((b) => b.id === id)
    const title = bookToDelete ? bookToDelete.title : 'Book'
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) return
    try {
      await booksService.deleteBook(id)
      fetchBooksAndCollections()
      setActiveMenuBookId(null)
      notificationsService
        .addNotification(
          'delete',
          'Book Removed 🗑️',
          `"${title}" has been deleted from your library.`
        )
        .catch((e) => console.error(e))
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renamingBook || !renameTitleInput.trim()) return
    try {
      await booksService.renameBook(renamingBook.id, renameTitleInput.trim())
      setRenamingBook(null)
      fetchBooksAndCollections()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movingBook) return
    try {
      const targetColId = movingCollectionId === 'none' ? null : movingCollectionId
      await booksService.updateBookCollection(movingBook.id, targetColId)
      setMovingBook(null)
      fetchBooksAndCollections()
    } catch (err) {
      console.error(err)
    }
  }

  const getCollectionName = useCallback(
    (colId: string | undefined) => {
      const col = collections.find((c) => c.id === colId)
      return col ? col.name : 'Uncategorized'
    },
    [collections]
  )

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'PDF'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    const kb = bytes / 1024
    return `${Math.round(kb)} KB`
  }

  const getFileType = (filePath?: string) => {
    if (!filePath) return 'PDF'
    if (filePath.toLowerCase().endsWith('.epub')) return 'EPUB'
    if (filePath.toLowerCase().endsWith('.mobi')) return 'MOBI'
    return 'PDF'
  }

  // Extract unique authors list
  const uniqueAuthors = useMemo(() => {
    const authorsSet = new Set(books.map((b) => b.author).filter(Boolean))
    return Array.from(authorsSet) as string[]
  }, [books])

  // Filter & Sort Engine
  const filteredBooks = useMemo(() => {
    let result = [...books]

    // 1. Status Tab Filter
    if (activeTab === 'favorites') {
      result = result.filter((b) => b.isFavorite)
    } else if (activeTab === 'reading') {
      result = result.filter((b) => b.progress > 0 && b.progress < 100)
    } else if (activeTab === 'completed') {
      result = result.filter((b) => b.progress === 100)
    }

    // 2. Format Dropdown Filter
    if (selectedFormat === 'pdf') {
      result = result.filter((b) => getFileType(b.filePath) === 'PDF')
    } else if (selectedFormat === 'epub') {
      result = result.filter((b) => getFileType(b.filePath) === 'EPUB')
    }

    // 3. Search Query (debounced)
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter((book) => {
        const catName = getCollectionName(book.collectionId).toLowerCase()
        const matchTitle = book.title.toLowerCase().includes(q)
        const matchAuthor = book.author?.toLowerCase().includes(q)
        const matchTags = book.tags?.some((t) => t.toLowerCase().includes(q))
        const matchCat = catName.includes(q)
        return matchTitle || matchAuthor || matchTags || matchCat
      })
    }

    // 4. Dropdown Collection Filter
    if (selectedCollectionId !== 'all') {
      result = result.filter((b) => b.collectionId === selectedCollectionId)
    }

    // 5. Dropdown Author Filter
    if (selectedAuthor !== 'all') {
      result = result.filter((b) => b.author === selectedAuthor)
    }

    // 6. Sort Dropdown Logic
    return result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title)
      if (sortBy === 'z-a') return b.title.localeCompare(a.title)
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'recently-opened') {
        const timeA = new Date(a.lastReadAt || a.updatedAt || a.createdAt).getTime()
        const timeB = new Date(b.lastReadAt || b.updatedAt || b.createdAt).getTime()
        return timeB - timeA
      }
      if (sortBy === 'progress') return b.progress - a.progress
      if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0)
      return 0
    })
  }, [
    books,
    debouncedQuery,
    selectedFormat,
    selectedCollectionId,
    selectedAuthor,
    sortBy,
    activeTab,
    getCollectionName,
  ])

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      activeTab !== 'all' ||
      selectedFormat !== 'all' ||
      selectedCollectionId !== 'all' ||
      selectedAuthor !== 'all' ||
      sortBy !== 'recently-opened'
    )
  }, [searchQuery, activeTab, selectedFormat, selectedCollectionId, selectedAuthor, sortBy])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setActiveTab('all')
    setSelectedFormat('all')
    setSelectedCollectionId('all')
    setSelectedAuthor('all')
    setSortBy('recently-opened')
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
  }

  return (
    <PageWrapper className="relative min-h-screen space-y-6 pb-20 text-left select-none">
      {/* Header Title Section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          My Library
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Your personal digital bookshelf ({books.length} {books.length === 1 ? 'book' : 'books'})
        </p>
      </div>

      {/* TOP ROW: Search Bar (Primary Focus) + Upload Book Button (Secondary) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-2xl flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
          <input
            ref={searchBarRef}
            type="text"
            placeholder="Search books by title, author, collection, or tag... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pr-12 pl-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-xs transition-all focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500/10"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-sans text-[10px] font-bold text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <span>⌘</span>K
              </kbd>
            </div>
          )}
        </div>

        <Link to={ROUTES.UPLOAD} className="shrink-0">
          <Button
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full rounded-2xl bg-purple-600 font-bold text-white shadow-xs transition-all hover:bg-purple-700 sm:w-auto"
          >
            Upload Book
          </Button>
        </Link>
      </div>

      {/* SECOND ROW: Status Filters (Left) & Compact Dropdown Menus (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
        {/* Status Filters */}
        <div className="flex items-center rounded-2xl bg-slate-100 p-1 dark:bg-slate-900/80">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'reading' as const, label: 'Reading' },
            { id: 'completed' as const, label: 'Completed' },
            { id: 'favorites' as const, label: '⭐ Favorites' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="library-active-status"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-slate-800"
                />
              )}
            </button>
          ))}
        </div>

        {/* Compact Dropdown Menus */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Dropdown */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as FormatFilter)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-purple-500"
          >
            <option value="all">Format: All</option>
            <option value="pdf">Format: PDF</option>
            <option value="epub">Format: EPUB</option>
          </select>

          {/* Collection Dropdown */}
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-purple-500"
          >
            <option value="all">Collection: All</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>

          {/* Author Dropdown */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-purple-500"
          >
            <option value="all">Author: All</option>
            {uniqueAuthors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-all focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-purple-500"
          >
            <option value="recently-opened">Sort: Recently Opened</option>
            <option value="newest">Sort: Recently Added</option>
            <option value="a-z">Sort: Title A – Z</option>
            <option value="z-a">Sort: Title Z – A</option>
            <option value="progress">Sort: Reading Progress</option>
            <option value="size">Sort: File Size</option>
          </select>

          {/* Reset Filters (Visible if filters active) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex cursor-pointer items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              title="Clear all active filters"
            >
              <FilterX className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="ml-1 flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`cursor-pointer rounded-lg p-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`cursor-pointer rounded-lg p-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* Skeleton Loading Cards */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-[380px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-[0.72/1] w-full flex-1 animate-pulse overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800" />
                <div className="mt-4 space-y-2.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-1 pt-1.5">
                    <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : books.length === 0 ? (
          /* Initial Empty State (No Books Uploaded Yet) */
          <motion.div
            key="empty-library"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                No books in your library yet.
              </h3>
              <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400">
                Build your digital shelf by uploading PDF or EPUB documents.
              </p>
            </div>
            <Link to={ROUTES.UPLOAD} className="inline-block pt-2">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                className="rounded-2xl bg-purple-600 font-bold text-white shadow-xs hover:bg-purple-700"
              >
                Upload Your First Book
              </Button>
            </Link>
          </motion.div>
        ) : filteredBooks.length === 0 ? (
          /* Premium Filtered Empty State */
          <motion.div
            key="empty-filtered"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-md space-y-5 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Search className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No books found.
              </h3>
              <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400">
                Try changing your filters or clearing your search query.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              leftIcon={<X className="h-3.5 w-3.5" />}
              className="rounded-xl border-purple-200 font-bold text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950/50"
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          /* Real Library Grid / List Interface */
          <motion.div
            key="library-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {viewMode === 'grid' ? (
              /* ==================================================
                 PREMIUM EQUAL-HEIGHT BOOK GRID CARDS
                 ================================================== */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredBooks.map((book) => {
                  const fileType = getFileType(book.filePath)
                  const sizeStr = formatFileSize(book.fileSize)

                  return (
                    <div
                      key={book.id}
                      onClick={() => navigate(ROUTES.READER.replace(':id', book.id))}
                      className="group/card relative flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                    >
                      {/* Top Cover Section */}
                      <div className="space-y-3">
                        <div className="relative aspect-[0.72/1] w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950/40">
                          <img
                            src={book.coverPath}
                            alt={book.title}
                            onError={handleImageError}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                          />

                          {/* Top Right Actions */}
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(book.id, e)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white/95 text-slate-400 backdrop-blur-xs transition-colors hover:text-amber-500 dark:border-slate-800/60 dark:bg-slate-900/95"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  book.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                                }`}
                              />
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuBookId(
                                    activeMenuBookId === book.id ? null : book.id
                                  )
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white/95 text-slate-600 backdrop-blur-xs transition-colors hover:text-purple-600 dark:border-slate-800/60 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Quick Actions Context Menu */}
                              {activeMenuBookId === book.id && (
                                <div
                                  ref={menuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-9 right-0 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-xs font-semibold shadow-xl dark:border-slate-800 dark:bg-slate-950"
                                >
                                  <Link to={ROUTES.READER.replace(':id', book.id)}>
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Play className="h-3.5 w-3.5 fill-current text-purple-600" />
                                      <span>Read</span>
                                    </button>
                                  </Link>

                                  <Link to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}>
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Info className="h-3.5 w-3.5 text-indigo-600" />
                                      <span>Book Details</span>
                                    </button>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMovingBook(book)
                                      setMovingCollectionId(book.collectionId || 'none')
                                      setActiveMenuBookId(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Move to Collection</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenamingBook(book)
                                      setRenameTitleInput(book.title)
                                      setActiveMenuBookId(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Rename</span>
                                  </button>

                                  <a
                                    href={book.filePath}
                                    download
                                    className="block"
                                    onClick={() => setActiveMenuBookId(null)}
                                  >
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Download className="h-3.5 w-3.5 text-cyan-600" />
                                      <span>Download</span>
                                    </button>
                                  </a>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteBook(book.id, e)}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* File Type & Size Badges */}
                          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5">
                            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs">
                              {fileType}
                            </span>
                            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-200 backdrop-blur-xs">
                              {sizeStr}
                            </span>
                          </div>
                        </div>

                        {/* Title & Author (Strict 2-line title clamping) */}
                        <div className="space-y-1">
                          <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[8.5px] font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            {getCollectionName(book.collectionId)}
                          </span>

                          <h4 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 transition-colors group-hover/card:text-purple-600 dark:text-white dark:group-hover/card:text-purple-400">
                            {book.title}
                          </h4>

                          <p className="truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            By {book.author || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Progress & Last Read Date */}
                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9.5px] font-bold text-slate-400">
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

                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {book.lastReadAt
                              ? `Opened ${new Date(book.lastReadAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}`
                              : 'Not opened yet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ==================================================
                 PREMIUM LIST VIEW
                 ================================================== */
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold tracking-wider uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    <tr>
                      <th className="px-6 py-4">Book Details</th>
                      <th className="px-6 py-4">Format & Size</th>
                      <th className="px-6 py-4">Collection</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Last Opened</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBooks.map((book) => {
                      const fileType = getFileType(book.filePath)
                      const sizeStr = formatFileSize(book.fileSize)

                      return (
                        <tr
                          key={book.id}
                          onClick={() => navigate(ROUTES.READER.replace(':id', book.id))}
                          className="cursor-pointer transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        >
                          <td className="flex items-center gap-3.5 px-6 py-4">
                            <img
                              src={book.coverPath}
                              alt=""
                              onError={handleImageError}
                              className="h-11 w-8 shrink-0 rounded-lg object-cover shadow-2xs"
                            />
                            <div className="min-w-0">
                              <span className="line-clamp-1 max-w-xs font-bold text-slate-900 dark:text-white">
                                {book.title}
                              </span>
                              <span className="block truncate text-[10.5px] font-semibold text-slate-400">
                                {book.author || 'Unknown'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] uppercase dark:bg-slate-800">
                              {fileType}
                            </span>
                            <span>{sizeStr}</span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[9px] font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              {getCollectionName(book.collectionId)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-purple-600"
                                  style={{ width: `${book.progress}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                {book.progress}%
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-400">
                            {book.lastReadAt
                              ? new Date(book.lastReadAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Not opened'}
                          </td>

                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => toggleStar(book.id, e)}
                                className="p-1 text-slate-400 hover:text-amber-500"
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    book.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                                  }`}
                                />
                              </button>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuBookId(
                                      activeMenuBookId === book.id ? null : book.id
                                    )
                                  }}
                                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                  <MoreVertical className="h-4.5 w-4.5" />
                                </button>

                                {activeMenuBookId === book.id && (
                                  <div
                                    ref={menuRef}
                                    className="absolute top-8 right-0 z-40 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 text-left text-xs font-semibold shadow-xl dark:border-slate-800 dark:bg-slate-950"
                                  >
                                    <Link to={ROUTES.READER.replace(':id', book.id)}>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                      >
                                        <Play className="h-3.5 w-3.5 fill-current text-purple-600" />
                                        <span>Read</span>
                                      </button>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMovingBook(book)
                                        setMovingCollectionId(book.collectionId || 'none')
                                        setActiveMenuBookId(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                                      <span>Move to Collection</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRenamingBook(book)
                                        setRenameTitleInput(book.title)
                                        setActiveMenuBookId(null)
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Rename</span>
                                    </button>
                                    <a
                                      href={book.filePath}
                                      download
                                      className="block"
                                      onClick={() => setActiveMenuBookId(null)}
                                    >
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                      >
                                        <Download className="h-3.5 w-3.5 text-cyan-600" />
                                        <span>Download</span>
                                      </button>
                                    </a>
                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteBook(book.id, e)}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Book Modal */}
      <AnimatePresence>
        {renamingBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                  Rename Book
                </h3>
                <button
                  type="button"
                  onClick={() => setRenamingBook(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Book Title
                  </label>
                  <input
                    type="text"
                    required
                    value={renameTitleInput}
                    onChange={(e) => setRenameTitleInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Button size="sm" variant="outline" onClick={() => setRenamingBook(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    className="rounded-xl bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move to Collection Modal */}
      <AnimatePresence>
        {movingBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                  Move to Collection
                </h3>
                <button
                  type="button"
                  onClick={() => setMovingBook(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleMoveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Select Target Collection
                  </label>
                  <select
                    value={movingCollectionId}
                    onChange={(e) => setMovingCollectionId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-bold text-slate-800 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200"
                  >
                    <option value="none">Uncategorized (No Collection)</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Button size="sm" variant="outline" onClick={() => setMovingBook(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    className="rounded-xl bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                  >
                    Move Book
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
