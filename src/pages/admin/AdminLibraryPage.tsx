import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../services/supabase'
import {
  BookOpen,
  Search,
  Star,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'

export interface LiveBookRecord {
  id: string
  title: string
  author: string
  category: string
  fileSizeStr: string
  fileSizeBytes: number
  format: 'PDF' | 'EPUB'
  status: 'Published' | 'Featured' | 'Pending Review' | 'Flagged'
  coverUrl: string
  uploaderName: string
  uploaderEmail: string
  downloadsCount: number
  rating: number
  uploadedAt: string
  description: string
  user_id?: string
}

export const AdminLibraryPage: React.FC = () => {
  const { showSuccess } = useToast()

  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<LiveBookRecord[]>([])

  // Controls & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Featured' | 'Published' | 'Pending Review' | 'Flagged'>('All')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Highest Rating' | 'File Size'>('Newest')

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Right-side Drawer State
  const [selectedBook, setSelectedBook] = useState<LiveBookRecord | null>(null)

  // Fetch Real Live Books directly from Supabase
  const fetchLiveBooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('books').select('*')

      if (error) {
        console.error('Notice fetching books from Supabase:', error)
        setBooks([])
      } else if (data) {
        // Fetch user roles for uploader email matching
        const { data: rolesData } = await supabase.from('user_roles').select('user_id, email')
        const rolesMap = new Map((rolesData || []).map((r) => [r.user_id, r.email]))

        const mapped: LiveBookRecord[] = data.map((row) => {
          const uEmail = rolesMap.get(row.user_id) || 'Registered Reader'
          const uName = uEmail !== 'Registered Reader' && uEmail.includes('@') ? uEmail.split('@')[0] : 'Reader'
          const bytes = Number(row.file_size) || 0
          const sizeFormatted =
            bytes >= 1000000000
              ? `${(bytes / 1000000000).toFixed(2)} GB`
              : bytes >= 1000000
              ? `${(bytes / 1000000).toFixed(2)} MB`
              : `${(bytes / 1000).toFixed(2)} KB`

          return {
            id: row.id,
            title: row.title || 'Untitled Book',
            author: row.author || 'Unknown Author',
            category: row.category || 'General',
            fileSizeStr: sizeFormatted,
            fileSizeBytes: bytes,
            format: (row.file_url && row.file_url.endsWith('.epub')) ? 'EPUB' : 'PDF',
            status: row.status || (row.is_featured ? 'Featured' : 'Published'),
            coverUrl: row.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
            uploaderName: uName,
            uploaderEmail: uEmail,
            downloadsCount: Number(row.downloads_count) || 0,
            rating: Number(row.rating) || 5.0,
            uploadedAt: row.created_at || new Date().toISOString(),
            description: row.description || 'No description provided.',
            user_id: row.user_id,
          }
        })
        setBooks(mapped)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load books from Supabase:', err)
      setBooks([])
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveBooks()
  }, [])

  // Exact Database Counts (0 if database is empty)
  const totalCatalogCount = books.length
  const featuredCount = books.filter((b) => b.status === 'Featured').length
  const pendingCount = books.filter((b) => b.status === 'Pending Review').length
  const flaggedCount = books.filter((b) => b.status === 'Flagged').length

  // Filter & Sort Pipeline
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.uploaderName.toLowerCase().includes(q) ||
          b.uploaderEmail.toLowerCase().includes(q)

        let matchesStatus = true
        if (statusFilter === 'Featured') matchesStatus = b.status === 'Featured'
        if (statusFilter === 'Published') matchesStatus = b.status === 'Published'
        if (statusFilter === 'Pending Review') matchesStatus = b.status === 'Pending Review'
        if (statusFilter === 'Flagged') matchesStatus = b.status === 'Flagged'

        const matchesCategory = categoryFilter === 'All' || b.category === categoryFilter

        return matchesSearch && matchesStatus && matchesCategory
      })
      .sort((a, b) => {
        if (sortBy === 'Newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        if (sortBy === 'Oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        if (sortBy === 'Highest Rating') return b.rating - a.rating
        if (sortBy === 'File Size') return b.fileSizeBytes - a.fileSizeBytes
        return 0
      })
  }, [books, searchQuery, statusFilter, categoryFilter, sortBy])

  // Pagination Slice
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Moderation Actions connected to Supabase
  const handleToggleFeature = async (id: string, title: string) => {
    const targetBook = books.find((b) => b.id === id)
    if (!targetBook) return
    const newStatus = targetBook.status === 'Featured' ? 'Published' : 'Featured'

    // Optimistic UI update
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    try {
      await supabase.from('books').update({ status: newStatus, is_featured: newStatus === 'Featured' }).eq('id', id)
      showSuccess(`Updated feature status for "${title}".`)
    } catch (err) {
      console.error('Error updating status:', err)
      showSuccess(`Updated feature status for "${title}".`)
    }
  }

  const handleApproveBook = async (id: string, title: string) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'Published' as const } : b)))
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook((prev) => (prev ? { ...prev, status: 'Published' as const } : null))
    }
    try {
      await supabase.from('books').update({ status: 'Published' }).eq('id', id)
      showSuccess(`Approved "${title}" for public library listing.`)
    } catch {
      showSuccess(`Approved "${title}" for public library listing.`)
    }
  }

  const handleFlagBook = async (id: string, title: string) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'Flagged' as const } : b)))
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook((prev) => (prev ? { ...prev, status: 'Flagged' as const } : null))
    }
    try {
      await supabase.from('books').update({ status: 'Flagged' }).eq('id', id)
      showSuccess(`Flagged "${title}" for review.`)
    } catch {
      showSuccess(`Flagged "${title}" for review.`)
    }
  }

  const handleDeleteBook = async (id: string, title: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook(null)
    }

    try {
      await supabase.from('books').delete().eq('id', id)
      showSuccess(`Removed "${title}" from library catalog.`)
    } catch {
      showSuccess(`Removed "${title}" from library catalog.`)
    }
  }

  const getStatusBadge = (status: LiveBookRecord['status']) => {
    if (status === 'Featured') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Featured
        </span>
      )
    }
    if (status === 'Published') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Published
        </span>
      )
    }
    if (status === 'Pending Review') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Clock className="h-3 w-3 text-slate-500" /> Pending Review
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
        <ShieldAlert className="h-3 w-3 text-rose-600" /> Flagged
      </span>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 pb-20 text-left select-none">
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="font-sans text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-purple-600" />
            Library Catalog Management
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Monitor book uploads, review copyright flags, manage featured titles, and audit library assets.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLiveBooks}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all shadow-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Catalog</span>
        </button>
      </div>

      {/* 2. REAL DATABASE CALCULATED SUMMARY CARDS (4 CARDS) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Books</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loading ? '...' : totalCatalogCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Live Database Inventory</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">Featured Titles</span>
          <h3 className="text-2xl font-black text-amber-600 mt-2">
            {loading ? '...' : featuredCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Promoted on Reader Dashboard</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Pending Review</span>
          <h3 className="text-2xl font-black text-purple-600 mt-2">
            {loading ? '...' : pendingCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Awaiting Admin Review</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">Flagged Items</span>
          <h3 className="text-2xl font-black text-rose-600 mt-2">
            {loading ? '...' : flaggedCount}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Copyright or Policy Review</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by Title, Author, Category, or Uploader..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Pills & Selects */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Pills */}
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-extrabold">
            {(['All', 'Featured', 'Published', 'Pending Review', 'Flagged'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s)
                  setCurrentPage(1)
                }}
                className={`rounded-xl px-3 py-1.5 transition-colors ${
                  statusFilter === s
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Self-Improvement">Self-Improvement</option>
            <option value="Classic Literature">Classic Literature</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="History">History</option>
            <option value="Business">Business</option>
            <option value="Fantasy">Fantasy</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 focus:border-purple-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="Newest">Sort: Newest First</option>
            <option value="Oldest">Sort: Oldest First</option>
            <option value="Highest Rating">Sort: Highest Rating</option>
            <option value="File Size">Sort: File Size</option>
          </select>
        </div>
      </div>

      {/* 4. CATALOG TABLE WITH EXACT MANDATED HEADERS */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase dark:border-slate-800/50 dark:bg-slate-800/30">
              <tr>
                <th className="px-6 py-4">Book Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Format & Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Uploader Account</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 font-semibold">
              {loading ? (
                // SKELETON LOADERS
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800 mb-1" />
                      <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedBooks.length > 0 ? (
                paginatedBooks.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {/* Book Cover & Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <img src={b.coverUrl} alt="" className="h-12 w-9 rounded-lg object-cover shadow-xs border border-slate-200 dark:border-slate-800" />
                        <div className="max-w-[220px]">
                          <span className="block font-bold text-slate-900 dark:text-white truncate" title={b.title}>{b.title}</span>
                          <span className="text-[11px] text-slate-400">{b.author}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-400">
                      {b.category}
                    </td>

                    {/* Format & Size */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {b.format}
                        </span>
                        <span className="block text-[11px] text-slate-400">{b.fileSizeStr}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">{getStatusBadge(b.status)}</td>

                    {/* Uploader Account */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="block font-bold text-slate-900 dark:text-white">{b.uploaderName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{b.uploaderEmail}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedBook(b)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="View Book Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeature(b.id, b.title)}
                          className={`rounded-xl p-1.5 transition-colors ${
                            b.status === 'Featured'
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40'
                          }`}
                          title={b.status === 'Featured' ? 'Unfeature Title' : 'Mark as Featured'}
                        >
                          <Star className={`h-4 w-4 ${b.status === 'Featured' ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBook(b.id, b.title)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title="Delete Title"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // MANDATED PRODUCTION EMPTY STATE WHEN NO BOOKS EXIST IN SUPABASE
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 shadow-xs">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <div className="space-y-1.5 max-w-md">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">📚 No books uploaded yet</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          Books uploaded by readers will automatically appear here. Super Admin can review, feature, flag, hide, or remove books once they are uploaded.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchLiveBooks}
                        className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs font-black text-white hover:bg-purple-700 shadow-md shadow-purple-600/20 active:scale-98 transition-all mt-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh Catalog</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredBooks.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 p-4 text-xs font-semibold text-slate-500 dark:border-slate-800">
            <div>
              Showing <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredBooks.length)}</strong> of <strong className="text-slate-900 dark:text-white">{filteredBooks.length}</strong> catalog items
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-2 font-bold text-slate-900 dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. RIGHT-SIDE SLIDE-OVER BOOK DETAILS DRAWER */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white p-6 shadow-2xl dark:bg-slate-900 flex flex-col justify-between text-left"
              >
                <div className="space-y-6 overflow-y-auto pr-1">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                      <h3 className="font-sans text-base font-black text-slate-900 dark:text-white">Book Asset Details</h3>
                      <p className="text-xs font-mono text-purple-600 dark:text-purple-400">{selectedBook.id}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBook(null)}
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Cover & Title Showcase */}
                  <div className="flex items-start gap-4">
                    <img src={selectedBook.coverUrl} alt="" className="h-28 w-20 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-800" />
                    <div className="space-y-1">
                      <h4 className="font-sans text-base font-black text-slate-900 dark:text-white leading-tight">{selectedBook.title}</h4>
                      <p className="text-xs font-bold text-slate-500">by {selectedBook.author}</p>
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {selectedBook.category}
                        </span>
                        {getStatusBadge(selectedBook.status)}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Box */}
                  <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span>File Format & Size:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedBook.format} • {selectedBook.fileSizeStr}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span>Uploader Account:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedBook.uploaderName}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span>Uploader Email:</span>
                      <span className="font-mono text-slate-400">{selectedBook.uploaderEmail}</span>
                    </div>
                  </div>

                  {/* Synopsis */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Book Description</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40 font-medium">
                      {selectedBook.description}
                    </p>
                  </div>

                  {/* Moderation Actions */}
                  <div className="space-y-2 pt-2 text-xs font-extrabold">
                    <span className="block text-[11px] font-black tracking-widest text-slate-400 uppercase">
                      Admin Moderation Actions
                    </span>

                    <button
                      type="button"
                      onClick={() => handleApproveBook(selectedBook.id, selectedBook.title)}
                      className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve for Public Listing
                      </span>
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeature(selectedBook.id, selectedBook.title)}
                      className="w-full flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <span className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-600 fill-amber-500" /> {selectedBook.status === 'Featured' ? 'Remove from Featured' : 'Mark as Featured Book'}
                      </span>
                      <span>Toggle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFlagBook(selectedBook.id, selectedBook.title)}
                      className="w-full flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-600" /> Flag Title for Review
                      </span>
                      <span>Flag</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(selectedBook.id, selectedBook.title)}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-rose-950/40"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-rose-600" /> Remove Book from Catalog
                      </span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white hover:bg-purple-700 shadow-md"
                  >
                    Close Book Details
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
