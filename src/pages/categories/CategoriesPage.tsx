import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notificationsService } from '../../services/notifications'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  Folder,
  ArrowRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit3,
  X,
  FolderPlus,
  Search,
  Users,
  ExternalLink,
  AlertTriangle,
  Library,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

// Subtle pastel accent themes for collection folder icons
const PASTEL_THEMES = [
  {
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-900/60',
    badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
  },
  {
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/60',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  },
  {
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/60',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900/60',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
  },
  {
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-900/60',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
  },
]

const getPastelTheme = (index: number) => {
  return PASTEL_THEMES[index % PASTEL_THEMES.length]
}

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return 'Updated recently'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Updated recently'
  const now = new Date()
  const diffMs = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Updated Today'
  if (diffDays === 1) return 'Updated Yesterday'
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()

  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null)
  const [selectedColBooks, setSelectedColBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('')

  // Create & Rename Modal Unified States
  const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [collectionNameInput, setCollectionNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const modalInputRef = useRef<HTMLInputElement>(null)

  // Custom Confirmation Delete Modal State
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch collections & books
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const cols = await collectionsService.getCollections()
        const allBooks = await booksService.getBooks()
        if (!active) return

        setCollections(cols)
        setBooks(allBooks)

        if (selectedCol) {
          const updatedCol = cols.find((c) => c.id === selectedCol.id) || null
          setSelectedCol(updatedCol)
          if (updatedCol) {
            const bookIds = await collectionsService.getCollectionBooks(updatedCol.id)
            if (!active) return
            setSelectedColBooks(allBooks.filter((b) => bookIds.includes(b.id)))
          } else {
            setSelectedColBooks([])
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading collections:', err)
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [selectedCol, refreshTrigger])

  // Autofocus modal input when modal opens
  useEffect(() => {
    if (modalMode) {
      setTimeout(() => {
        modalInputRef.current?.focus()
      }, 50)
    }
  }, [modalMode])

  const handleViewDetails = async (col: Collection) => {
    setSelectedCol(col)
    const bookIds = await collectionsService.getCollectionBooks(col.id)
    setSelectedColBooks(books.filter((b) => bookIds.includes(b.id)))
  }

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingCollectionId(null)
    setCollectionNameInput('')
    setNameError(null)
  }

  // Open Rename Modal
  const handleOpenRenameModal = (col: Collection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setModalMode('rename')
    setEditingCollectionId(col.id)
    setCollectionNameInput(col.name)
    setNameError(null)
  }

  // Save (Create or Rename) Collection Submit Handler
  const handleSaveCollectionModal = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = collectionNameInput.trim()
    if (!trimmed) {
      setNameError('Collection name cannot be empty.')
      return
    }

    // Duplicate check (ignore case & current ID if renaming)
    const isDuplicate = collections.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editingCollectionId
    )
    if (isDuplicate) {
      setNameError('A collection with this name already exists.')
      return
    }

    setIsSubmittingModal(true)
    try {
      if (modalMode === 'create') {
        await collectionsService.createCollection(trimmed)
        notificationsService
          .addNotification('collection', 'Collection Created 📁', `Shelf "${trimmed}" is ready.`)
          .catch((err) => console.error(err))
        showSuccess(`Collection "${trimmed}" created successfully! 📁`)
      } else if (modalMode === 'rename' && editingCollectionId) {
        await collectionsService.renameCollection(editingCollectionId, trimmed)
        showSuccess('Collection renamed successfully! ✏️')
      }
      setModalMode(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save collection'
      showError(msg)
    } finally {
      setIsSubmittingModal(false)
    }
  }

  // Confirm Delete Handler
  const handleConfirmDeleteCollection = async () => {
    if (!deletingCollection) return
    setIsDeleting(true)
    try {
      await collectionsService.deleteCollection(deletingCollection.id)
      if (selectedCol?.id === deletingCollection.id) {
        setSelectedCol(null)
        setSelectedColBooks([])
      }
      setRefreshTrigger((prev) => prev + 1)
      showInfo(`Collection "${deletingCollection.name}" deleted.`)
      setDeletingCollection(null)
    } catch (err) {
      console.error(err)
      showError('Failed to delete collection.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddBookToCol = async (bookId: string) => {
    if (!selectedCol) return
    try {
      await collectionsService.addBookToCollection(selectedCol.id, bookId)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveBookFromCol = async (bookId: string) => {
    if (!selectedCol) return
    try {
      await collectionsService.removeBookFromCollection(selectedCol.id, bookId)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
    }
  }

  // Search Filter logic: Name or Books inside collection
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections
    const q = searchQuery.trim().toLowerCase()

    return collections.filter((col) => {
      const nameMatch = col.name.toLowerCase().includes(q)
      const colBooks = books.filter((b) => b.collectionId === col.id)
      const bookMatch = colBooks.some(
        (b) => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
      )
      return nameMatch || bookMatch
    })
  }, [collections, books, searchQuery])

  // Get formatted last updated string for a collection
  const getCollectionLastUpdated = (cat: Collection, colBooks: Book[]) => {
    if (colBooks.length === 0) return formatLastUpdated(cat.createdAt)
    let latestTime = new Date(cat.createdAt).getTime()
    colBooks.forEach((b) => {
      const t = new Date(b.lastReadAt || b.createdAt).getTime()
      if (!isNaN(t) && t > latestTime) latestTime = t
    })
    return formatLastUpdated(new Date(latestTime).toISOString())
  }

  // Candidates to add to current collection
  const availableBooksToAdd = books.filter((b) => !selectedColBooks.some((scb) => scb.id === b.id))

  return (
    <PageWrapper className="relative min-h-screen space-y-6 pb-20 text-left select-none">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Collections
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Organize your digital bookshelf into structured folders ({collections.length}{' '}
            {collections.length === 1 ? 'collection' : 'collections'})
          </p>
        </div>

        {!selectedCol && (
          <Button
            size="md"
            onClick={handleOpenCreateModal}
            leftIcon={<FolderPlus className="h-4 w-4" />}
            className="rounded-2xl bg-purple-600 font-bold text-white shadow-xs transition-all hover:bg-purple-700"
          >
            Create Collection
          </Button>
        )}
      </div>

      {/* Search Bar (Only shown on main collections view) */}
      {!selectedCol && (
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-purple-600 dark:text-purple-400" />
          <input
            type="text"
            placeholder="Search collections by name or contained books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 bg-white py-2.5 pr-10 pl-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-xs transition-all focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          /* Loading Skeletons */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-44 flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-6 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </motion.div>
        ) : selectedCol ? (
          /* ==================================================
             COLLECTION DETAIL / INSIDE SHELF VIEW
             ================================================== */
          <motion.div
            key="collection-details"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="space-y-6"
          >
            {/* Back button & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedCol(null)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-purple-300 hover:text-purple-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-purple-900 dark:hover:text-purple-400"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Collections</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenRenameModal(selectedCol)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCollection(selectedCol)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Collection</span>
                </button>
              </div>
            </div>

            {/* Collection Info Banner */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <Folder className="h-7 w-7" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-sans text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedCol.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Created {new Date(selectedCol.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-extrabold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                {selectedColBooks.length} {selectedColBooks.length === 1 ? 'Book' : 'Books'}
              </span>
            </div>

            {/* Books inside shelf & Add books sidebar */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Collection Books list */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Books in this collection ({selectedColBooks.length})
                </h3>

                {selectedColBooks.length === 0 ? (
                  /* PREMIUM EMPTY COLLECTION STATE */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto max-w-md space-y-5 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      <Folder className="h-8 w-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        No books in this collection
                      </h3>
                      <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400">
                        Add books from My Library to start organizing your library.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(ROUTES.LIBRARY)}
                      leftIcon={<Plus className="h-4 w-4" />}
                      className="rounded-2xl bg-purple-600 font-bold text-white shadow-xs hover:bg-purple-700"
                    >
                      Add Books
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedColBooks.map((book) => (
                      <div
                        key={book.id}
                        className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-xs transition-all hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                      >
                        <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100 shadow-2xs dark:border-slate-800 dark:bg-slate-950">
                          {book.coverPath ? (
                            <img
                              src={book.coverPath}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                            className="block truncate text-xs font-bold text-slate-900 transition-colors hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
                          >
                            {book.title}
                          </Link>
                          <p className="mt-0.5 truncate text-[10.5px] font-semibold text-slate-400">
                            By {book.author || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Link
                            to={ROUTES.READER.replace(':id', book.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-purple-600 dark:hover:bg-slate-800 dark:hover:text-purple-400"
                            title="Open Reader"
                          >
                            <ArrowRight className="h-4.5 w-4.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookFromCol(book.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                            title="Remove from Collection"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Add Sidebar */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Add Library Books
                </h3>

                {availableBooksToAdd.length === 0 ? (
                  <p className="pt-2 text-xs font-semibold text-slate-400 italic">
                    All books in your library are already in this collection.
                  </p>
                ) : (
                  <div className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {availableBooksToAdd.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-9 w-6 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200/60 bg-slate-100 shadow-2xs dark:border-slate-800 dark:bg-slate-950">
                            {book.coverPath ? (
                              <img
                                src={book.coverPath}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                              {book.title}
                            </h4>
                            <p className="truncate text-[10px] font-semibold text-slate-400">
                              {book.author || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddBookToCol(book.id)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:hover:bg-purple-900/60"
                          title="Add to Collection"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ==================================================
             MAIN COLLECTIONS GRID VIEW
             ================================================== */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {filteredCollections.length === 0 ? (
              searchQuery ? (
                /* Search Empty State */
                <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No matching collections found
                  </h3>
                  <p className="text-xs text-slate-400">
                    Try searching with a different name or book title.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="rounded-xl font-bold"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                /* No Collections Created Yet */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <Library className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      No Collections Yet
                    </h3>
                    <p className="mx-auto max-w-xs text-xs font-semibold text-slate-400">
                      Create custom folders to organize your books into structured shelves.
                    </p>
                  </div>
                  <Button
                    size="md"
                    onClick={handleOpenCreateModal}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="rounded-2xl bg-purple-600 font-bold text-white hover:bg-purple-700"
                  >
                    Create First Collection
                  </Button>
                </motion.div>
              )
            ) : (
              /* COLLECTIONS CARDS GRID (Equal Height, Hover Actions, Pastel Icons) */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCollections.map((cat, idx) => {
                  const colBooks = books.filter((b) => b.collectionId === cat.id)
                  const totalBooks = colBooks.length
                  const authorsSet = new Set(colBooks.map((b) => b.author).filter(Boolean))
                  const totalAuthors = authorsSet.size
                  const theme = getPastelTheme(idx)
                  const lastUpdatedStr = getCollectionLastUpdated(cat, colBooks)

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleViewDetails(cat)}
                      className="group relative flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-900/60"
                    >
                      {/* Top Row: Pastel Folder Icon & Compact Hover Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${theme.bg} ${theme.text} ${theme.border}`}
                        >
                          <Folder className="h-6 w-6" />
                        </div>

                        {/* Compact actions revealed ONLY on hover */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(cat)
                            }}
                            className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-purple-100 hover:text-purple-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-950/60 dark:hover:text-purple-400"
                            title="Open Collection"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenRenameModal(cat, e)}
                            className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            title="Rename Collection"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingCollection(cat)
                            }}
                            className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
                            title="Delete Collection"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Title & Info */}
                      <div className="my-4 space-y-1">
                        <h3 className="line-clamp-1 font-sans text-base font-extrabold text-slate-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400">
                          {lastUpdatedStr}
                        </p>
                      </div>

                      {/* Footer Stats Row: Total Books & Total Authors */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10.5px] font-bold dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold ${theme.badge}`}
                          >
                            <BookOpen className="h-3 w-3" />
                            {totalBooks} {totalBooks === 1 ? 'Book' : 'Books'}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                            <Users className="h-3 w-3 text-slate-400" />
                            {totalAuthors} {totalAuthors === 1 ? 'Author' : 'Authors'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================
         UNIFIED CREATE / RENAME COLLECTION MODAL
         ================================================== */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="font-sans text-sm font-extrabold tracking-wider text-slate-900 uppercase dark:text-white">
                {modalMode === 'create' ? 'Create Collection' : 'Rename Collection'}
              </h3>

              <form onSubmit={handleSaveCollectionModal} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Collection Name
                  </label>
                  <input
                    ref={modalInputRef}
                    type="text"
                    required
                    value={collectionNameInput}
                    onChange={(e) => {
                      setCollectionNameInput(e.target.value)
                      if (nameError) setNameError(null)
                    }}
                    placeholder="e.g. Computer Science, Research"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                  {nameError && (
                    <p className="text-[11px] font-bold text-rose-500">{nameError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalMode(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingModal || !collectionNameInput.trim()}
                    className="rounded-xl bg-purple-600 font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmittingModal
                      ? 'Saving...'
                      : modalMode === 'create'
                        ? 'Create'
                        : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================
         DELETE CONFIRMATION MODAL
         ================================================== */}
      <AnimatePresence>
        {deletingCollection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-extrabold text-slate-900 dark:text-white">
                    Delete this collection?
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    "{deletingCollection.name}"
                  </p>
                </div>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                Books will <strong className="text-slate-700 dark:text-slate-200">NOT</strong> be deleted. Only the collection will be removed.
              </p>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingCollection(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleConfirmDeleteCollection}
                  className="rounded-xl bg-rose-600 font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Collection'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
