import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Heart, Info } from 'lucide-react'
import { formatBytes } from '../../utils/helpers'
import { Button } from '../../components/common/Button'

export const FavoritesPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isEmptyState, setIsEmptyState] = useState(false)

  // Track starred items locally
  const [starredBooks, setStarredBooks] = useState<Record<string, boolean>>({})

  useEffect(() => {
    booksService.getBooks().then((data) => {
      // Filter only favorited books initially
      const favorited = data.filter((b) => b.isFavorite)
      setBooks(favorited)
      const starMap: Record<string, boolean> = {}
      favorited.forEach((b) => {
        starMap[b.id] = true
      })
      setStarredBooks(starMap)
      setLoading(false)
    })
  }, [])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const isFav = await booksService.toggleFavorite(id)
      setStarredBooks((prev) => ({ ...prev, [id]: isFav }))
      const data = await booksService.getBooks()
      setBooks(data.filter((b) => b.isFavorite))
    } catch (err) {
      console.error('Failed to toggle favorite status:', err)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

  const activeBooks = books.filter((b) => starredBooks[b.id] !== false)

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="bg-bg-surface border-border-base flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="text-primary-500 h-4.5 w-4.5 shrink-0" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts below.</span>
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
            {isEmptyState ? 'Show Real Favorites' : 'Show Empty States'}
          </button>
        </div>
      </div>

      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
          Favorites Shelf
        </h1>
        <p className="text-text-muted text-xs font-semibold tracking-wider uppercase">
          Quick access to your starred digital resources.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isSkeletonLoading || loading ? (
          /* Loading skeletons */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-64 animate-pulse flex-col justify-between rounded-2xl border p-4"
              >
                <div className="bg-border-light h-32 rounded-xl" />
                <div className="bg-border-light mt-4 h-4 w-2/3 rounded" />
                <div className="bg-border-light h-3 w-1/3 rounded" />
              </div>
            ))}
          </motion.div>
        ) : isEmptyState || activeBooks.length === 0 ? (
          /* Empty state view */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-md space-y-6 rounded-3xl border-2 border-dashed p-12 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
              <Heart className="h-6 w-6" fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-sm font-bold">No Favorites Saved</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                Click the star or heart badge indicators on book preview panels to store references
                here.
              </p>
            </div>
            <Link to={ROUTES.LIBRARY} className="inline-block">
              <Button size="sm">Go to Library</Button>
            </Link>
          </motion.div>
        ) : (
          /* Real books list layout */
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {activeBooks.map((book) => (
              <motion.div
                key={book.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="group border-border-base bg-bg-surface hover:border-primary-500/20 relative flex h-72 flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  {/* Cover representation */}
                  <div className="bg-bg-app border-border-light relative aspect-[3.2/4] w-full overflow-hidden rounded-xl border shadow-sm">
                    {book.coverPath ? (
                      <img
                        src={book.coverPath}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-text-muted bg-bg-app flex h-full w-full items-center justify-center">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                    {/* Hover Link to reader */}
                    <Link
                      to={ROUTES.READER.replace(':id', book.id)}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-lg">
                        Read Now
                      </span>
                    </Link>
                  </div>

                  {/* Title metadata details */}
                  <div className="mt-3">
                    <Link
                      to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                      className="hover:text-primary-600 text-text-main block truncate text-xs font-bold"
                    >
                      {book.title}
                    </Link>
                    <p className="text-text-sub mt-0.5 truncate text-[10px]">By {book.author}</p>
                  </div>
                </div>

                {/* Bottom details block */}
                <div className="border-border-light text-text-muted mt-2 flex items-center justify-between border-t pt-2.5 text-[9px] font-bold uppercase">
                  <span>{formatBytes(book.fileSize)}</span>
                  <button
                    onClick={(e) => toggleStar(book.id, e)}
                    className="flex cursor-pointer items-center gap-1 text-red-500 hover:text-red-600"
                  >
                    <Heart className="h-3.5 w-3.5 fill-red-500" />
                    <span>Starred</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
