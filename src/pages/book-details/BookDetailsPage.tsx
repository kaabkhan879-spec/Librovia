import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Download,
  Tag,
  Star,
  Play,
  Activity,
  Bookmark,
  MessageSquare,
  Info,
  Trash2,
  Edit2,
  X,
  Plus,
  Search,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { notesService, type Note } from '../../services/notes'
import { formatBytes } from '../../utils/helpers'

interface BookDetails {
  id: string
  title: string
  subtitle?: string
  author: string
  publisher: string
  category: string
  language: string
  pubYear: number
  rating: number
  reviewsCount: number
  progress: number
  currentPage: number
  totalPages: number
  lastOpened: string
  estTimeRemaining: string
  streak: number
  description: string
  fileSize: string
  fileType: 'PDF' | 'EPUB'
  uploadedDate: string
  lastModified: string
  tags: string[]
  stats: {
    hoursRead: number
    pagesRead: number
    sessions: number
    completion: number
    avgTime: string
  }
  timeline: { event: string; date: string }[]
  cover: string
}

const AVAILABLE_TAGS = ['Important', 'Motivation', 'Exam', 'Research', 'Favorite', 'Personal']

const mapBookToDetails = (b: Book, collectionName: string): BookDetails => {
  const fileExt = b.filePath.toLowerCase().split('?')[0].split('.').pop()?.toUpperCase() || 'PDF'

  const pagesLeft = Math.max(0, b.totalPages - b.currentPage)
  const minsLeft = pagesLeft * 2
  const estTimeRemaining =
    minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m` : `${minsLeft}m`

  const uploadDate = new Date(b.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const updateDate = new Date(b.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const categoryName = collectionName

  const lastOpenedStr = b.lastReadAt
    ? new Date(b.lastReadAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not started'

  return {
    id: b.id,
    title: b.title,
    subtitle: '',
    author: b.author,
    publisher: 'Library Upload',
    category: categoryName,
    language: 'English',
    pubYear: new Date(b.createdAt).getFullYear(),
    rating: 4.8,
    reviewsCount: 0,
    progress: b.progress,
    currentPage: b.currentPage,
    totalPages: b.totalPages,
    lastOpened: lastOpenedStr,
    estTimeRemaining: estTimeRemaining || '30m',
    streak: 1,
    description: b.description || 'No description provided.',
    fileSize: formatBytes(b.fileSize),
    fileType: fileExt === 'EPUB' ? 'EPUB' : 'PDF',
    uploadedDate: uploadDate,
    lastModified: updateDate,
    tags: b.tags || [],
    stats: {
      hoursRead: Math.round(((b.currentPage * 2) / 60) * 10) / 10,
      pagesRead: b.currentPage,
      sessions: 1,
      completion: b.progress,
      avgTime: '2m per page',
    },
    timeline: [
      { event: 'Uploaded to cloud library cabinet', date: uploadDate },
      { event: 'Last opened checkpoint', date: updateDate },
    ],
    cover:
      b.coverPath ||
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80',
  }
}

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [book, setBook] = useState<BookDetails | null>(null)
  const [rawBook, setRawBook] = useState<Book | null>(null)
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])

  // Layout states
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isDescCollapsed, setIsDescCollapsed] = useState(true)
  const [activeDetailsTab, setActiveDetailsTab] = useState<'overview' | 'notes'>('overview')

  // Reading Journal states
  const [bookNotes, setBookNotes] = useState<Note[]>([])
  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [modalRating, setModalRating] = useState<number | undefined>(undefined)
  const [modalNoteText, setModalNoteText] = useState('')
  const [modalHighlightText, setModalHighlightText] = useState('')
  const [modalBookmark, setModalBookmark] = useState(false)
  const [modalTags, setModalTags] = useState<string[]>([])
  const [modalPageNumber, setModalPageNumber] = useState<number>(1)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  // Success toast
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fetchNotes = useCallback(() => {
    if (!id) return
    notesService
      .getNotesForBook(id)
      .then((data) => {
        setBookNotes(data)
      })
      .catch((err) => {
        console.error('Error fetching book notes:', err)
      })
  }, [id])

  const showNotification = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  useEffect(() => {
    if (!id) return

    Promise.all([booksService.getBookById(id), collectionsService.getCollections()])
      .then(async ([data, cols]) => {
        if (!data) {
          setErrorMsg('Book not found or access denied.')
          setLoading(false)
          return
        }
        setCollections(cols)
        setRawBook(data)
        setIsFavorite(data.isFavorite)

        const col = cols.find((c) => c.id === data.collectionId)
        const colName = col ? col.name : 'Classics'

        const details = mapBookToDetails(data, colName)
        setBook(details)

        try {
          const all = await booksService.getBooks()
          const matching = all
            .filter((b) => b.collectionId === data.collectionId && b.id !== data.id)
            .slice(0, 6)
          setRelatedBooks(matching)
        } catch (e) {
          console.error('Failed to load related books:', e)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg('Failed to load book details. Please check your network connection.')
        setLoading(false)
      })

    fetchNotes()
  }, [id, fetchNotes])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const handleToggleFavorite = async () => {
    if (!rawBook) return
    try {
      const fav = await booksService.toggleFavorite(rawBook.id)
      setIsFavorite(fav)
      showNotification(fav ? 'Added to favorites!' : 'Removed from favorites.')
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteBook = async () => {
    if (!rawBook) return
    if (!confirm('Are you sure you want to delete this book? This will permanently erase it.'))
      return
    try {
      await booksService.deleteBook(rawBook.id)
      navigate(ROUTES.LIBRARY)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadBook = () => {
    if (!rawBook) return
    window.open(rawBook.filePath, '_blank')
  }

  const handleOpenNoteModal = (note?: Note) => {
    if (note) {
      setEditingNoteId(note.id)
      setModalRating(note.rating)
      setModalNoteText(note.noteText)
      setModalHighlightText(note.highlightedText || '')
      setModalBookmark(note.isBookmarked)
      setModalTags(note.tags)
      setModalPageNumber(note.pageNumber)
    } else {
      setEditingNoteId(null)
      setModalRating(undefined)
      setModalNoteText('')
      setModalHighlightText('')
      setModalBookmark(false)
      setModalTags([])
      setModalPageNumber(1)
    }
    setIsNotesModalOpen(true)
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      const payload = {
        id: editingNoteId || undefined,
        bookId: id,
        pageNumber: modalPageNumber,
        noteText: modalNoteText,
        rating: modalRating,
        highlightedText: modalHighlightText || undefined,
        isBookmarked: modalBookmark,
        tags: modalTags,
      }

      await notesService.saveNote(payload)
      fetchNotes()
      setIsNotesModalOpen(false)
      showNotification(editingNoteId ? 'Note updated! 📒' : 'Note added! 📒')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      await notesService.deleteNote(noteId)
      fetchNotes()
      showNotification('Note deleted.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTag = (tag: string) => {
    setModalTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    return bookNotes.filter((note) => {
      const query = noteSearchQuery.toLowerCase()
      return (
        note.noteText.toLowerCase().includes(query) ||
        (note.highlightedText && note.highlightedText.toLowerCase().includes(query)) ||
        note.tags.some((t) => t.toLowerCase().includes(query))
      )
    })
  }, [bookNotes, noteSearchQuery])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary-600 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    )
  }

  if (errorMsg || !book) {
    return (
      <div className="min-h-screen space-y-6 pb-20 text-left select-none">
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.LIBRARY}
            className="text-text-muted hover:text-primary-600 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <p className="font-bold">Error loading book details</p>
          <p className="text-text-sub mt-2 text-xs font-normal">{errorMsg || 'Book not found.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="h-4.5 w-4.5 shrink-0 text-purple-600" />
          <span>Interactive UI Demos: Trigger skeleton loading states below.</span>
        </div>
        <div>
          <button
            onClick={handleSimulateLoader}
            className="border-slate-250 dark:text-slate-350 dark:hover:bg-slate-850 cursor-pointer rounded-xl border bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
          >
            Simulate Loading Skeletons
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSkeletonLoading ? (
          /* Loading Skeletons Layout */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            <div className="h-[300px] animate-pulse rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" />
            <div className="h-[450px] animate-pulse rounded-3xl border border-slate-100 bg-white p-8 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900" />
          </motion.div>
        ) : (
          /* Cinematic Layout */
          <motion.div
            key="details-canvas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Back to Library Navigation Header */}
            <div className="flex items-center justify-between">
              <Link
                to={ROUTES.LIBRARY}
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase transition-colors hover:text-purple-600"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Library</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
              {/* Left Column: Cover & Primary Action buttons */}
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs hover:border-purple-500/10 dark:border-slate-800 dark:bg-slate-900">
                  {/* Floating cover frame */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative aspect-[0.7/1] w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-100 shadow-xl"
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </motion.div>

                  {/* Stars rating widget */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {book.rating} • {book.reviewsCount} reviews
                    </span>
                  </div>

                  {/* Formatted action buttons */}
                  <div className="w-full space-y-2">
                    <Link to={ROUTES.READER.replace(':id', book.id)} className="block w-full">
                      <Button className="w-full justify-center gap-2 bg-purple-600 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:bg-purple-700">
                        <Play className="h-4 w-4 fill-white" />
                        Continue Reading
                      </Button>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleToggleFavorite}
                        className={`dark:border-slate-750 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold tracking-wider uppercase transition-colors dark:bg-slate-800 ${isFavorite ? 'border-red-200 bg-red-50/20 text-red-500' : 'text-slate-600 hover:bg-slate-50'} `}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'}`}
                        />
                        <span>Favorite</span>
                      </button>

                      <button
                        onClick={handleDownloadBook}
                        className="dark:border-slate-750 flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold tracking-wider text-slate-600 uppercase hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
                        title="Download Book File"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="space-y-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(ROUTES.LIBRARY)}
                      className="border-slate-250 flex h-9 cursor-pointer items-center justify-center rounded-xl border bg-slate-50 text-[10px] font-bold tracking-wider text-slate-600 uppercase transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                    >
                      Library List
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      className="border-slate-250 flex h-9 cursor-pointer items-center justify-center rounded-xl border bg-slate-50 text-[10px] font-bold tracking-wider text-slate-600 uppercase transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                    >
                      Toggle Star
                    </button>
                    <button
                      onClick={handleDownloadBook}
                      className="border-slate-250 flex h-9 cursor-pointer items-center justify-center rounded-xl border bg-slate-50 text-[10px] font-bold tracking-wider text-slate-600 uppercase transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={handleDeleteBook}
                      className="text-red-655 flex h-9 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-[10px] font-bold tracking-wider uppercase hover:bg-red-100"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete Book
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Information, Statistics, Description, Notes & Timeline */}
              <div className="space-y-6 lg:col-span-2">
                {/* 1. Header Information */}
                <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                  <div className="space-y-1">
                    <span className="inline-block rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-purple-600 uppercase dark:bg-purple-950/20">
                      {book.category}
                    </span>
                    <h2 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {book.title}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      By {book.author}
                    </p>
                  </div>

                  {/* Progress section */}
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-50 pt-4 sm:grid-cols-2 dark:border-slate-800/40">
                    <div className="space-y-2">
                      <div className="text-slate-550 dark:text-slate-350 flex justify-between text-[10px] font-bold tracking-wider uppercase">
                        <span>Reading Progress</span>
                        <span>{book.progress}% Completed</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <p className="font-mono text-[10px] leading-none text-slate-400">
                        Page {book.currentPage} of {book.totalPages}
                      </p>
                    </div>

                    <div className="dark:border-slate-850 flex items-start justify-between gap-4 border-l border-slate-50 pl-4 text-left">
                      <div>
                        <span className="block text-[8px] tracking-wider text-slate-400 uppercase">
                          Est. Remaining
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {book.estTimeRemaining}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] tracking-wider text-slate-400 uppercase">
                          Last opened
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {book.lastOpened}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Header Selectors */}
                <div className="flex rounded-2xl border border-slate-100 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <button
                    onClick={() => setActiveDetailsTab('overview')}
                    className={`flex-1 cursor-pointer rounded-xl py-2.5 text-center text-xs font-bold tracking-wider uppercase transition-all ${
                      activeDetailsTab === 'overview'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-550 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    📖 Overview & Specs
                  </button>
                  <button
                    onClick={() => setActiveDetailsTab('notes')}
                    className={`flex-1 cursor-pointer rounded-xl py-2.5 text-center text-xs font-bold tracking-wider uppercase transition-all ${
                      activeDetailsTab === 'notes'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-550 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    📒 My Notes ({bookNotes.length})
                  </button>
                </div>

                {/* Tab Content Canvas */}
                <AnimatePresence mode="wait">
                  {activeDetailsTab === 'overview' ? (
                    <motion.div
                      key="overview-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* 2. Synopsis Card */}
                      <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5 text-xs font-extrabold tracking-widest text-purple-600 uppercase dark:border-slate-800/40">
                          <BookOpen className="h-4.5 w-4.5" />
                          <span>Synopsis / About Book</span>
                        </h3>
                        <div className="space-y-3">
                          <p
                            className={`text-slate-650 dark:text-slate-350 font-sans text-xs leading-relaxed ${
                              isDescCollapsed ? 'line-clamp-3' : ''
                            }`}
                          >
                            {book.description}
                          </p>
                          <button
                            onClick={() => setIsDescCollapsed(!isDescCollapsed)}
                            className="cursor-pointer text-[10px] font-bold tracking-wider text-purple-600 uppercase hover:text-purple-700"
                          >
                            {isDescCollapsed ? 'Read More' : 'Collapse'}
                          </button>
                        </div>
                      </div>

                      {/* 3. Book Details Information Grid */}
                      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="border-b border-slate-50 pb-2.5 text-xs font-extrabold tracking-widest text-purple-600 uppercase dark:border-slate-800/40">
                          Technical Specifications
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {[
                            { label: 'Language', value: book.language },
                            { label: 'Publisher', value: book.publisher },
                            { label: 'Pub Year', value: book.pubYear },
                            { label: 'File Type', value: book.fileType },
                            { label: 'File Size', value: book.fileSize },
                            { label: 'Uploaded', value: book.uploadedDate },
                          ].map((spec, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="block text-[8px] tracking-wider text-slate-400 uppercase">
                                {spec.label}
                              </span>
                              <span className="dark:text-slate-350 block truncate text-xs font-bold text-slate-700">
                                {spec.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Pill Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {book.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-slate-655 dark:border-slate-850 inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-sans text-[10px] font-bold tracking-wider uppercase dark:bg-slate-800/50 dark:text-slate-400"
                            >
                              <Tag className="h-3 w-3 text-slate-400" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 4. Reading Statistics Widget */}
                      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="border-b border-slate-50 pb-2.5 text-xs font-extrabold tracking-widest text-purple-600 uppercase dark:border-slate-800/40">
                          Reading Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {[
                            { label: 'Hours Read', value: `${book.stats.hoursRead}h` },
                            { label: 'Pages Read', value: book.stats.pagesRead },
                            { label: 'Sessions logged', value: book.stats.sessions },
                            { label: 'Average session', value: book.stats.avgTime },
                          ].map((stat, idx) => (
                            <div
                              key={idx}
                              className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/20"
                            >
                              <span className="block text-[8px] tracking-wider text-slate-400 uppercase">
                                {stat.label}
                              </span>
                              <span className="block font-mono text-sm font-bold text-slate-700 dark:text-white">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 6. Activities Timeline */}
                      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5 text-xs font-extrabold tracking-widest text-purple-600 uppercase dark:border-slate-800/40">
                          <Activity className="h-4.5 w-4.5" />
                          <span>Book Activity Timeline</span>
                        </h3>
                        <div className="relative ml-2.5 space-y-4 border-l border-slate-100 pl-6 dark:border-slate-800">
                          {book.timeline.map((event, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute top-1 -left-[30px] h-2 w-2 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900" />
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-white">
                                  {event.event}
                                </p>
                                <p className="mt-0.5 font-mono text-[9px] text-slate-400">
                                  {event.date}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="notes-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Search box and create triggers */}
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/60 p-4 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="relative w-full max-w-xs shrink-0">
                          <Search className="absolute top-2.5 left-3.5 h-4.5 w-4.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search notes inside this book..."
                            value={noteSearchQuery}
                            onChange={(e) => setNoteSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pr-4 pl-10 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                          />
                        </div>

                        <button
                          onClick={() => handleOpenNoteModal()}
                          className="flex h-9.5 items-center justify-center gap-1.5 rounded-2xl bg-purple-600 px-4 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-purple-700"
                        >
                          <Plus className="h-4.5 w-4.5" />
                          Add Journal Note
                        </button>
                      </div>

                      {/* Display Notes grouped by page */}
                      {filteredNotes.length === 0 ? (
                        <div className="text-slate-550 flex h-48 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-100 bg-white text-sm dark:border-slate-800 dark:bg-slate-900">
                          <span>No notes recorded yet.</span>
                          <span className="text-[10px] text-slate-400">
                            Start adding insights using the editor or the "+ Add Journal Note"
                            trigger.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredNotes.map((note) => (
                            <div
                              key={note.id}
                              className="hover:border-purple-550/20 flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2.5 dark:border-slate-800/40">
                                <div className="flex items-center gap-3">
                                  {/* Clicking Page X opens reader directly */}
                                  <Link
                                    to={`${ROUTES.READER.replace(':id', book.id)}?page=${note.pageNumber}`}
                                    className="rounded-xl bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-600 uppercase transition-colors hover:bg-purple-100 dark:bg-purple-950/20 dark:text-purple-400"
                                  >
                                    Page {note.pageNumber} ↗
                                  </Link>

                                  {note.isBookmarked && (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-2 py-0.5 text-[8px] font-bold text-amber-600 uppercase dark:border-amber-900/20 dark:bg-amber-950/20">
                                      <Bookmark className="h-3 w-3 fill-amber-500 text-amber-500" />
                                      Bookmarked
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenNoteModal(note)}
                                    className="hover:text-slate-655 rounded p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    title="Edit Note"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                    title="Delete Note"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {note.rating && (
                                  <div className="flex gap-0.5 text-amber-400">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                      <Star
                                        key={idx}
                                        className={`h-3.5 w-3.5 ${
                                          idx < note.rating!
                                            ? 'fill-current'
                                            : 'text-slate-200 dark:text-slate-800'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}

                                {note.highlightedText && (
                                  <div className="border-l-2 border-purple-400 bg-slate-50 py-1 pl-3.5 font-serif text-xs leading-relaxed text-slate-700 italic dark:bg-slate-800/40 dark:text-slate-300">
                                    "{note.highlightedText}"
                                  </div>
                                )}

                                <p className="text-xs leading-relaxed font-semibold text-slate-800 dark:text-slate-200">
                                  {note.noteText || (
                                    <em className="text-slate-400">
                                      No notes written (bookmark only).
                                    </em>
                                  )}
                                </p>

                                {note.tags && note.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 border-t border-slate-50 pt-1.5 dark:border-slate-800/20">
                                    {note.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded bg-slate-50 px-2 py-0.5 text-[8px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 8. Related Books Carousel horizontal */}
            {relatedBooks.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-400 uppercase">
                  Related books
                </h3>
                <div className="flex scrollbar-thin gap-6 overflow-x-auto pb-4">
                  {relatedBooks.map((item) => (
                    <Link
                      key={item.id}
                      to={`/books/${item.id}`}
                      className="flex w-64 flex-shrink-0 cursor-pointer gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:border-purple-500/20 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <img
                        src={
                          item.coverPath ||
                          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80'
                        }
                        alt={item.title}
                        onError={handleImageError}
                        className="aspect-[0.7/1] w-14 shrink-0 rounded border border-slate-200 object-cover shadow-xs dark:border-slate-800"
                      />
                      <div className="flex min-w-0 flex-col justify-between">
                        <div>
                          <span className="inline-block rounded bg-purple-50 px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider text-purple-600 uppercase dark:bg-purple-950/20">
                            {(() => {
                              const itemCol = collections.find((c) => c.id === item.collectionId)
                              return itemCol ? itemCol.name : 'Classics'
                            })()}
                          </span>
                          <h4 className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="dark:text-slate-450 mt-0.5 truncate text-[10px] text-slate-500">
                            By {item.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-slate-655 text-[9px] font-bold dark:text-slate-400">
                            4.8
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Note Edit / Create Modal dialog */}
      <AnimatePresence>
        {isNotesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/45 p-4 text-left backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4.5 flex items-center justify-between border-b border-slate-50 pb-2.5 dark:border-slate-800/40">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                    {editingNoteId ? 'Edit Journal Note' : 'Add Journal Note'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="hover:text-slate-650 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                {/* Page Number input if adding new note */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Page Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={book?.totalPages || 9999}
                    required
                    value={modalPageNumber}
                    onChange={(e) => setModalPageNumber(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Highlight text input */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Highlighted Clip (Optional)
                  </label>
                  <textarea
                    value={modalHighlightText}
                    onChange={(e) => setModalHighlightText(e.target.value)}
                    placeholder="Enter quote or select text inside the reader..."
                    className="min-h-16 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Rating Input */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Rating (Optional)
                  </span>
                  <div className="flex gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setModalRating(modalRating === star ? undefined : star)}
                        className="cursor-pointer text-slate-300 transition-all hover:scale-110 hover:text-amber-400"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            modalRating && modalRating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Thoughts & Insights
                  </label>
                  <textarea
                    required
                    value={modalNoteText}
                    onChange={(e) => setModalNoteText(e.target.value)}
                    placeholder="Describe your notes or learning details..."
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Tags selection */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => {
                      const active = modalTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`cursor-pointer rounded-xl border px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                            active
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bookmark Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="modal-bookmark"
                    checked={modalBookmark}
                    onChange={(e) => setModalBookmark(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-300 text-purple-600 accent-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="modal-bookmark"
                    className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Bookmark this page
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setIsNotesModalOpen(false)}
                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold tracking-wider text-slate-600 uppercase transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-purple-600 px-4.5 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-colors hover:bg-purple-700"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success action Toast notification overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed right-6 bottom-6 z-999 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xl dark:border-emerald-500/10 dark:bg-slate-900 dark:text-white"
          >
            <CheckCircle className="h-4.5 w-4.5 fill-emerald-500/10 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
