import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
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
  Info,
  List,
  Grid,
  Trash2,
  Download,
  FolderOpen,
  MoreVertical,
  Edit2,
  Calendar,
  X,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

type SortType = 'newest' | 'oldest' | 'a-z' | 'recently-opened'

export const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')

  // Context Menu & Modal States
  const [activeMenuBookId, setActiveMenuBookId] = useState<string | null>(null)
  const [renamingBook, setRenamingBook] = useState<Book | null>(null)
  const [renameTitleInput, setRenameTitleInput] = useState('')
  const [movingBook, setMovingBook] = useState<Book | null>(null)
  const [movingCollectionId, setMovingCollectionId] = useState('')

  const menuRef = useRef<HTMLDivElement | null>(null)

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
    if (!confirm('Are you sure you want to delete this book? This will permanently remove it.'))
      return
    try {
      await booksService.deleteBook(id)
      fetchBooksAndCollections()
      setActiveMenuBookId(null)
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
      return col ? col.name : 'Classics'
    },
    [collections]
  )

  // Extract unique authors
  const uniqueAuthors = useMemo(() => {
    const authorsSet = new Set(books.map((b) => b.author).filter(Boolean))
    return Array.from(authorsSet)
  }, [books])

  // Filter & Sort Logic
  const filteredBooks = useMemo(() => {
    const result = books.filter((book) => {
      // 1. Search Query
      const categoryName = getCollectionName(book.collectionId)
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // 2. Collection Filter
      if (selectedCollectionId !== 'all') {
        if (book.collectionId !== selectedCollectionId) return false
      }

      // 3. Author Filter
      if (selectedAuthor !== 'all') {
        if (book.author !== selectedAuthor) return false
      }

      return true
    })

    // 4. Sorting
    return result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title)
      if (sortBy === 'oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'recently-opened') {
        const timeA = new Date(a.lastReadAt || a.updatedAt || a.createdAt).getTime()
        const timeB = new Date(b.lastReadAt || b.updatedAt || b.createdAt).getTime()
        return timeB - timeA
      }
      return 0
    })
  }, [books, searchQuery, selectedCollectionId, selectedAuthor, sortBy, getCollectionName])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
  }

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="h-4.5 w-4.5 shrink-0 text-purple-600" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts below.</span>
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
            {isEmptyState ? 'Show Real Library' : 'Show Empty States'}
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          My Library
        </h1>
        <p className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400">
          Manage, organize and access all your books.
        </p>
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
                className="flex h-64 animate-pulse flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-32 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
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
                📚 Your library is empty
              </h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Upload your first book to start building your personal library.
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
            className="space-y-6"
          >
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/60 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-full max-w-xs shrink-0">
                  <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Collection Filter */}
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="all">📁 All Collections</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>

                {/* Author Filter */}
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="all">✍ All Authors</option>
                  {uniqueAuthors.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  <option value="newest">↕ Newest Added</option>
                  <option value="oldest">↕ Oldest Added</option>
                  <option value="a-z">↕ Alphabetical (A-Z)</option>
                  <option value="recently-opened">↕ Recently Opened</option>
                </select>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {/* Grid/List Toggle */}
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-800/40">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`cursor-pointer rounded-xl p-1.5 transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'} `}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`cursor-pointer rounded-xl p-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'} `}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Upload Book button */}
                <Link to={ROUTES.UPLOAD}>
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Upload Book</Button>
                </Link>
              </div>
            </div>

            {/* Book Display List/Grid Canvas */}
            {filteredBooks.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-white/40 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                <span>No books match your criteria. Try adjusting filters or search string.</span>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout Rendering */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="group/card relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4.5 text-left shadow-xs transition-all duration-300 hover:border-purple-500/20 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative aspect-[0.7/1] w-full animate-none overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-xs dark:border-slate-800 dark:bg-slate-950/20">
                      <img
                        src={book.coverPath}
                        alt={book.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      {/* Action buttons drawer overlay */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/card:opacity-100">
                        <button
                          onClick={(e) => toggleStar(book.id, e)}
                          className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-xl border border-slate-100/50 bg-white/95 text-slate-400 shadow-sm backdrop-blur-xs transition-colors hover:text-amber-500 dark:border-slate-800/50 dark:bg-slate-900/95"
                        >
                          <Star
                            className={`h-4.5 w-4.5 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                          />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuBookId(activeMenuBookId === book.id ? null : book.id)
                            }}
                            className="flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-xl border border-slate-100/50 bg-white/95 text-slate-500 shadow-sm backdrop-blur-xs transition-colors hover:text-slate-700 dark:border-slate-800/50 dark:bg-slate-900/95 dark:hover:text-white"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>

                          {/* Context menu */}
                          {activeMenuBookId === book.id && (
                            <div
                              ref={menuRef}
                              className="absolute top-9 right-0 z-40 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 text-xs font-semibold shadow-xl dark:border-slate-800 dark:bg-slate-950"
                            >
                              <Link to={ROUTES.READER.replace(':id', book.id)}>
                                <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                  <Play className="h-3.5 w-3.5 fill-current text-purple-600" />
                                  Open
                                </button>
                              </Link>
                              <button
                                onClick={() => {
                                  setMovingBook(book)
                                  setMovingCollectionId(book.collectionId || 'none')
                                  setActiveMenuBookId(null)
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                                Move to Collection
                              </button>
                              <button
                                onClick={() => {
                                  setRenamingBook(book)
                                  setRenameTitleInput(book.title)
                                  setActiveMenuBookId(null)
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                                Rename
                              </button>
                              <a
                                href={book.filePath}
                                download
                                className="block"
                                onClick={() => setActiveMenuBookId(null)}
                              >
                                <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                  <Download className="h-3.5 w-3.5 text-cyan-600" />
                                  Download
                                </button>
                              </a>
                              <div className="dark:border-slate-850 my-1 border-t border-slate-50" />
                              <button
                                onClick={(e) => handleDeleteBook(book.id, e)}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                          {getCollectionName(book.collectionId)}
                        </span>
                        <h4 className="truncate text-xs font-bold text-slate-950 dark:text-white">
                          {book.title}
                        </h4>
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          By {book.author || 'Unknown'}
                        </p>
                      </div>

                      {/* Reading Progress Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] leading-none font-bold text-slate-400 uppercase">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-purple-600"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata Last read date */}
                      <div className="flex items-center gap-1 border-t border-slate-50 pt-1 text-[9px] font-semibold text-slate-400 dark:border-slate-800/40">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {book.lastReadAt
                            ? `Read ${new Date(book.lastReadAt).toLocaleDateString()}`
                            : 'Not read yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List Layout Rendering */
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="border-b border-slate-50 bg-slate-50/40 text-[10px] font-bold tracking-wider uppercase dark:border-slate-800/40 dark:bg-slate-800/20">
                    <tr>
                      <th className="px-6 py-4.5">Book</th>
                      <th className="px-6 py-4.5">Collection</th>
                      <th className="px-6 py-4.5">Author</th>
                      <th className="px-6 py-4.5">Progress</th>
                      <th className="px-6 py-4.5">Last read</th>
                      <th className="px-6 py-4.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {filteredBooks.map((book) => (
                      <tr
                        key={book.id}
                        className="transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/20"
                      >
                        <td className="flex items-center gap-3 px-6 py-4">
                          <img
                            src={book.coverPath}
                            alt=""
                            onError={handleImageError}
                            className="h-9 w-7 shrink-0 rounded object-cover shadow-xs"
                          />
                          <div className="min-w-0">
                            <span className="block max-w-[200px] truncate font-bold text-slate-900 md:max-w-[320px] dark:text-white">
                              {book.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                            {getCollectionName(book.collectionId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {book.author || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-purple-600"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">
                              {book.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-400">
                          {book.lastReadAt ? new Date(book.lastReadAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={(e) => toggleStar(book.id, e)}
                              className="flex items-center justify-center text-slate-400 hover:text-amber-500"
                            >
                              <Star
                                className={`h-4 w-4 ${book.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                              />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveMenuBookId(activeMenuBookId === book.id ? null : book.id)
                                }}
                                className="flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                              >
                                <MoreVertical className="h-4.5 w-4.5" />
                              </button>

                              {/* Context menu */}
                              {activeMenuBookId === book.id && (
                                <div
                                  ref={menuRef}
                                  className="absolute top-9 right-0 z-40 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 text-left text-xs font-semibold shadow-xl dark:border-slate-800 dark:bg-slate-950"
                                >
                                  <Link to={ROUTES.READER.replace(':id', book.id)}>
                                    <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                      <Play className="h-3.5 w-3.5 fill-current text-purple-600" />
                                      Open
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setMovingBook(book)
                                      setMovingCollectionId(book.collectionId || 'none')
                                      setActiveMenuBookId(null)
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                                    Move to Collection
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRenamingBook(book)
                                      setRenameTitleInput(book.title)
                                      setActiveMenuBookId(null)
                                    }}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                                    Rename
                                  </button>
                                  <a
                                    href={book.filePath}
                                    download
                                    className="block"
                                    onClick={() => setActiveMenuBookId(null)}
                                  >
                                    <button className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                                      <Download className="h-3.5 w-3.5 text-cyan-600" />
                                      Download
                                    </button>
                                  </a>
                                  <div className="dark:border-slate-85 my-1 border-t border-slate-50" />
                                  <button
                                    onClick={(e) => handleDeleteBook(book.id, e)}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50/50 dark:text-red-400 dark:hover:bg-red-950/20"
                                  >
                                    <Trash2 className="text-red-555 h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Rename Modal */}
      <AnimatePresence>
        {renamingBook && (
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
              className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                  Rename Book
                </h3>
                <button
                  onClick={() => setRenamingBook(null)}
                  className="hover:text-slate-650 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
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

      {/* 2. Move to Collection Modal */}
      <AnimatePresence>
        {movingBook && (
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
              className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                  Move to Collection
                </h3>
                <button
                  onClick={() => setMovingBook(null)}
                  className="hover:text-slate-650 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleMoveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Choose Shelf
                  </label>
                  <select
                    value={movingCollectionId}
                    onChange={(e) => setMovingCollectionId(e.target.value)}
                    className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                  >
                    <option value="none">Classics (Default)</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
                  <Button size="sm" variant="outline" onClick={() => setMovingBook(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    className="rounded-xl bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                  >
                    Confirm Move
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
