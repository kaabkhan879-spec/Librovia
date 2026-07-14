import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
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

const mapBookToDetails = (b: Book, collectionName: string): BookDetails => {
  const fileExt = b.filePath.toLowerCase().split('?')[0].split('.').pop()?.toUpperCase() || 'PDF'

  // Calculate est time remaining based on progress (assume 2 minutes per page remaining)
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

  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isDescCollapsed, setIsDescCollapsed] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    Promise.resolve().then(() => {
      setLoading(true)
      setErrorMsg(null)
    })

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
  }, [id])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setComments((prev) => [...prev, commentText.trim()])
    setCommentText('')
  }

  const handleToggleFavorite = async () => {
    if (!rawBook) return
    try {
      const fav = await booksService.toggleFavorite(rawBook.id)
      setIsFavorite(fav)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteBook = async () => {
    if (!rawBook) return
    if (!confirm('Are you sure you want to delete this book?')) return
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
      <div className="bg-bg-surface border-border-base flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="text-primary-500 h-4.5 w-4.5 shrink-0" />
          <span>Interactive UI Demos: Trigger skeleton loading states below.</span>
        </div>
        <div>
          <button
            onClick={handleSimulateLoader}
            className="border-border-base bg-bg-app text-text-sub hover:bg-bg-surface cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors"
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
            <div className="border-border-base bg-bg-surface h-[300px] animate-pulse rounded-3xl border p-6" />
            <div className="border-border-base bg-bg-surface h-[450px] animate-pulse rounded-3xl border p-8 lg:col-span-2" />
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
                className="text-text-muted hover:text-primary-600 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Library</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
              {/* Left Column: Cover & Primary Action buttons */}
              <div className="space-y-6">
                <div className="bg-bg-surface border-border-base flex flex-col items-center gap-6 rounded-3xl border p-6 shadow-sm">
                  {/* Floating cover frame */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group border-border-base relative aspect-[0.7/1] w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border shadow-2xl"
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
                    <span className="text-text-muted text-[10px] font-bold">
                      {book.rating} • {book.reviewsCount} reviews
                    </span>
                  </div>

                  {/* Formatted action buttons */}
                  <div className="w-full space-y-2">
                    <Link to={ROUTES.READER.replace(':id', book.id)} className="block w-full">
                      <Button className="w-full justify-center gap-2 py-2.5 text-xs font-bold tracking-wider uppercase">
                        <Play className="h-4 w-4 fill-white" />
                        Continue Reading
                      </Button>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleToggleFavorite}
                        className={`border-border-base bg-bg-surface flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-colors ${isFavorite ? 'border-red-200 bg-red-50/20 text-red-500' : 'text-text-sub hover:bg-bg-app'} `}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-text-muted'}`}
                        />
                        <span>Favorite</span>
                      </button>

                      <button
                        onClick={handleDownloadBook}
                        className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase"
                        title="Download Book File"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="bg-bg-surface border-border-base space-y-2 rounded-3xl border p-5 shadow-sm">
                  <h4 className="text-text-muted mb-2 text-[10px] font-bold tracking-wider uppercase">
                    Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="border-border-base bg-bg-app hover:bg-bg-surface text-text-sub flex h-9 cursor-pointer items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider uppercase">
                      Edit
                    </button>
                    <button className="border-border-base bg-bg-app hover:bg-bg-surface text-text-sub flex h-9 cursor-pointer items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider uppercase">
                      Move
                    </button>
                    <button className="border-border-base bg-bg-app hover:bg-bg-surface text-text-sub flex h-9 cursor-pointer items-center justify-center rounded-lg border text-[10px] font-bold tracking-wider uppercase">
                      Export
                    </button>
                    <button
                      onClick={handleDeleteBook}
                      className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-[10px] font-bold tracking-wider text-red-600 uppercase hover:bg-red-100"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Information, Statistics, Description, Notes & Timeline */}
              <div className="space-y-6 lg:col-span-2">
                {/* 1. Header Information */}
                <div className="bg-bg-surface border-border-base space-y-3 rounded-3xl border p-6 shadow-sm sm:p-8">
                  <div className="space-y-1">
                    <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                      {book.category}
                    </span>
                    <h2 className="text-text-main font-sans text-2xl font-extrabold tracking-tight">
                      {book.title}
                    </h2>
                    {book.subtitle && (
                      <p className="text-text-muted font-sans text-xs leading-relaxed italic">
                        {book.subtitle}
                      </p>
                    )}
                    <p className="text-text-sub mt-1 text-xs font-semibold">By {book.author}</p>
                  </div>

                  {/* Progress section */}
                  <div className="border-border-light grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-text-sub flex justify-between text-[10px] font-bold tracking-wider uppercase">
                        <span>Reading Progress</span>
                        <span>{book.progress}% Completed</span>
                      </div>
                      <div className="bg-border-light h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary-600 h-full"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <p className="text-text-muted font-mono text-[10px] leading-none">
                        Page {book.currentPage} of {book.totalPages}
                      </p>
                    </div>

                    <div className="border-border-light flex items-start justify-between gap-4 border-l pl-4 text-left">
                      <div>
                        <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                          Est. Remaining
                        </span>
                        <span className="text-text-main mt-0.5 block text-xs font-bold">
                          {book.estTimeRemaining}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                          Last opened
                        </span>
                        <span className="text-text-main mt-0.5 block text-xs font-bold">
                          {book.lastOpened}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Synopsis Card */}
                <div className="bg-bg-surface border-border-base space-y-3 rounded-3xl border p-6 shadow-sm">
                  <h3 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <BookOpen className="h-4.5 w-4.5" />
                    <span>Synopsis / About Book</span>
                  </h3>
                  <div className="space-y-3">
                    <p
                      className={`text-text-sub font-sans text-xs leading-relaxed ${isDescCollapsed ? 'line-clamp-3' : ''}`}
                    >
                      {book.description}
                    </p>
                    <button
                      onClick={() => setIsDescCollapsed(!isDescCollapsed)}
                      className="text-primary-600 hover:text-primary-700 cursor-pointer text-[10px] font-bold tracking-wider uppercase"
                    >
                      {isDescCollapsed ? 'Read More' : 'Collapse'}
                    </button>
                  </div>
                </div>

                {/* 3. Book Details Information Grid */}
                <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 shadow-sm">
                  <h3 className="text-primary-600 border-border-light border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
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
                        <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                          {spec.label}
                        </span>
                        <span className="text-text-main block truncate text-xs font-bold">
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
                        className="bg-bg-app border-border-light text-text-sub inline-flex items-center gap-1 rounded border px-2.5 py-1 font-sans text-[10px] font-bold tracking-wider uppercase"
                      >
                        <Tag className="text-text-muted h-3 w-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Reading Statistics Widget */}
                <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm">
                  <h3 className="text-primary-600 border-border-light border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
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
                        className="bg-bg-app border-border-light space-y-1 rounded-xl border p-3"
                      >
                        <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                          {stat.label}
                        </span>
                        <span className="text-text-main block font-mono text-sm font-bold">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Notes, Highlights & Bookmarks tabs */}
                <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 shadow-sm">
                  <h3 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <Bookmark className="h-4.5 w-4.5" />
                    <span>Personal Highlights & Bookmarks</span>
                  </h3>
                  <div className="border-border-base text-text-sub bg-bg-app/40 space-y-2 rounded-2xl border border-dashed p-6 text-center">
                    <Bookmark className="text-text-muted mx-auto h-7 w-7" />
                    <p className="text-xs font-bold">No bookmarks yet</p>
                    <p className="text-text-muted text-[10px]">
                      Highlight text inside reader mode to record notes here.
                    </p>
                  </div>
                </div>

                {/* 6. Activities Timeline */}
                <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm">
                  <h3 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <Activity className="h-4.5 w-4.5" />
                    <span>Book Activity Timeline</span>
                  </h3>
                  <div className="border-border-base relative ml-2.5 space-y-4 border-l pl-6">
                    {book.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <span className="bg-primary-600 ring-bg-surface absolute top-1 -left-[30px] h-2 w-2 rounded-full ring-4" />
                        <div>
                          <p className="text-text-main text-xs font-bold">{event.event}</p>
                          <p className="text-text-muted mt-0.5 font-mono text-[9px]">
                            {event.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Comments / Study Notes */}
                <div className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 shadow-sm">
                  <h3 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <MessageSquare className="h-4.5 w-4.5" />
                    <span>Personal Study Notes</span>
                  </h3>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a personal note about this book..."
                      className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 flex-1 rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 flex h-9 cursor-pointer items-center rounded-lg px-4 text-xs font-bold tracking-wider text-white uppercase"
                    >
                      Post
                    </button>
                  </form>

                  <AnimatePresence>
                    {comments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-border-light space-y-2 border-t pt-2"
                      >
                        {comments.map((comment, idx) => (
                          <div
                            key={idx}
                            className="bg-bg-app border-border-light rounded-xl border p-3"
                          >
                            <p className="text-text-sub font-sans text-xs">{comment}</p>
                            <span className="text-text-muted mt-1 block font-mono text-[8px]">
                              Posted just now
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 8. Related Books Carousel horizontal */}
            {relatedBooks.length > 0 && (
              <div>
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Related books
                </h3>
                <div className="flex scrollbar-thin gap-6 overflow-x-auto pb-4">
                  {relatedBooks.map((item) => (
                    <Link
                      key={item.id}
                      to={`/books/${item.id}`}
                      className="bg-bg-surface border-border-base hover:border-primary-500/20 flex w-64 flex-shrink-0 cursor-pointer gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all"
                    >
                      <img
                        src={
                          item.coverPath ||
                          'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80'
                        }
                        alt={item.title}
                        onError={handleImageError}
                        className="border-border-light aspect-[0.7/1] w-14 shrink-0 rounded border object-cover shadow-sm"
                      />
                      <div className="flex min-w-0 flex-col justify-between">
                        <div>
                          <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider uppercase">
                            {(() => {
                              const itemCol = collections.find((c) => c.id === item.collectionId)
                              return itemCol ? itemCol.name : 'Classics'
                            })()}
                          </span>
                          <h4 className="text-text-main mt-1 truncate text-xs font-bold">
                            {item.title}
                          </h4>
                          <p className="text-text-sub mt-0.5 truncate text-[10px]">
                            By {item.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-text-sub text-[9px] font-bold">4.8</span>
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
    </div>
  )
}
