import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Heart } from 'lucide-react'
import { formatBytes } from '../../utils/helpers'

export const FavoritesPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    booksService.getBooks().then((data) => {
      // Filter only favorited books
      setBooks(data.filter((b) => b.isFavorite))
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-400">
          Loading favorites shelf...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">No favorites marked</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            Toggle the heart icon on any book details card to add it here.
          </p>
          <Link
            to={ROUTES.LIBRARY}
            className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            Go to Library
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300"
            >
              {/* Cover */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                {book.coverPath ? (
                  <img
                    src={book.coverPath}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
                {/* Overlay link */}
                <Link
                  to={ROUTES.READER.replace(':id', book.id)}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-lg">
                    Read Now
                  </span>
                </Link>
              </div>

              {/* Text */}
              <div className="mt-3">
                <Link
                  to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                  className="hover:text-brand-600 block truncate text-sm font-bold text-slate-900"
                >
                  {book.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-slate-400">{book.author}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5 text-[10px] font-semibold text-slate-400">
                  <span>{formatBytes(book.fileSize)}</span>
                  <span className="flex items-center gap-1 text-red-500">
                    <Heart className="h-3 w-3" fill="currentColor" />
                    Favorite
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
