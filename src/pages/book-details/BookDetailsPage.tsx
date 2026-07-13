import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { ArrowLeft, BookOpen, Heart, Trash2, Edit2, Calendar, FileText, Tag } from 'lucide-react'
import { formatBytes, formatDate } from '../../utils/helpers'

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      booksService.getBookById(id).then((data) => {
        setBook(data)
        setLoading(false)
      })
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-400">
        Loading book details...
      </div>
    )
  }

  if (!book) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
        <h3 className="text-lg font-bold text-slate-900">Book not found</h3>
        <button
          onClick={() => navigate(ROUTES.LIBRARY)}
          className="bg-brand-600 hover:bg-brand-700 mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Return to Shelf
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.LIBRARY}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-semibold text-slate-500">Back to Shelf</span>
      </div>

      {/* Details Box */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Cover */}
          <div className="mx-auto w-full max-w-[200px] shrink-0 md:mx-0">
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-300 shadow-md">
              {book.coverPath ? (
                <img src={book.coverPath} alt={book.title} className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-16 w-16" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{book.title}</h2>
              <p className="mt-1 text-lg text-slate-500">By {book.author}</p>
            </div>

            <div className="flex flex-wrap gap-4 border-y border-slate-100 py-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>Uploaded {formatDate(book.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                <span>Size: {formatBytes(book.fileSize)}</span>
              </div>
            </div>

            {book.description && (
              <div>
                <h3 className="text-sm font-bold text-slate-900">Description</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{book.description}</p>
              </div>
            )}

            {book.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reading Progress summary */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-bold text-slate-800">Current Progress</h4>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="bg-brand-500 h-full" style={{ width: '4%' }} />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600">4% Complete</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Last read page: 15 of 320</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to={ROUTES.READER.replace(':id', book.id)}
                className="bg-brand-600 hover:bg-brand-700 flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                Open Reader
              </Link>

              <button
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-500 ${book.isFavorite ? 'border-red-100 bg-red-50/50 text-red-500' : 'border-slate-200'}`}
              >
                <Heart className="h-4 w-4" fill={book.isFavorite ? 'currentColor' : 'none'} />
                {book.isFavorite ? 'Favorited' : 'Favorite'}
              </button>

              <button className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <Edit2 className="h-4 w-4" />
                Edit Metadata
              </button>

              <button className="ml-auto flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-red-100 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
