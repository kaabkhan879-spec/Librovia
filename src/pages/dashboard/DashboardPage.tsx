import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Upload, Heart, Award, ArrowRight, Clock } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    booksService.getBooks().then((data) => {
      setBooks(data)
      setLoading(false)
    })
  }, [])

  const stats = [
    {
      name: 'Total Books',
      value: books.length,
      icon: BookOpen,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      name: 'Favorites',
      value: books.filter((b) => b.isFavorite).length,
      icon: Heart,
      color: 'text-red-600 bg-red-50',
    },
    { name: 'Reading Goals', value: '3 / 5', icon: Award, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="from-brand-600 shadow-brand-500/10 rounded-2xl bg-gradient-to-r to-indigo-600 p-6 text-white shadow-md sm:p-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Welcome back to Librovia!
          </h2>
          <p className="mt-2 text-sm text-indigo-100 sm:text-base">
            You have read 120 pages this week. Keep going to reach your weekly goal of 200 pages!
          </p>
          <div className="mt-6">
            <Link
              to={ROUTES.LIBRARY}
              className="text-brand-600 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
            >
              Open Library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="mt-0.5 text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Sections (Two Column Layout) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Columns - Recently Read */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recently Read</h3>
            <Link
              to={ROUTES.LIBRARY}
              className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm font-semibold"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400">
              Loading recent books...
            </div>
          ) : (
            <div className="space-y-4">
              {books.slice(0, 2).map((book) => (
                <div
                  key={book.id}
                  className="group relative flex items-center gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-slate-300"
                >
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-slate-100 shadow-sm">
                    {book.coverPath ? (
                      <img
                        src={book.coverPath}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-bold text-slate-900">{book.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">By {book.author}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="max-w-[200px] flex-1">
                        <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-400">
                          <span>Reading Progress</span>
                          <span>40%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: '40%' }}
                          />
                        </div>
                      </div>
                      <span className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Clock className="h-3 w-3" />
                        2h ago
                      </span>
                    </div>
                  </div>

                  <Link
                    to={ROUTES.READER.replace(':id', book.id)}
                    className="hover:bg-brand-50 hover:text-brand-600 absolute top-1/2 right-4 -translate-y-1/2 rounded-xl bg-slate-50 p-2.5 text-slate-700"
                    title="Read book"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Actions & Storage */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Storage Usage</h3>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex justify-between text-sm font-semibold text-slate-700">
              <span>Cloud Storage</span>
              <span>15.8 MB of 1 GB used</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: '1.5%' }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Free plan user. Upgrade to Premium for up to 50 GB storage space.
            </p>
          </div>

          <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to={ROUTES.UPLOAD}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center hover:bg-slate-50"
            >
              <Upload className="group-hover:text-brand-600 h-6 w-6 text-slate-400" />
              <span className="mt-2 text-xs font-semibold text-slate-600 group-hover:text-slate-800">
                Upload Book
              </span>
            </Link>
            <Link
              to={ROUTES.FAVORITES}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center hover:bg-slate-50"
            >
              <Heart className="h-6 w-6 text-slate-400 group-hover:text-red-500" />
              <span className="mt-2 text-xs font-semibold text-slate-600 group-hover:text-slate-800">
                Favorites
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
