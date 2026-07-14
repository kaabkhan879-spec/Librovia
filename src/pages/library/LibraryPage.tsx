import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import {
  BookOpen,
  Search,
  Plus,
  Play,
  Star,
  BookMarked,
  Info,
  List,
  Grid,
  ArrowUpDown,
  X,
  Heart,
  FolderHeart,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { formatBytes } from '../../utils/helpers'

type FilterType = 'all' | 'reading' | 'completed' | 'favorites' | 'pdf' | 'epub' | 'recent'
type SortType = 'newest' | 'oldest' | 'a-z' | 'recently-opened'

export const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [bookCollections, setBookCollections] = useState<Record<string, string[]>>({})
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [recentThreshold] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Pagination states
  const [page, setPage] = useState(1)
  const pageSize = 12

  const fetchBooksAndCollections = async () => {
    try {
      const booksData = await booksService.getBooks()
      const cols = await collectionsService.getCollections()
      setCollections(cols)

      const associations = await collectionsService.getBookCollectionsMap()
      booksData.forEach((book) => {
        if (book.collectionId) {
          if (!associations[book.id]) associations[book.id] = []
          if (!associations[book.id].includes(book.collectionId)) {
            associations[book.id].push(book.collectionId)
          }
        }
      })

      setBookCollections(associations)
      setBooks(booksData)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch library details:', err)
      setErrorMsg('Failed to load library collection. Please check your network connection.')
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const booksData = await booksService.getBooks()
        const cols = await collectionsService.getCollections()
        if (!active) return
        setCollections(cols)

        const associations = await collectionsService.getBookCollectionsMap()
        booksData.forEach((book) => {
          if (book.collectionId) {
            if (!associations[book.id]) associations[book.id] = []
            if (!associations[book.id].includes(book.collectionId)) {
              associations[book.id].push(book.collectionId)
            }
          }
        })

        if (!active) return
        setBookCollections(associations)
        setBooks(booksData)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch library details:', err)
        if (active) {
          setErrorMsg('Failed to load library collection. Please check your network connection.')
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const isFav = await booksService.toggleFavorite(id)
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, isFavorite: isFav } : b)))
      if (selectedBook && selectedBook.id === id) {
        setSelectedBook((prev) => (prev ? { ...prev, isFavorite: isFav } : null))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return
    try {
      await booksService.deleteBook(id)
      setSelectedBook(null)
      fetchBooksAndCollections()
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleCollection = async (collectionId: string, bookId: string) => {
    try {
      const inCol = bookCollections[bookId]?.includes(collectionId)
      if (inCol) {
        await collectionsService.removeBookFromCollection(collectionId, bookId)
        setBookCollections((prev) => ({
          ...prev,
          [bookId]: prev[bookId].filter((id) => id !== collectionId),
        }))
      } else {
        await collectionsService.addBookToCollection(collectionId, bookId)
        setBookCollections((prev) => ({
          ...prev,
          [bookId]: [...(prev[bookId] || []), collectionId],
        }))
      }
      const cols = await collectionsService.getCollections()
      setCollections(cols)
    } catch (err) {
      console.error('Failed to toggle book collection membership:', err)
    }
  }

  const getCollectionName = useCallback(
    (colId: string | undefined) => {
      const col = collections.find((c) => c.id === colId)
      return col ? col.name : 'Classics'
    },
    [collections]
  )

  // Filter & Sort Logic
  const filteredBooks = useMemo(() => {
    const result = books.filter((book) => {
      if (selectedCollectionId) {
        const belongs = bookCollections[book.id]?.includes(selectedCollectionId)
        if (!belongs) return false
      }

      const categoryName = getCollectionName(book.collectionId)

      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (activeFilter === 'reading') return book.progress > 0 && book.progress < 100
      if (activeFilter === 'completed') return book.progress === 100
      if (activeFilter === 'favorites') return book.isFavorite
      if (activeFilter === 'pdf') return book.filePath.toLowerCase().split('?')[0].endsWith('.pdf')
      if (activeFilter === 'epub')
        return book.filePath.toLowerCase().split('?')[0].endsWith('.epub')
      if (activeFilter === 'recent') {
        const addedTime = new Date(book.createdAt).getTime()
        return addedTime > recentThreshold
      }

      return true
    })

    // Sort mappings
    return result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title)
      if (sortBy === 'oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'recently-opened')
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return 0
    })
  }, [
    books,
    searchQuery,
    activeFilter,
    sortBy,
    recentThreshold,
    selectedCollectionId,
    bookCollections,
    getCollectionName,
  ])

  // Paginated books for display
  const paginatedBooks = useMemo(() => {
    return filteredBooks.slice(0, page * pageSize)
  }, [filteredBooks, page, pageSize])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const filterPills: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Books' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'reading', label: 'Reading' },
    { id: 'completed', label: 'Completed' },
    { id: 'pdf', label: 'PDF' },
    { id: 'epub', label: 'EPUB' },
    { id: 'recent', label: 'Recently Added' },
  ]

  // Stats calculation
  const totalBooks = books.length
  const currentlyReading = books.filter((b) => b.progress > 0 && b.progress < 100).length
  const completedBooks = books.filter((b) => b.progress === 100).length
  const favoritesCount = books.filter((b) => b.isFavorite).length

  const statsData = [
    { title: 'Total Books', value: String(totalBooks), icon: BookOpen, color: 'text-indigo-500' },
    {
      title: 'Currently Reading',
      value: String(currentlyReading),
      icon: BookMarked,
      color: 'text-cyan-500',
    },
    {
      title: 'Completed Books',
      value: String(completedBooks),
      icon: CheckCircle,
      color: 'text-emerald-500',
    },
    { title: 'Favorites', value: String(favoritesCount), icon: Heart, color: 'text-red-500' },
  ]

  const recentlyOpened = useMemo(() => {
    return [...books]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
  }, [books])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
  }

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Error Alert Display */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          Error: {errorMsg}
        </div>
      )}

      {/* Simulation Tools Row */}
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
            {isEmptyState ? 'Show Real Library' : 'Show Empty States'}
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
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-64 animate-pulse flex-col justify-between rounded-2xl border p-4"
              >
                <div className="bg-border-light h-32 rounded" />
                <div className="bg-border-light mt-4 h-4 w-2/3 rounded" />
                <div className="bg-border-light h-3 w-1/3 rounded" />
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
              <h3 className="text-text-main text-lg font-bold">No books found</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                Upload your first book to start building your library.
              </p>
            </div>
            <Link to={ROUTES.UPLOAD} className="inline-block">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload Book</Button>
            </Link>
          </motion.div>
        ) : (
          /* Real Library Interface */
          <motion.div
            key="library-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                  My Library
                </h1>
                <p className="text-text-muted mt-1 text-xs font-semibold tracking-wider uppercase">
                  Manage and organize your personal digital collection.
                </p>
              </div>

              <div className="flex gap-3">
                <Link to={ROUTES.UPLOAD}>
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
                    Upload Book
                  </Button>
                </Link>
              </div>
            </div>

            {/* Statistics row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statsData.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  className="bg-bg-surface border-border-base hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[9px] leading-none font-bold tracking-wider uppercase">
                      {stat.title}
                    </span>
                    <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                  </div>
                  <h3 className="text-text-main mt-3 text-2xl leading-none font-extrabold">
                    {stat.value}
                  </h3>
                </motion.div>
              ))}
            </div>

            {/* Recently Opened Scroll */}
            {recentlyOpened.length > 0 && (
              <div>
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Recently Opened
                </h3>
                <div className="flex scrollbar-thin gap-4 overflow-x-auto pb-4 select-none">
                  {recentlyOpened.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="bg-bg-surface border-border-base hover:border-primary-500/20 flex w-64 flex-shrink-0 cursor-pointer gap-4 rounded-2xl border p-3 text-left shadow-sm transition-all"
                    >
                      <img
                        src={
                          book.coverPath ||
                          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                        }
                        alt={book.title}
                        onError={handleImageError}
                        className="border-border-light aspect-[0.7/1] w-12 shrink-0 rounded border object-cover shadow-sm"
                      />
                      <div className="flex min-w-0 flex-col justify-between">
                        <div>
                          <h4 className="text-text-main truncate text-xs font-bold">
                            {book.title}
                          </h4>
                          <p className="text-text-muted mt-0.5 truncate text-[10px]">
                            {book.author}
                          </p>
                        </div>
                        <Link
                          to={ROUTES.READER.replace(':id', book.id)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="text-primary-600 flex items-center gap-1 text-[9px] font-bold uppercase hover:underline">
                            <Play className="fill-primary-600 stroke-primary-600 h-3 w-3" />
                            Open
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters and Sorting Toolbar */}
            <div className="border-border-base flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-1.5">
                {filterPills.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setActiveFilter(pill.id)
                      setPage(1)
                    }}
                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                      activeFilter === pill.id
                        ? 'bg-primary-600 border-primary-600 shadow-primary-500/10 text-white shadow-sm'
                        : 'bg-bg-surface border-border-base text-text-sub hover:bg-bg-app'
                    } `}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search and Sort */}
              <div className="flex items-center gap-3 self-stretch md:self-auto">
                <div className="relative flex-1 rounded-lg shadow-sm md:w-60 md:flex-none">
                  <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search books..."
                    className="border-border-base bg-bg-surface text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border py-1.5 pr-3 pl-8 text-xs transition-all focus:ring-2 focus:outline-none"
                  />
                </div>

                <div className="border-border-base bg-bg-surface relative flex items-center rounded-lg border px-2 py-1">
                  <ArrowUpDown className="text-text-muted mr-1.5 h-3.5 w-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortType)
                      setPage(1)
                    }}
                    className="text-text-sub cursor-pointer border-none bg-transparent pr-4 text-xs font-bold focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="a-z">A - Z</option>
                    <option value="recently-opened">Recently Opened</option>
                  </select>
                </div>

                <div className="border-border-base bg-bg-surface flex overflow-hidden rounded-lg border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`hover:bg-bg-app cursor-pointer p-1.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-text-muted'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`hover:bg-bg-app cursor-pointer p-1.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-text-muted'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {selectedCollectionId && (
              <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-text-main mb-6 flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <FolderHeart className="text-primary-600 h-4.5 w-4.5" />
                  <span>
                    Showing collection:{' '}
                    <strong className="uppercase">
                      {collections.find((c) => c.id === selectedCollectionId)?.name || 'Unknown'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCollectionId(null)}
                  className="text-text-muted hover:text-text-main cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            )}

            {/* Books display area (Grid / List views) */}
            <AnimatePresence mode="wait">
              {filteredBooks.length === 0 ? (
                <motion.div
                  key="no-filter-match"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-text-sub border-border-base bg-bg-surface/30 space-y-2 rounded-2xl border border-dashed py-12 text-center"
                >
                  <FolderHeart className="text-text-muted mx-auto h-8 w-8" />
                  <p className="text-xs font-bold">No matching books found</p>
                </motion.div>
              ) : viewMode === 'grid' ? (
                /* Grid layout */
                <motion.div
                  key="grid-shelf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {paginatedBooks.map((book) => {
                    return (
                      <motion.div
                        key={book.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedBook(book)}
                        className="bg-bg-surface border-border-base hover:border-primary-500/20 flex h-64 cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          <img
                            src={
                              book.coverPath ||
                              'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                            }
                            alt={book.title}
                            onError={handleImageError}
                            className="border-border-light aspect-[0.7/1] w-16 shrink-0 rounded border object-cover shadow"
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase">
                                {getCollectionName(book.collectionId)}
                              </span>
                              {book.progress === 100 && (
                                <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider text-emerald-600 uppercase dark:bg-emerald-500/10">
                                  Completed
                                </span>
                              )}
                            </div>
                            <h4 className="text-text-main truncate text-xs font-bold">
                              {book.title}
                            </h4>
                            <p className="text-text-sub truncate text-[10px]">By {book.author}</p>
                            {book.lastReadAt && (
                              <p className="text-text-muted mt-0.5 font-mono text-[8px] leading-none">
                                Opened {new Date(book.lastReadAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress and bottom actions bar */}
                        <div className="border-border-light mt-3 space-y-3 border-t pt-3">
                          <div>
                            <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold tracking-wider uppercase">
                              <span>Pages read</span>
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
                              onClick={(e) => toggleStar(book.id, e)}
                              className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                            >
                              <Star
                                className={`h-4 w-4 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                              />
                            </button>

                            <div className="flex gap-1.5">
                              <Link
                                to={ROUTES.READER.replace(':id', book.id)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="bg-primary-600 hover:bg-primary-700 flex h-7 cursor-pointer items-center rounded-lg px-3.5 text-[9px] font-bold tracking-wider text-white uppercase transition-colors">
                                  Read
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                /* List layout */
                <motion.div
                  key="list-shelf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-bg-surface border-border-base divide-border-light divide-y overflow-hidden rounded-2xl border shadow-sm"
                >
                  {paginatedBooks.map((book) => {
                    return (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="hover:bg-bg-app flex cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <img
                            src={
                              book.coverPath ||
                              'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                            }
                            alt={book.title}
                            onError={handleImageError}
                            className="border-border-light aspect-[0.7/1] w-9 shrink-0 rounded border object-cover shadow-sm"
                          />
                          <div className="min-w-0 flex-1 items-center gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3">
                            <div>
                              <h4 className="text-text-main truncate text-xs font-bold">
                                {book.title}
                              </h4>
                              <p className="text-text-muted mt-0.5 truncate text-[10px]">
                                By {book.author}
                              </p>
                              {book.lastReadAt && (
                                <p className="text-text-muted mt-0.5 font-mono text-[8px] leading-none">
                                  Opened {new Date(book.lastReadAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="hidden sm:flex sm:items-center sm:gap-2">
                              <span className="text-text-sub text-[10px] font-semibold">
                                {getCollectionName(book.collectionId)}
                              </span>
                              {book.progress === 100 && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider text-emerald-600 uppercase dark:bg-emerald-500/10">
                                  Completed
                                </span>
                              )}
                            </div>
                            <span className="text-text-muted hidden font-mono text-[9px] md:inline-block">
                              {formatBytes(book.fileSize)}
                            </span>
                          </div>
                        </div>

                        {/* Progress and star */}
                        <div className="flex shrink-0 items-center gap-6">
                          <div className="hidden w-24 sm:block">
                            <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold uppercase">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="bg-border-light h-1 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-primary-600 h-full"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={(e) => toggleStar(book.id, e)}
                            className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Load More control */}
            {filteredBooks.length > paginatedBooks.length && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  variant="outline"
                  size="sm"
                  className="animate-fade-in font-bold tracking-wider uppercase"
                >
                  Load More Books
                </Button>
              </div>
            )}

            {/* Collections Section */}
            <div>
              <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                My Collections
              </h3>
              {collections.length === 0 ? (
                <div className="border-border-base bg-bg-surface/30 text-text-sub rounded-2xl border border-dashed py-8 text-center text-xs">
                  No collections created yet. Go to{' '}
                  <Link to={ROUTES.COLLECTIONS} className="text-primary-600 hover:underline">
                    Collections page
                  </Link>{' '}
                  to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((col, idx) => {
                    const gradients = [
                      'from-blue-500 to-indigo-600',
                      'from-purple-500 to-pink-600',
                      'from-violet-500 to-fuchsia-600',
                      'from-cyan-500 to-blue-600',
                      'from-emerald-500 to-teal-600',
                    ]
                    const color = gradients[idx % gradients.length]
                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedCollectionId(col.id)}
                        className="group border-border-base bg-bg-surface hover:border-primary-500/20 flex h-36 cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${color} flex shrink-0 items-center justify-center text-white shadow-md`}
                          >
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-1.5 py-0.5 text-[10px] font-bold">
                            Collection
                          </span>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                          <h4 className="text-text-main truncate text-xs font-bold tracking-wider uppercase">
                            {col.name}
                          </h4>
                          <span className="text-text-muted font-mono text-[10px] font-bold">
                            {col.bookCount || 0} {col.bookCount === 1 ? 'Book' : 'Books'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Details Sliding Drawer Panel */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-999 flex justify-end bg-slate-950/20 backdrop-blur-xs select-none">
            <div className="absolute inset-0" onClick={() => setSelectedBook(null)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-bg-surface border-border-base relative z-10 flex h-full w-full max-w-md flex-col justify-between overflow-y-auto border-l p-6 text-left shadow-2xl sm:p-8"
            >
              <div className="space-y-6">
                <div className="border-border-light flex items-center justify-between border-b pb-4">
                  <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
                    Book Details
                  </span>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-text-muted hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-1.5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-start gap-5">
                  <img
                    src={
                      selectedBook.coverPath ||
                      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={selectedBook.title}
                    onError={handleImageError}
                    className="border-border-light aspect-[0.7/1] w-24 shrink-0 rounded-lg border object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                      {getCollectionName(selectedBook.collectionId)}
                    </span>
                    <h3 className="text-text-main text-base leading-snug font-extrabold tracking-tight break-words">
                      {selectedBook.title}
                    </h3>
                    <p className="text-text-sub text-xs font-semibold">By {selectedBook.author}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-text-muted font-mono text-[9px] font-bold">
                        {selectedBook.totalPages} Pages
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    Synopsis
                  </h4>
                  <p className="text-text-sub font-sans text-xs leading-relaxed">
                    {selectedBook.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    My Collections
                  </h4>
                  {collections.length === 0 ? (
                    <p className="text-text-muted text-[10px] italic">
                      No collections created yet. Go to{' '}
                      <Link
                        to={ROUTES.COLLECTIONS}
                        onClick={() => setSelectedBook(null)}
                        className="text-primary-600 hover:underline"
                      >
                        Collections page
                      </Link>{' '}
                      to create one.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {collections.map((col) => {
                        const inCollection =
                          bookCollections[selectedBook.id]?.includes(col.id) || false
                        return (
                          <button
                            key={col.id}
                            onClick={() => handleToggleCollection(col.id, selectedBook.id)}
                            className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all ${
                              inCollection
                                ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-500/10 dark:border-primary-500/30 dark:text-primary-400'
                                : 'border-border-base bg-bg-surface text-text-sub hover:bg-bg-app'
                            }`}
                          >
                            {col.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-bg-app border-border-light grid grid-cols-2 gap-4 rounded-xl border p-4">
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Progress
                    </span>
                    <span className="text-text-main mt-0.5 block text-xs font-bold">
                      {selectedBook.progress}% Read
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      File Size
                    </span>
                    <span className="text-text-main mt-0.5 block text-xs font-bold">
                      {formatBytes(selectedBook.fileSize)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="border-border-light mt-6 flex flex-col gap-3 border-t pt-6">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      toggleStar(selectedBook.id, e)
                    }}
                    className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-bold tracking-wider uppercase"
                  >
                    <Star
                      className={`h-4.5 w-4.5 ${selectedBook.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                    />
                    <span>Favorite</span>
                  </button>
                  <Link
                    to={ROUTES.READER.replace(':id', selectedBook.id)}
                    onClick={() => setSelectedBook(null)}
                    className="flex-1"
                  >
                    <Button className="w-full justify-center py-2.5 text-xs font-bold tracking-wider uppercase">
                      Read Book
                    </Button>
                  </Link>
                </div>

                <button
                  onClick={() => handleDeleteBook(selectedBook.id)}
                  className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-red-50 text-xs font-bold tracking-wider text-red-600 uppercase hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Book</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
