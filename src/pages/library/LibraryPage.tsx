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
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export type SortType = 'a-z' | 'newest' | 'recently-opened' | 'progress' | 'size'
export type FilterChip =
  'all' | 'pdf' | 'epub' | 'recently-added' | 'recently-read' | 'alphabetical'

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Search & Debounce
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Filter Chips & Sort state
  const [activeFilterChip, setActiveFilterChip] = useState<FilterChip>('all')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortType>('recently-opened')

  // Tab filter (from header or URL)
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'reading' | 'completed'>(() => {
    if (tabParam === 'favorites') return 'favorites'
    if (tabParam === 'reading') return 'reading'
    if (tabParam === 'completed') return 'completed'
    return 'all'
  })
  const [prevTabParam, setPrevTabParam] = useState<string | null>(tabParam)

  // Sync state if URL search param updates dynamically during render
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

  // Keyboard shortcut Ctrl+K to focus search bar
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
    return Array.from(authorsSet)
  }, [books])

  // Filter & Sort Engine (300ms Debounced & Optimized)
  const filteredBooks = useMemo(() => {
    let result = [...books]

    // 1. Tab Filter
    if (activeTab === 'favorites') {
      result = result.filter((b) => b.isFavorite)
    } else if (activeTab === 'reading') {
      result = result.filter((b) => b.progress > 0 && b.progress < 100)
    } else if (activeTab === 'completed') {
      result = result.filter((b) => b.progress === 100)
    }

    // 2. Filter Chip
    if (activeFilterChip === 'pdf') {
      result = result.filter((b) => getFileType(b.filePath) === 'PDF')
    } else if (activeFilterChip === 'epub') {
      result = result.filter((b) => getFileType(b.filePath) === 'EPUB')
    } else if (activeFilterChip === 'recently-added') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (activeFilterChip === 'recently-read') {
      result = result.filter((b) => b.progress > 0)
      result.sort((a, b) => {
        const timeA = new Date(a.lastReadAt || a.createdAt).getTime()
        const timeB = new Date(b.lastReadAt || b.createdAt).getTime()
        return timeB - timeA
      })
    } else if (activeFilterChip === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title))
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
    activeFilterChip,
    selectedCollectionId,
    selectedAuthor,
    sortBy,
    activeTab,
    getCollectionName,
  ])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
  }

  return (
    <PageWrapper className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            My Library
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Your personal digital bookshelf ({books.length} {books.length === 1 ? 'book' : 'books'})
          </p>
        </div>

        <Link to={ROUTES.UPLOAD}>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            className="rounded-2xl bg-purple-600 font-bold text-white shadow-xs transition-all hover:bg-purple-700"
          >
            Upload Book
          </Button>
        </Link>
      </div>

      {/* Main Tab Selectors & Filter Chips Bar */}
      <div className="space-y-4">
        {/* Tab Selectors */}
        <div className="flex max-w-lg self-start rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900/60">
          {[
            { id: 'all' as const, label: 'All Books' },
            { id: 'favorites' as const, label: 'Favorites ⭐' },
            { id: 'reading' as const, label: 'Reading 📖' },
            { id: 'completed' as const, label: 'Completed ✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="library-active-tab"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-slate-800"
                />
              )}
            </button>
          ))}
        </div>

        {/* Filter Chips Bar */}
        <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all' as const, label: 'All Formats' },
            { id: 'pdf' as const, label: 'PDF Documents' },
            { id: 'epub' as const, label: 'EPUB E-Books' },
            { id: 'recently-read' as const, label: 'Recently Read' },
            { id: 'recently-added' as const, label: 'Recently Added' },
            { id: 'alphabetical' as const, label: 'A – Z' },
          ].map((chip) => {
            const isSelected = activeFilterChip === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilterChip(chip.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'border border-slate-200/70 bg-white text-slate-600 hover:border-purple-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {chip.label}
              </button>
            )
          })}
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
                className="flex h-[360px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900"
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
          /* Premium Empty State */
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-lg space-y-6 rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
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
                className="rounded-2xl bg-purple-600 font-bold text-white hover:bg-purple-700"
              >
                Upload Your First Book
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* Real Library Grid / List Interface */
          <motion.div
            key="library-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Toolbar: Search, Collection, Author, Sort & View Mode */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                {/* Search Bar with 300ms Debounce */}
                <div className="relative w-full max-w-xs shrink-0">
                  <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    ref={searchBarRef}
                    type="text"
                    placeholder="Search title, author, tags... (Ctrl + K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-12 pl-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-sans text-[8px] font-bold text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-[9px]">⌘</span>K
                      </kbd>
                    </div>
                  )}
                </div>

                {/* Collection Filter Dropdown */}
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="all">📁 All Collections</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>

                {/* Author Filter Dropdown */}
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="all">✍ All Authors</option>
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
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="recently-opened">↕ Recently Opened</option>
                  <option value="newest">↕ Recently Uploaded</option>
                  <option value="a-z">↕ Alphabetical (A–Z)</option>
                  <option value="progress">↕ Reading Progress</option>
                  <option value="size">↕ File Size</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`cursor-pointer rounded-xl p-1.5 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`cursor-pointer rounded-xl p-1.5 transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Display Books Grid or List */}
            {filteredBooks.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                <Search className="mb-2 h-6 w-6 text-slate-300" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No books match your current filters or search query.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Try clearing search terms or selecting another category filter.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* ==================================================
                 REDESIGNED BOOK GRID CARDS
                 ================================================== */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredBooks.map((book) => {
                  const fileType = getFileType(book.filePath)
                  const sizeStr = formatFileSize(book.fileSize)

                  return (
                    <div
                      key={book.id}
                      onClick={() => navigate(ROUTES.READER.replace(':id', book.id))}
                      className="group/card relative flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                    >
                      {/* Top Cover Section */}
                      <div className="space-y-3">
                        <div className="relative aspect-[0.72/1] w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-100 shadow-xs dark:border-slate-800 dark:bg-slate-950/20">
                          <img
                            src={book.coverPath}
                            alt={book.title}
                            onError={handleImageError}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                          />

                          {/* Top Right Quick Action & Favorite Drawer */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(book.id, e)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white/95 text-slate-400 shadow-sm backdrop-blur-xs hover:text-amber-500 dark:border-slate-800/60 dark:bg-slate-900/95"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  book.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                                }`}
                              />
                            </button>

                            {/* Quick Actions Hover Menu Trigger */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuBookId(activeMenuBookId === book.id ? null : book.id)
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-white/95 text-slate-600 shadow-sm backdrop-blur-xs hover:text-purple-600 dark:border-slate-800/60 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:text-white"
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
                                  {/* Read */}
                                  <Link to={ROUTES.READER.replace(':id', book.id)}>
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Play className="h-3.5 w-3.5 fill-current text-purple-600" />
                                      <span>Read</span>
                                    </button>
                                  </Link>

                                  {/* Book Details */}
                                  <Link to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}>
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                      <Info className="h-3.5 w-3.5 text-indigo-600" />
                                      <span>Book Details</span>
                                    </button>
                                  </Link>

                                  {/* Move to Collection */}
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

                                  {/* Rename */}
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

                                  {/* Download (Offline) */}
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
                                      <span>Download (Offline)</span>
                                    </button>
                                  </a>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  {/* Delete */}
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

                          {/* File Type Badge (PDF / EPUB) */}
                          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur-xs">
                              {fileType}
                            </span>
                            <span className="rounded-md bg-slate-900/80 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-200 backdrop-blur-xs">
                              {sizeStr}
                            </span>
                          </div>
                        </div>

                        {/* Title & Author (STRICT 2-LINE CLAMPING) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[8.5px] font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              {getCollectionName(book.collectionId)}
                            </span>
                          </div>

                          <h4 className="line-clamp-2 text-xs leading-snug font-bold text-slate-900 transition-colors group-hover/card:text-purple-600 dark:text-white dark:group-hover/card:text-purple-400">
                            {book.title}
                          </h4>

                          <p className="truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                            By {book.author || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section: Progress Bar & Last Opened */}
                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800/60">
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
                              ? `Opened ${new Date(book.lastReadAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}`
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
                 REDESIGNED LIST VIEW
                 ================================================== */
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/40">
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
