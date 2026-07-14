import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { ROUTES } from '../../constants/routes'
import { History } from 'lucide-react'
import { Button } from '../../components/common/Button'

export const ReadingPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [collectionsList, setCollectionsList] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()]).then(
      ([booksData, colsData]) => {
        setBooks(booksData)
        setCollectionsList(colsData)
        setLoading(false)
      }
    )
  }, [])

  const getCollectionName = (colId: string | undefined) => {
    const col = collectionsList.find((c) => c.id === colId)
    return col ? col.name : 'Classics'
  }

  // Filter books that have been read/opened (lastReadAt exists)
  const readingHistory = useMemo(() => {
    return books
      .filter((b) => b.lastReadAt !== undefined)
      .sort((a, b) => {
        const timeA = new Date(a.lastReadAt!).getTime()
        const timeB = new Date(b.lastReadAt!).getTime()
        return timeB - timeA
      })
  }, [books])

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

  return (
    <div className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Reading History
        </h1>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          Review your recently read digital resources and pick up where you left off.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </motion.div>
        ) : readingHistory.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/20">
              <History className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Reading Logs</h3>
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                You haven't read or opened any books yet. Navigate to your Library and open a book
                to start logging progress.
              </p>
            </div>
            <Link to={ROUTES.LIBRARY} className="inline-block">
              <Button>Browse Library</Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {readingHistory.map((book) => (
              <motion.div
                key={book.id}
                variants={itemVariants}
                className="flex h-36 justify-between rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:border-purple-500/20 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <img
                    src={book.coverPath}
                    alt={book.title}
                    className="aspect-[0.7/1] w-16 shrink-0 rounded-xl border border-slate-100 object-cover shadow-xs dark:border-slate-800"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="block w-fit rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 uppercase dark:bg-purple-950/20">
                      {getCollectionName(book.collectionId)}
                    </span>
                    <h4 className="truncate text-xs leading-tight font-bold text-slate-900 dark:text-white">
                      {book.title}
                    </h4>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                      By {book.author}
                    </p>

                    <div className="w-full pt-1.5">
                      <div className="mb-1 flex justify-between text-[9px] font-semibold text-slate-400">
                        <span>Progress</span>
                        <span>{book.progress}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-purple-600"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between border-l border-slate-50 pl-4 text-right dark:border-slate-800/40">
                  <div>
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">
                      Last read
                    </span>
                    <span className="text-slate-655 dark:text-slate-350 mt-0.5 block text-[9px] font-bold">
                      {book.lastReadAt
                        ? new Date(book.lastReadAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Not started'}
                    </span>
                    {book.readingTime !== undefined && book.readingTime > 0 && (
                      <p className="mt-1 text-[9px] font-bold text-purple-600">
                        ⏱ {Math.round(book.readingTime / 60) || 1} min read
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex gap-1.5">
                    <Link to={ROUTES.READER.replace(':id', book.id)}>
                      <button
                        className="flex h-8 cursor-pointer items-center rounded-xl bg-purple-600 px-3 text-[9px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-purple-700"
                        title="Continue reading"
                      >
                        Resume
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
