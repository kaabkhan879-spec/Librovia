import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { booksService, type Book } from '../../services/books'
import { ROUTES } from '../../constants/routes'
import { ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Bookmark, List } from 'lucide-react'

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(15)
  const [totalPages] = useState(320)
  const [zoom, setZoom] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bookmarks, setBookmarks] = useState<number[]>([5, 12])

  useEffect(() => {
    if (id) {
      booksService.getBookById(id).then((data) => {
        setBook(data)
        setLoading(false)
      })
    }
  }, [id])

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1))
  }

  const toggleBookmark = () => {
    if (bookmarks.includes(page)) {
      setBookmarks((prev) => prev.filter((p) => p !== page))
    } else {
      setBookmarks((prev) => [...prev, page].sort((a, b) => a - b))
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading reading canvas...
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 bg-slate-950 text-white">
        <h3 className="text-xl font-bold">Book not found</h3>
        <button
          onClick={() => navigate(ROUTES.LIBRARY)}
          className="bg-brand-600 hover:bg-brand-700 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Return to Shelf
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 font-sans text-slate-100">
      {/* Top Header Controls */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.BOOK_DETAILS.replace(':id', book.id))}
            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Exit Reader"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="max-w-[200px] truncate text-sm font-bold text-white sm:max-w-[400px]">
              {book.title}
            </h1>
            <p className="text-[10px] text-slate-500">By {book.author}</p>
          </div>
        </div>

        {/* Toolbar Middle - Navigation & Zoom */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold select-none">
              {page} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1 sm:flex">
            <button
              onClick={() => setZoom((z) => Math.max(z - 10, 50))}
              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 px-2 text-center text-xs font-semibold select-none">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 10, 200))}
              className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={`cursor-pointer rounded-lg p-2 ${bookmarks.includes(page) ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Bookmark Page"
          >
            <Bookmark
              className="h-5 w-5"
              fill={bookmarks.includes(page) ? 'currentColor' : 'none'}
            />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`cursor-pointer rounded-lg p-2 ${sidebarOpen ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Toggle Sidebar"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Reader Layout Container */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
        >
          <div className="border-b border-slate-800 p-4">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Bookmarks</h3>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {bookmarks.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-600">No bookmarks saved</p>
            ) : (
              bookmarks.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-900 ${p === page ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400'}`}
                >
                  <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                  <span>Page {p}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="relative flex flex-1 items-start justify-center overflow-auto bg-slate-900 p-8 select-none">
          {/* Simulated PDF Paper Canvas */}
          <div
            className="flex min-h-[700px] max-w-2xl origin-top flex-col justify-between rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl transition-all duration-100 sm:p-12"
            style={{ transform: `scale(${zoom / 100})`, width: '100%' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-medium text-slate-400 select-none">
              <span>Chapter II: The Library Canvas</span>
              <span>Page {page}</span>
            </div>

            {/* Simulated book contents */}
            <div className="my-8 flex-1 space-y-4">
              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                The Digital Revolution of Shelves
              </h2>
              <p className="font-serif text-sm leading-relaxed text-slate-700">
                This is a high-fidelity visual rendering of your personal PDF document. Inside this
                canvas container, Librovia will load the PDF.js renderer component. The PDF.js web
                worker will load, parse, and render each page vector graphics directly into HTML5
                canvas buffers.
              </p>
              <p className="font-serif text-sm leading-relaxed text-slate-700">
                Row-Level security ensures this document buffer is fetched using authenticated JWT
                signed links, maintaining total database privacy.
              </p>
              <p className="font-serif text-sm leading-relaxed text-slate-700">
                Try zooming in and out, page toggling, bookmarking, and collapsing the left
                navigation drawer to test the responsive reader layout controls.
              </p>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 select-none">
              <span>Librovia Personal Reader</span>
              <span>{book.title}</span>
            </div>
          </div>

          {/* Quick float paging buttons */}
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="fixed top-1/2 left-[280px] hidden -translate-y-1/2 cursor-pointer rounded-full border border-slate-800 bg-slate-950/60 p-3 text-white backdrop-blur transition-opacity hover:bg-slate-950/90 disabled:opacity-20 lg:block"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="fixed top-1/2 right-8 hidden -translate-y-1/2 cursor-pointer rounded-full border border-slate-800 bg-slate-950/60 p-3 text-white backdrop-blur transition-opacity hover:bg-slate-950/90 disabled:opacity-20 lg:block"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
