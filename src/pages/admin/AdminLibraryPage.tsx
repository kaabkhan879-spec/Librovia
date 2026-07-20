import React, { useState, useEffect } from 'react'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { booksService, type Book } from '../../services/books'
import { formatBytes } from '../../utils/helpers'
import { BookOpen, Star, Trash2 } from 'lucide-react'

export const AdminLibraryPage: React.FC = () => {
  const { showSuccess } = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])

  useEffect(() => {
    booksService.getBooks().then((data) => setBooks(data))
  }, [])

  const handleToggleFeature = (id: string, title: string) => {
    if (featuredIds.includes(id)) {
      setFeaturedIds((prev) => prev.filter((item) => item !== id))
      showSuccess(`"${title}" removed from Featured Books.`)
    } else {
      setFeaturedIds((prev) => [...prev, id])
      showSuccess(`"${title}" marked as Featured Book!`)
    }
  }

  const handleDeleteBook = (id: string, title: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    showSuccess(`Book "${title}" deleted from library catalog.`)
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-purple-600" />
            Library Catalog Management
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Monitor catalog uploads, highlight featured titles, and review flagged or reported books.
          </p>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Book</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {books.map((b) => {
                const isFeatured = featuredIds.includes(b.id)
                return (
                  <tr key={b.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={b.coverPath} alt="" className="h-9 w-7 rounded object-cover shadow-xs" />
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[240px]">{b.title}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{b.author || 'Unknown'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatBytes(b.fileSize)}</td>
                    <td className="px-6 py-4">
                      {isFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(b.id, b.title)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {isFeatured ? 'Unfeature' : 'Feature Book'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBook(b.id, b.title)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Delete Book"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
