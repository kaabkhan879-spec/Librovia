import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { Search, Grid, List, BookOpen, Trash2, Heart, ExternalLink } from 'lucide-react'
import { formatBytes } from '../../utils/helpers'

export const LibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [])

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      booksService.deleteBook(id).then(() => {
        setBooks((prev) => prev.filter((b) => b.id !== id))
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search books, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-brand-500 focus:ring-brand-500/10 block w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none"
          />
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`cursor-pointer rounded-lg p-1.5 ${viewMode === 'grid' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`cursor-pointer rounded-lg p-1.5 ${viewMode === 'list' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Link
            to={ROUTES.UPLOAD}
            className="bg-brand-600 hover:bg-brand-700 shadow-brand-500/10 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Upload Book
          </Link>
        </div>
      </div>

      {/* Book Grid / List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-400">
          Loading library shelves...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="bg-brand-50 text-brand-600 mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">No books found</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            {searchQuery
              ? 'Try adjusting your search term.'
              : 'Get started by uploading your first book!'}
          </p>
          {!searchQuery && (
            <Link
              to={ROUTES.UPLOAD}
              className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            >
              Upload Book
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300"
            >
              {/* Cover Placeholder */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                {book.coverPath ? (
                  <img
                    src={book.coverPath}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
                {/* Actions overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-slate-950/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Link
                    to={ROUTES.READER.replace(':id', book.id)}
                    className="hover:bg-brand-50 hover:text-brand-600 cursor-pointer rounded-xl bg-white p-2.5 text-slate-900 shadow-lg"
                    title="Read Now"
                  >
                    <BookOpen className="h-5 w-5" />
                  </Link>
                  <Link
                    to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                    className="hover:bg-brand-50 hover:text-brand-600 cursor-pointer rounded-xl bg-white p-2.5 text-slate-900 shadow-lg"
                    title="Book Details"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              {/* Text Info */}
              <div className="mt-3 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-900" title={book.title}>
                  {book.title}
                </h4>
                <p className="mt-0.5 truncate text-xs text-slate-400">{book.author}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formatBytes(book.fileSize)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      className={`cursor-pointer rounded-lg border p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 ${book.isFavorite ? 'border-red-100 bg-red-50/50 text-red-500' : 'border-slate-100 bg-slate-50'}`}
                      title={book.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                    >
                      <Heart
                        className="h-3.5 w-3.5"
                        fill={book.isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete Book"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Book
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Author
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  File Size
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-slate-300 shadow-sm">
                        {book.coverPath ? (
                          <img src={book.coverPath} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <Link
                        to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                        className="hover:text-brand-600 text-sm font-bold text-slate-900"
                      >
                        {book.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-500">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
                    {formatBytes(book.fileSize)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={ROUTES.READER.replace(':id', book.id)}
                        className="hover:bg-brand-50 hover:text-brand-600 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Read
                      </Link>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="border-slate-150 cursor-pointer rounded-lg border p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
