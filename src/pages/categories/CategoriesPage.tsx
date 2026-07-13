import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Folder, ArrowRight } from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  count: number
  color: string
}

export const CategoriesPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [])

  const categories: CategoryItem[] = [
    {
      id: 'cat-1',
      name: 'Classics',
      count: books.filter((b) => b.categoryId === 'cat-1').length,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'cat-2',
      name: 'Programming',
      count: books.filter((b) => b.categoryId === 'cat-2').length,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      id: 'cat-3',
      name: 'Self-Help',
      count: books.filter((b) => b.categoryId === 'cat-3').length,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: 'cat-4',
      name: 'Science Fiction',
      count: 0,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Overview Categories list */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`flex h-40 flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${cat.color}`}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-white/80 p-2.5 shadow-sm">
                <Folder className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold shadow-sm">
                {cat.count} {cat.count === 1 ? 'Book' : 'Books'}
              </span>
            </div>

            <div>
              <h4 className="mt-4 text-lg leading-tight font-bold text-slate-800">{cat.name}</h4>
              <p className="mt-1 text-[10px] text-slate-500 select-none">Private Category Shelf</p>
            </div>
          </div>
        ))}
      </div>

      {/* Books grouped by category list */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Categorized Books</h3>
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400">
            Loading Categories...
          </div>
        ) : (
          <div className="space-y-8">
            {categories
              .filter((c) => c.count > 0)
              .map((cat) => (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Folder className="h-4 w-4 text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-800">{cat.name}</h4>
                    <span className="text-xs text-slate-400">({cat.count})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {books
                      .filter((b) => b.categoryId === cat.id)
                      .map((book) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-slate-300"
                        >
                          <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-50 text-slate-300 shadow-sm">
                            {book.coverPath ? (
                              <img
                                src={book.coverPath}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={ROUTES.BOOK_DETAILS.replace(':id', book.id)}
                              className="hover:text-brand-600 block truncate text-xs font-bold text-slate-800"
                            >
                              {book.title}
                            </Link>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              By {book.author}
                            </p>
                          </div>
                          <Link
                            to={ROUTES.READER.replace(':id', book.id)}
                            className="hover:text-brand-600 ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                            title="Read"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
