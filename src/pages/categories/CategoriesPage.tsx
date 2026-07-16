import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notificationsService } from '../../services/notifications'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  Folder,
  ArrowRight,
  Library,
  ChevronLeft,
  Plus,
  Trash2,
  Edit3,
  X,
  FolderPlus,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const CategoriesPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null)
  const [selectedColBooks, setSelectedColBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  // Creation/Edit states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameId, setRenameId] = useState('')
  const [renameName, setRenameName] = useState('')

  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
        console.error('Error loading collections shelves:', err)
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [selectedCol, refreshTrigger])

  const handleViewDetails = async (col: Collection) => {
    setSelectedCol(col)
    const bookIds = await collectionsService.getCollectionBooks(col.id)
    setSelectedColBooks(books.filter((b) => bookIds.includes(b.id)))
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    try {
      await collectionsService.createCollection(newColName.trim())
      notificationsService
        .addNotification(
          'collection',
          'Collection Created 📁',
          `Shelf "${newColName.trim()}" is now ready.`
        )
        .catch((e) => console.error(e))
      setNewColName('')
      setShowCreateModal(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection'
      alert(msg)
    }
  }

  const handleRenameCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameName.trim() || !renameId) return
    try {
      await collectionsService.renameCollection(renameId, renameName.trim())
      setRenameName('')
      setRenameId('')
      setShowRenameModal(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to rename collection'
      alert(msg)
    }
  }

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this collection?')) return
    try {
      await collectionsService.deleteCollection(id)
      if (selectedCol?.id === id) {
        setSelectedCol(null)
        setSelectedColBooks([])
      }
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      console.error(err)
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

  // Candidates to add are books that are NOT currently in the selected collection
  const availableBooksToAdd = books.filter((b) => !selectedColBooks.some((scb) => scb.id === b.id))

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header section */}
      <div className="border-border-light flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
            Collections Shelves
          </h1>
          <p className="text-text-muted text-xs font-semibold tracking-wider uppercase">
            Organize your files inside separate index tags.
          </p>
        </div>
        {!selectedCol && (
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex shrink-0 items-center gap-1.5 font-bold tracking-wider uppercase shadow-sm"
          >
            <FolderPlus className="h-4.5 w-4.5" />
            <span>Create Collection</span>
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* Loading skeletons */
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
                className="border-border-base bg-bg-surface flex h-40 animate-pulse flex-col justify-between rounded-2xl border p-6"
              >
                <div className="bg-border-light h-10 w-10 rounded-xl" />
                <div className="bg-border-light mt-4 h-4 w-2/3 rounded" />
                <div className="bg-border-light h-3 w-1/3 rounded" />
              </div>
            ))}
          </motion.div>
        ) : selectedCol ? (
          /* Collection Details View */
          <motion.div
            key="collection-details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Back button and Details Title */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setSelectedCol(null)}
                className="hover:bg-bg-app text-text-main border-border-base bg-bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Collections</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRenameId(selectedCol.id)
                    setRenameName(selectedCol.name)
                    setShowRenameModal(true)
                  }}
                  className="hover:bg-bg-app text-text-sub border-border-base bg-bg-surface flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={(e) => handleDeleteCollection(selectedCol.id, e)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-red-600 uppercase transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Shelf</span>
                </button>
              </div>
            </div>

            {/* Collection Info Card */}
            <div className="bg-bg-surface border-border-base flex flex-col items-start justify-between gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md">
                  <Folder className="h-7 w-7" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-text-main font-sans text-xl font-extrabold tracking-tight uppercase">
                    {selectedCol.name}
                  </h2>
                  <p className="text-text-muted text-[10px]">
                    Created on {new Date(selectedCol.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-200/20 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-sm">
                {selectedColBooks.length} {selectedColBooks.length === 1 ? 'Book' : 'Books'}
              </span>
            </div>

            {/* Shelf Items list and additions zone */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Collection Books list */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-text-muted border-border-light border-b pb-2 text-xs font-bold tracking-wider uppercase">
                  Books on this shelf ({selectedColBooks.length})
                </h3>

                {selectedColBooks.length === 0 ? (
                  <div className="border-border-base bg-bg-surface/30 text-text-sub space-y-2 rounded-2xl border border-dashed py-12 text-center">
                    <BookOpen className="text-text-muted mx-auto h-8 w-8" />
                    <p className="text-xs font-bold">This collection shelf is empty</p>
                    <p className="text-text-muted mx-auto max-w-xs text-[10px]">
                      Use the panel to the right to add your library books to this shelf.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedColBooks.map((book) => (
                      <div
                        key={book.id}
                        className="bg-bg-surface border-border-base flex items-center gap-3 rounded-2xl border p-3.5 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="border-border-light bg-bg-app flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded border shadow-sm">
                          {book.coverPath ? (
                            <img
                              src={book.coverPath}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BookOpen className="text-text-muted h-4.5 w-4.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                            className="hover:text-primary-600 text-text-main block truncate text-xs font-bold"
                          >
                            {book.title}
                          </Link>
                          <p className="text-text-muted mt-0.5 truncate text-[10px]">
                            By {book.author}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Link
                            to={ROUTES.READER.replace(':id', book.id)}
                            className="text-text-muted hover:text-primary-600 hover:bg-bg-app cursor-pointer rounded-lg p-1.5 transition-colors"
                            title="Open Reader"
                          >
                            <ArrowRight className="h-4.5 w-4.5" />
                          </Link>
                          <button
                            onClick={() => handleRemoveBookFromCol(book.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                            title="Remove from Shelf"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Books Sidebar */}
              <div className="space-y-4">
                <h3 className="text-text-muted border-border-light border-b pb-2 text-xs font-bold tracking-wider uppercase">
                  Add Books to Shelf
                </h3>

                {availableBooksToAdd.length === 0 ? (
                  <p className="text-text-muted pt-2 text-[10px] italic">
                    All books in your library are already in this collection.
                  </p>
                ) : (
                  <div className="bg-bg-surface border-border-base divide-border-light max-h-[420px] divide-y overflow-hidden overflow-y-auto rounded-2xl border shadow-sm">
                    {availableBooksToAdd.map((book) => (
                      <div
                        key={book.id}
                        className="hover:bg-bg-app/50 flex items-center justify-between gap-3 p-3.5 text-left transition-colors"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="border-border-light bg-bg-app flex h-9 w-6 shrink-0 items-center justify-center overflow-hidden rounded border shadow-sm">
                            {book.coverPath ? (
                              <img
                                src={book.coverPath}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="text-text-muted h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-text-main truncate text-xs font-semibold">
                              {book.title}
                            </h4>
                            <p className="text-text-muted truncate text-[10px]">{book.author}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddBookToCol(book.id)}
                          className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 hover:bg-primary-100 cursor-pointer rounded-lg p-1.5 shadow-sm transition-colors"
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
          /* Collections Grid list view */
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {collections.length === 0 ? (
              /* Empty collections state */
              <motion.div
                variants={itemVariants}
                className="border-border-base bg-bg-surface mx-auto max-w-md space-y-6 rounded-3xl border-2 border-dashed p-12 text-center shadow-sm"
              >
                <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mx-auto flex h-12 w-12 items-center justify-center rounded-xl shadow-inner">
                  <Library className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-text-main text-sm font-bold">No Collections Formed</h3>
                  <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                    Create custom shelf tags and categorize library materials to structure shelves.
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  Create New Collection
                </Button>
              </motion.div>
            ) : (
              /* Grid Layout */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {collections.map((cat, idx) => {
                  const gradients = [
                    'from-blue-500 to-indigo-600',
                    'from-purple-500 to-pink-600',
                    'from-violet-500 to-fuchsia-600',
                    'from-cyan-500 to-blue-600',
                    'from-emerald-500 to-teal-600',
                  ]
                  const color = gradients[idx % gradients.length]
                  return (
                    <motion.div
                      key={cat.id}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      onClick={() => handleViewDetails(cat)}
                      className="relative bg-bg-surface border-border-base hover:border-primary-500/20 group flex h-48 cursor-pointer flex-col justify-between rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md"
                    >
                      {/* Folder tab design decoration */}
                      <div className="absolute top-0 left-6 -translate-y-[1px] bg-bg-surface border-t border-x border-border-base rounded-t-xl h-2 w-16" />

                      <div className="flex items-start justify-between">
                        <div
                          className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${color} flex shrink-0 items-center justify-center text-white shadow-md`}
                        >
                          <Folder className="h-5.5 w-5.5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenameId(cat.id)
                              setRenameName(cat.name)
                              setShowRenameModal(true)
                            }}
                            className="text-text-muted hover:text-text-main hover:bg-bg-app rounded p-1 transition-colors"
                            title="Rename"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCollection(cat.id, e)}
                            className="text-text-muted rounded p-1 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display stacked preview covers of first 3 books on this shelf */}
                      <div className="flex -space-x-2.5 my-1.5 overflow-hidden items-center h-10 select-none">
                        {(() => {
                          const shelfBooks = books.filter((b) => b.collectionId === cat.id)
                          const covers = shelfBooks
                            .slice(0, 3)
                            .map((b) => b.coverPath)
                            .filter(Boolean)
                          if (covers.length > 0) {
                            return covers.map((cover, cIdx) => (
                              <img
                                key={cIdx}
                                src={cover}
                                alt=""
                                className="w-6.5 h-9 object-cover rounded-md border border-white dark:border-slate-800 shadow-xs ring-1 ring-black/5 transform rotate-[-4deg]"
                              />
                            ))
                          }
                          return (
                            <span className="text-[10px] text-text-muted font-bold tracking-wide italic pl-1">
                              Empty Shelf
                            </span>
                          )
                        })()}
                      </div>

                      <div className="flex items-end justify-between border-t border-border-light pt-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-text-main group-hover:text-primary-600 truncate text-xs font-extrabold tracking-wider uppercase transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-text-muted mt-0.5 text-[9px]">Private Collection</p>
                        </div>
                        <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-200/10 rounded-lg border px-2.5 py-1 text-[10px] font-bold shadow-sm">
                          {cat.bookCount || 0} {cat.bookCount === 1 ? 'Book' : 'Books'}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE COLLECTION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-surface border-border-base relative w-full max-w-sm space-y-4 rounded-2xl border p-6 text-left shadow-2xl"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:bg-bg-app hover:text-text-main absolute top-4 right-4 rounded-lg p-1.5"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                Create Collection
              </h3>

              <form onSubmit={handleCreateCollection} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="e.g. Science Fiction, Research Paper"
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 focus:ring-primary-500 w-full rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all outline-none focus:ring-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Create
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENAME COLLECTION MODAL */}
      <AnimatePresence>
        {showRenameModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-surface border-border-base relative w-full max-w-sm space-y-4 rounded-2xl border p-6 text-left shadow-2xl"
            >
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-text-muted hover:bg-bg-app hover:text-text-main absolute top-4 right-4 rounded-lg p-1.5"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <h3 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                Rename Collection
              </h3>

              <form onSubmit={handleRenameCollection} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    New Name
                  </label>
                  <input
                    type="text"
                    required
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    placeholder="Enter new shelf title"
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 focus:ring-primary-500 w-full rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all outline-none focus:ring-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRenameModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Rename
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
