import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Folder, ArrowRight, Info, Library } from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  count: number
  color: string
}

export const CategoriesPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [isEmptyState, setIsEmptyState] = useState(false)

  useEffect(() => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [])

  const categories: CategoryItem[] = [
    {
      id: 'cat-2',
      name: 'Programming',
      count: books.filter((b) => b.categoryId === 'cat-2').length,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'cat-3',
      name: 'Self-Help',
      count: books.filter((b) => b.categoryId === 'cat-3').length,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'cat-1',
      name: 'Classics',
      count: books.filter((b) => b.categoryId === 'cat-1').length,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'cat-4',
      name: 'Science Fiction',
      count: 0,
      color: 'from-cyan-500 to-blue-600',
    },
  ]

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
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
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

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
            {isEmptyState ? 'Show Real Collections' : 'Show Empty States'}
          </button>
        </div>
      </div>

      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
          Collections Shelves
        </h1>
        <p className="text-text-muted text-xs font-semibold tracking-wider uppercase">
          Organize your files inside separate index tags.
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
        ) : isEmptyState ? (
          /* Empty state */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-md space-y-6 rounded-3xl border-2 border-dashed p-12 text-center"
          >
            <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
              <Library className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-sm font-bold">No Collections Formed</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                Add categories and map uploaded book parameters to arrange shelves.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Content layout */
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-10"
          >
            {/* Overview category items */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="bg-bg-surface border-border-base hover:border-primary-500/20 flex h-40 flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${cat.color} flex shrink-0 items-center justify-center text-white`}
                    >
                      <Folder className="h-5 w-5" />
                    </div>
                    <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-2.5 py-1 text-xs font-bold shadow-sm">
                      {cat.count} {cat.count === 1 ? 'Book' : 'Books'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-text-main text-sm font-extrabold tracking-wider uppercase">
                      {cat.name}
                    </h4>
                    <p className="text-text-muted mt-1 text-[10px]">Private Shelf</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Categorized Books shelf lists */}
            <div className="space-y-6">
              <h3 className="text-text-muted border-border-light border-b pb-2 text-sm font-bold tracking-wider uppercase">
                Categorized books shelves
              </h3>

              <div className="space-y-8">
                {categories
                  .filter((c) => c.count > 0)
                  .map((cat) => (
                    <div key={cat.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Folder className="text-primary-500 h-4.5 w-4.5 shrink-0" />
                        <h4 className="text-text-main text-xs font-extrabold tracking-wider uppercase">
                          {cat.name}
                        </h4>
                        <span className="text-text-muted text-[10px]">({cat.count} titles)</span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {books
                          .filter((b) => b.categoryId === cat.id)
                          .map((book) => (
                            <div
                              key={book.id}
                              className="bg-bg-surface border-border-base hover:border-primary-500/20 flex items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-all hover:shadow-md"
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
                              <Link
                                to={ROUTES.READER.replace(':id', book.id)}
                                className="text-text-muted hover:text-primary-600 hover:bg-bg-app cursor-pointer rounded-lg p-1.5 transition-colors"
                                title="Open Reader"
                              >
                                <ArrowRight className="h-4.5 w-4.5" />
                              </Link>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
