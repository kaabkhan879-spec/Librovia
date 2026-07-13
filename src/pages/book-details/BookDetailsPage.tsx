import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
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
} from 'lucide-react'
import { Button } from '../../components/common/Button'

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

// Realistic Dummy Database
const booksDb: Record<string, BookDetails> = {
  'atomic-habits': {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    subtitle: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
    author: 'James Clear',
    publisher: 'Penguin Books',
    category: 'Personal Development',
    language: 'English',
    pubYear: 2018,
    rating: 4.8,
    reviewsCount: 1248,
    progress: 42,
    currentPage: 134,
    totalPages: 320,
    lastOpened: '2 hours ago',
    estTimeRemaining: '1h 45m',
    streak: 7,
    description:
      'Tiny Changes, Remarkable Results. Atomic Habits is the most comprehensive and practical guide on how to create good habits, break bad ones, and get 1 percent better every day. Clear is known for his ability to distill complex topics into simple behaviors that can be easily applied to daily life and work.',
    fileSize: '12.4 MB',
    fileType: 'PDF',
    uploadedDate: '2026-07-01',
    lastModified: '2026-07-12',
    tags: ['Self-Help', 'Productivity', 'Habits', 'Psychology'],
    stats: {
      hoursRead: 8.5,
      pagesRead: 134,
      sessions: 12,
      completion: 42,
      avgTime: '42m',
    },
    timeline: [
      { event: 'Uploaded to cloud library cabinet', date: '2026-07-01' },
      { event: 'Started reading chapter 1', date: '2026-07-03' },
      { event: 'Added to Favorite shelf list', date: '2026-07-05' },
      { event: 'Logged 42% progress checkpoint', date: '2026-07-12' },
    ],
    cover:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=350&q=80',
  },
  'deep-work': {
    id: 'deep-work',
    title: 'Deep Work',
    subtitle: 'Rules for Focused Success in a Distracted World',
    author: 'Cal Newport',
    publisher: 'Grand Central Publishing',
    category: 'Productivity',
    language: 'English',
    pubYear: 2016,
    rating: 4.7,
    reviewsCount: 856,
    progress: 15,
    currentPage: 45,
    totalPages: 304,
    lastOpened: '1 day ago',
    estTimeRemaining: '4h 10m',
    streak: 3,
    description:
      'One of the most valuable skills in our economy is becoming increasingly rare. If you master this skill, you will achieve extraordinary results. Deep work is the ability to focus without distraction on a cognitively demanding task.',
    fileSize: '8.1 MB',
    fileType: 'PDF',
    uploadedDate: '2026-07-05',
    lastModified: '2026-07-05',
    tags: ['Focus', 'Productivity', 'Business', 'Success'],
    stats: {
      hoursRead: 2.2,
      pagesRead: 45,
      sessions: 4,
      completion: 15,
      avgTime: '33m',
    },
    timeline: [
      { event: 'Uploaded to cloud library cabinet', date: '2026-07-05' },
      { event: 'Started reading introduction', date: '2026-07-05' },
    ],
    cover:
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=350&q=80',
  },
  'clean-code': {
    id: 'clean-code',
    title: 'Clean Code',
    subtitle: 'A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    category: 'Programming',
    language: 'English',
    pubYear: 2008,
    rating: 4.9,
    reviewsCount: 2311,
    progress: 85,
    currentPage: 394,
    totalPages: 464,
    lastOpened: '3 hours ago',
    estTimeRemaining: '30m',
    streak: 15,
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
    fileSize: '24.2 MB',
    fileType: 'PDF',
    uploadedDate: '2026-06-20',
    lastModified: '2026-07-13',
    tags: ['Software', 'Engineering', 'Coding', 'Craftsmanship'],
    stats: {
      hoursRead: 19.8,
      pagesRead: 394,
      sessions: 32,
      completion: 85,
      avgTime: '38m',
    },
    timeline: [
      { event: 'Uploaded to cloud library cabinet', date: '2026-06-20' },
      { event: 'Completed Part I principles', date: '2026-07-01' },
      { event: 'Started Part II code smells listing', date: '2026-07-10' },
    ],
    cover:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=350&q=80',
  },
}

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(true)
  const [isDescCollapsed, setIsDescCollapsed] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<string[]>([])

  // Resolve matching book or fallback to Atomic Habits
  const book = useMemo(() => {
    if (id && booksDb[id]) {
      return booksDb[id]
    }
    return booksDb['atomic-habits']
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
                    <Link to="/reader/atomic-habits" className="block w-full">
                      <Button className="w-full justify-center gap-2 py-2.5 text-xs font-bold tracking-wider uppercase">
                        <Play className="h-4 w-4 fill-white" />
                        Continue Reading
                      </Button>
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`border-border-base bg-bg-surface flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-colors ${isFavorite ? 'border-red-200 bg-red-50/20 text-red-500' : 'text-text-sub hover:bg-bg-app'} `}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-text-muted'}`}
                        />
                        <span>Favorite</span>
                      </button>

                      <button
                        className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase"
                        title="Download UI only"
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
                    <button className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 text-[10px] font-bold tracking-wider text-red-600 uppercase">
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
            <div>
              <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                Related books
              </h3>
              <div className="flex scrollbar-thin gap-6 overflow-x-auto pb-4">
                {Object.values(booksDb).map((item) => (
                  <Link
                    key={item.id}
                    to={`/books/${item.id}`}
                    className="bg-bg-surface border-border-base hover:border-primary-500/20 flex w-64 flex-shrink-0 cursor-pointer gap-4 rounded-2xl border p-4 text-left shadow-sm transition-all"
                  >
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="border-border-light aspect-[0.7/1] w-14 shrink-0 rounded border object-cover shadow-sm"
                    />
                    <div className="flex min-w-0 flex-col justify-between">
                      <div>
                        <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] leading-none font-bold tracking-wider uppercase">
                          {item.category}
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
                        <span className="text-text-sub text-[9px] font-bold">{item.rating}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
