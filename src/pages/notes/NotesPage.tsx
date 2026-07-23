import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { notesService, type Note } from '../../services/notes'
import { booksService, type Book } from '../../services/books'
import { notificationsService } from '../../services/notifications'
import { ROUTES } from '../../constants/routes'
import {
  MessageSquare,
  Search,
  BookOpen,
  Trash2,
  Save,
  Clock,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

type SortType = 'newest' | 'oldest' | 'page'

export const NotesPage: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const searchBarRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
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

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')

  // Selected note for editing/viewing pane
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitleInput, setNoteTitleInput] = useState('')
  const [noteTextInput, setNoteTextInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchData = useCallback(() => {
    Promise.all([notesService.getAllNotes(), booksService.getBooks()]).then(
      ([notesData, booksData]) => {
        setNotes(notesData)
        setBooks(booksData)
        setLoading(false)

        // Auto select first note if nothing is selected yet
        if (notesData.length > 0 && !selectedNote) {
          const sorted = [...notesData].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          handleSelectNote(sorted[0])
        }
      }
    )
  }, [selectedNote])

  useEffect(() => {
    fetchData()
  }, [])

  const getBookTitle = useCallback(
    (bookId: string) => {
      const found = books.find((b) => b.id === bookId)
      return found ? found.title : 'Unknown Book'
    },
    [books]
  )

  const getBookCover = useCallback(
    (bookId: string) => {
      const found = books.find((b) => b.id === bookId)
      return found ? found.coverPath : ''
    },
    [books]
  )

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setNoteTitleInput(note.noteTitle || '')
    setNoteTextInput(note.noteText || '')
    setSaveSuccess(false)
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNote) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const payload: Note = {
        ...selectedNote,
        noteTitle: noteTitleInput.trim() || undefined,
        noteText: noteTextInput,
        bookTitle: getBookTitle(selectedNote.bookId),
        updatedAt: new Date().toISOString(),
      }
      const updated = await notesService.saveNote(payload)

      // Update local lists
      setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? updated : n)))
      setSelectedNote(updated)
      setSaveSuccess(true)
      setIsSaving(false)
      showSuccess('Note Saved Successfully! 📝')

      notificationsService
        .addNotification(
          'note',
          'Note Updated 📝',
          `Changes saved on note from page ${selectedNote.pageNumber} of "${getBookTitle(selectedNote.bookId)}".`
        )
        .catch((e) => console.error(e))

      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error('Failed to update note:', err)
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      await notesService.deleteNote(id)
      const updatedNotes = notes.filter((n) => n.id !== id)
      setNotes(updatedNotes)
      showInfo('Note Deleted Successfully! 🗑️')

      notificationsService
        .addNotification(
          'note',
          'Note Deleted 🗑️',
          `An annotation from page ${selectedNote?.pageNumber || 1} has been deleted.`
        )
        .catch((e) => console.error(e))

      if (selectedNote?.id === id) {
        if (updatedNotes.length > 0) {
          handleSelectNote(updatedNotes[0])
        } else {
          setSelectedNote(null)
          setNoteTitleInput('')
          setNoteTextInput('')
        }
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  // Filter & Sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes]

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          (n.noteText && n.noteText.toLowerCase().includes(q)) ||
          (n.noteTitle && n.noteTitle.toLowerCase().includes(q)) ||
          (n.highlightedText && n.highlightedText.toLowerCase().includes(q)) ||
          getBookTitle(n.bookId).toLowerCase().includes(q)
      )
    }

    // 2. Book Selection Filter
    if (selectedBookId !== 'all') {
      result = result.filter((n) => n.bookId === selectedBookId)
    }

    // 3. Sorting
    return result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (sortBy === 'page') {
        if (a.bookId === b.bookId) {
          return a.pageNumber - b.pageNumber
        }
        return getBookTitle(a.bookId).localeCompare(getBookTitle(b.bookId))
      }
      // 'newest' default
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notes, searchQuery, selectedBookId, sortBy, getBookTitle])

  return (
    <PageWrapper className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Digital Notes
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Review, edit, and organize annotations from your reading sessions.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* Loading Skeleton */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            <div className="h-96 animate-pulse rounded-3xl border border-slate-100 bg-white lg:col-span-1 dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-96 animate-pulse rounded-3xl border border-slate-100 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900" />
          </motion.div>
        ) : notes.length === 0 ? (
          /* Empty Notes State */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Notes Logged</h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Create annotations, highlight texts, or drop bookmarks inside the Reader to log
                notes here.
              </p>
            </div>
            <Link to={ROUTES.LIBRARY} className="inline-block">
              <Button>Go to Library</Button>
            </Link>
          </motion.div>
        ) : (
          /* Real Notes Manager */
          <motion.div
            key="notes-manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3"
          >
            {/* Left Pane - Listing, Search & Filters */}
            <div className="space-y-4 lg:col-span-1">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-3">
                  {/* Search box */}
                  <div className="relative w-full">
                    <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      ref={searchBarRef}
                      type="text"
                      placeholder="Search note contents... (Ctrl + K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:border-purple-650 w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-12 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:bg-white focus:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <kbd className="dark:border-slate-850 dark:bg-slate-905 inline-flex items-center gap-0.5 rounded border border-slate-100 bg-white/90 px-1.5 font-sans text-[8px] font-bold text-slate-400 shadow-2xs">
                        <span className="text-[9px]">⌘</span>K
                      </kbd>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Book Filter */}
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-1/2 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-[10px] font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                    >
                      <option value="all">📖 All Books</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>

                    {/* Sorting dropdown */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortType)}
                      className="w-1/2 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-[10px] font-bold text-slate-700 outline-hidden transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                    >
                      <option value="newest">↕ Newest First</option>
                      <option value="oldest">↕ Oldest First</option>
                      <option value="page">↕ Page Order</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Note Cards List */}
              <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                {filteredNotes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No notes match the filter criteria.
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const isSelected = selectedNote?.id === note.id
                    return (
                      <div
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className={`cursor-pointer rounded-3xl border p-4.5 text-left shadow-xs transition-all duration-300 ${
                          isSelected
                            ? 'border-purple-650 bg-purple-50/20 shadow-sm'
                            : 'border-slate-100 bg-white hover:border-purple-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-purple-750 block truncate text-[9px] font-extrabold uppercase">
                            {getBookTitle(note.bookId)}
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Page {note.pageNumber}
                          </span>
                        </div>

                        <h4 className="mt-1.5 truncate text-xs font-extrabold text-slate-950 dark:text-white">
                          {note.noteTitle || 'Annotation'}
                        </h4>

                        {note.highlightedText && (
                          <p className="mt-1 line-clamp-1 border-l-2 border-purple-300 pl-2 text-[10px] text-slate-500 italic">
                            "{note.highlightedText}"
                          </p>
                        )}

                        <p className="text-slate-650 dark:text-slate-350 mt-2 line-clamp-2 text-xs font-medium">
                          {note.noteText || <em className="text-slate-400">Bookmark marker</em>}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-50/80 pt-2 dark:border-slate-800/40">
                          <span className="flex items-center gap-1 text-[8.5px] font-semibold text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(note.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <Link
                            to={`${ROUTES.READER.replace(':id', note.bookId)}?page=${note.pageNumber}&noteId=${note.id}`}
                            className="text-purple-650 text-[9px] font-bold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open Details →
                          </Link>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Pane - Note details editor */}
            <div className="lg:col-span-2">
              {selectedNote ? (
                <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                  {/* Note header information */}
                  <div className="flex flex-col gap-4 border-b border-slate-50 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="flex items-center gap-4 text-left">
                      <div className="border-slate-150 h-16 w-12 shrink-0 overflow-hidden rounded-lg border object-cover shadow-sm dark:border-slate-800">
                        {getBookCover(selectedNote.bookId) ? (
                          <img
                            src={getBookCover(selectedNote.bookId)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-purple-650 block text-[8.5px] font-extrabold tracking-wider uppercase">
                          {getBookTitle(selectedNote.bookId)}
                        </span>
                        <h2 className="text-text-main truncate font-sans text-sm leading-tight font-black">
                          Page {selectedNote.pageNumber} Annotation
                        </h2>
                        <span className="text-text-muted mt-0.5 block text-[9.5px] font-semibold">
                          Created {new Date(selectedNote.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`${ROUTES.READER.replace(':id', selectedNote.bookId)}?page=${selectedNote.pageNumber}`}
                        className="hover:bg-bg-app text-text-main border-border-base bg-bg-surface flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors"
                      >
                        <span>Jump to Page</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="flex cursor-pointer items-center justify-center rounded-xl bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                        title="Delete note"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights block if exists */}
                  {selectedNote.highlightedText && (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/15 p-4 text-left dark:border-purple-950/20 dark:bg-purple-950/5">
                      <span className="text-purple-650 block text-[9px] font-extrabold tracking-widest uppercase">
                        Highlighted text in reader
                      </span>
                      <p className="dark:text-slate-350 mt-1.5 font-serif text-sm leading-relaxed text-slate-700 italic">
                        "{selectedNote.highlightedText}"
                      </p>
                    </div>
                  )}

                  {/* Note Editing form */}
                  <form onSubmit={handleSaveNote} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        Note Title / Subject
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Core definition, Exam checklist"
                        value={noteTitleInput}
                        onChange={(e) => setNoteTitleInput(e.target.value)}
                        className="border-border-base bg-bg-app text-text-main focus:border-purple-650 focus:ring-purple-650 w-full rounded-2xl border px-4 py-2.5 text-xs font-semibold outline-hidden transition-all focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                        My Thoughts
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Type your notes, ideas or study reflections here..."
                        value={noteTextInput}
                        onChange={(e) => setNoteTextInput(e.target.value)}
                        className="border-border-base bg-bg-app text-text-main focus:border-purple-650 focus:ring-purple-650 w-full rounded-2xl border p-4 text-xs leading-relaxed font-medium outline-hidden transition-all focus:bg-white"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800/40">
                      <div className="flex items-center gap-1.5">
                        <AnimatePresence>
                          {saveSuccess && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-500"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Changes Synced
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSaving}
                        loading={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 font-bold text-white transition-colors hover:bg-purple-700"
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        {isSaving ? 'Syncing...' : 'Save Annotation'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="border-border-base bg-bg-surface flex h-80 items-center justify-center rounded-3xl border border-dashed text-sm text-slate-400">
                  <span>Select a note from the list to view or edit details.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
