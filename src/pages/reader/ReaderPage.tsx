import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  List,
  Search,
  Sliders,
  Clock,
  Trash2,
} from 'lucide-react'

interface Annotation {
  id: string
  page: number
  text: string
  color: 'yellow' | 'blue' | 'green' | 'pink'
}

interface Chapter {
  title: string
  page: number
}

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const bookTitle = useMemo(() => {
    if (id) {
      return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return 'Atomic Habits'
  }, [id])

  // Reading settings states
  const [page, setPage] = useState(15)
  const [totalPages] = useState(320)
  const [zoom, setZoom] = useState(100)
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('sepia')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'toc' | 'thumbs' | 'bookmarks' | 'notes'>('toc')
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Text options
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base')
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed')
  const [pageWidth, setPageWidth] = useState<'narrow' | 'medium' | 'wide'>('medium')

  // Interactive bookmark and highlights records
  const [bookmarks, setBookmarks] = useState<number[]>([5, 12, 15])
  const [highlights, setHighlights] = useState<Annotation[]>([
    {
      id: '1',
      page: 15,
      text: 'distill complex topics into simple behaviors that can be easily applied',
      color: 'yellow',
    },
    {
      id: '2',
      page: 15,
      text: 'distraction-free reading experience is comfortable for long reading sessions',
      color: 'blue',
    },
  ])
  const [noteInput, setNoteInput] = useState('')

  // Simulated chapters
  const chapters: Chapter[] = [
    { title: 'Introduction: My Story', page: 1 },
    { title: 'Chapter 1: The Surprising Power of Atomic Habits', page: 12 },
    { title: 'Chapter 2: How Your Habits Shape Your Identity', page: 24 },
    { title: 'Chapter 3: How to Build Better Habits in 4 Simple Steps', page: 38 },
    { title: 'Chapter 4: The Man Who Didnt Look Right', page: 55 },
  ]

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

  const addHighlight = (color: 'yellow' | 'blue' | 'green' | 'pink') => {
    const textOptions = [
      'An easy & proven way to build good habits & break bad ones.',
      'Small improvements compound into massive long-term results.',
      'You do not rise to the level of your goals. You fall to the level of your systems.',
    ]

    setHighlights((prev) => {
      const selectedIndex = prev.length % textOptions.length
      const randomText = textOptions[selectedIndex]
      return [
        ...prev,
        {
          id: Date.now().toString(),
          page,
          text: randomText,
          color,
        },
      ]
    })
  }

  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }

  const addNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteInput.trim()) return
    setHighlights((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        page,
        text: `Note: ${noteInput.trim()}`,
        color: 'yellow',
      },
    ])
    setNoteInput('')
  }

  // Theme styling definitions
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200',
    dark: 'bg-neutral-900 text-neutral-100 border-neutral-800',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] border-[#e4dcc4]',
  }

  const fontClasses = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const leadingClasses = {
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  }

  const widthClasses = {
    narrow: 'max-w-md',
    medium: 'max-w-xl',
    wide: 'max-w-3xl',
  }

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-300 select-none ${theme === 'dark' ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-100 text-slate-800'}`}
    >
      {/* Top Toolbar */}
      <header
        className={`z-20 flex h-16 shrink-0 items-center justify-between border-b px-4 ${theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-slate-200 bg-white shadow-sm'}`}
      >
        {/* Left side actions */}
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.LIBRARY}
            className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2"
            title="Back to Library"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="text-left">
            <h1 className="text-text-main text-xs font-bold tracking-wider uppercase">
              {bookTitle}
            </h1>
            <p className="text-text-muted text-[10px]">
              By James Clear • Page {page} of {totalPages}
            </p>
          </div>
        </div>

        {/* Center search bar (UI only) */}
        <div className="relative mx-4 hidden max-w-xs flex-1 rounded-lg shadow-sm md:block">
          <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in book..."
            className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border px-8 py-1 text-xs focus:ring-2 focus:outline-none"
          />
        </div>

        {/* Right side controls toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="border-border-base bg-bg-surface hidden items-center gap-1 rounded-lg border p-0.5 sm:flex">
            <button
              onClick={() => setZoom((z) => Math.max(z - 10, 50))}
              className="text-text-sub hover:text-text-main cursor-pointer p-1"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-[10px] font-bold">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 10, 150))}
              className="text-text-sub hover:text-text-main cursor-pointer p-1"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Theme select switch */}
          <div className="border-border-base bg-bg-surface flex rounded-lg border p-0.5">
            {(['light', 'dark', 'sepia'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${theme === t ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-app'} `}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Highlight Color Trigger buttons */}
          <div className="border-border-base bg-bg-surface hidden items-center gap-1 rounded-lg border p-1 sm:flex">
            {(['yellow', 'blue', 'green', 'pink'] as const).map((c) => {
              const bgMap = {
                yellow: 'bg-yellow-200',
                blue: 'bg-sky-200',
                green: 'bg-emerald-200',
                pink: 'bg-pink-200',
              }
              return (
                <button
                  key={c}
                  onClick={() => addHighlight(c)}
                  className={`h-4.5 w-4.5 rounded-full ${bgMap[c]} cursor-pointer border border-black/10 hover:scale-110`}
                  title={`Highlight in ${c}`}
                />
              )
            })}
          </div>

          {/* Bookmark page */}
          <button
            onClick={toggleBookmark}
            className={`cursor-pointer rounded-lg p-2 ${bookmarks.includes(page) ? 'bg-amber-500/10 text-amber-500' : 'text-text-sub hover:bg-bg-app'}`}
            title="Bookmark Page"
          >
            <Bookmark
              className="h-4.5 w-4.5"
              fill={bookmarks.includes(page) ? 'currentColor' : 'none'}
            />
          </button>

          {/* Text options settings dropdown */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`cursor-pointer rounded-lg p-2 ${showSettings ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10' : 'text-text-sub hover:bg-bg-app'}`}
            title="Reading Settings"
          >
            <Sliders className="h-4.5 w-4.5" />
          </button>

          {/* Collapse sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`cursor-pointer rounded-lg p-2 ${sidebarOpen ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10' : 'text-text-sub hover:bg-bg-app'}`}
            title="Toggle Navigation drawer"
          >
            <List className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Main split canvas */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Side Drawer */}
        <div
          className={`bg-bg-surface border-border-base relative z-10 flex flex-col border-r text-left transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
        >
          {/* Tab selectors */}
          <div className="border-border-base bg-bg-app flex border-b">
            {(
              [
                { id: 'toc', label: 'Contents' },
                { id: 'thumbs', label: 'Thumbnails' },
                { id: 'bookmarks', label: 'Bookmarks' },
                { id: 'notes', label: 'Notes' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 cursor-pointer border-b-2 py-3 text-center text-[9px] font-bold tracking-wider uppercase ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'text-text-muted hover:text-text-main border-transparent'
                } `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {activeTab === 'toc' && (
              <div className="space-y-1">
                {chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPage(ch.page)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${page === ch.page ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 font-bold' : 'text-text-sub hover:bg-bg-app'} `}
                  >
                    <span className="truncate pr-2">{ch.title}</span>
                    <span className="text-text-muted shrink-0 font-mono text-[10px]">
                      p. {ch.page}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'thumbs' && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const pNum = idx * 5 + 1
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(pNum)}
                      className={`flex aspect-[0.7/1] cursor-pointer flex-col justify-between rounded-lg border p-2 text-center transition-all ${page === pNum ? 'border-primary-500 bg-primary-50/10' : 'border-border-base hover:bg-bg-app'} `}
                    >
                      <div className="bg-border-light/40 text-text-muted flex w-full flex-1 items-center justify-center rounded text-[10px]">
                        📄
                      </div>
                      <span className="text-text-muted mt-1 text-[9px] leading-none font-bold">
                        Page {pNum}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-2">
                {bookmarks.length === 0 ? (
                  <p className="text-text-muted py-6 text-center text-[10px]">
                    No bookmarks saved.
                  </p>
                ) : (
                  bookmarks.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left text-xs ${p === page ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 font-bold' : 'text-text-sub hover:bg-bg-app'} `}
                    >
                      <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                      <span>Page {p} Bookmarked</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Note create form */}
                <form onSubmit={addNote} className="space-y-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Type note and click Add..."
                    className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 flex h-8 w-full cursor-pointer items-center justify-center rounded-lg text-xs font-bold tracking-wider text-white uppercase"
                  >
                    Add Page Note
                  </button>
                </form>

                {/* Annotation items list */}
                <div className="border-border-light space-y-2 border-t pt-2">
                  {highlights.map((h) => {
                    const colorClasses = {
                      yellow:
                        'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200',
                      blue: 'bg-sky-100 dark:bg-sky-500/10 text-sky-800 dark:text-sky-400 border-sky-200',
                      green:
                        'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200',
                      pink: 'bg-pink-100 dark:bg-pink-500/10 text-pink-800 dark:text-pink-400 border-pink-200',
                    }
                    return (
                      <div
                        key={h.id}
                        className={`space-y-1.5 rounded-lg border p-2.5 text-left text-xs ${colorClasses[h.color]}`}
                      >
                        <p className="font-serif leading-relaxed italic">"{h.text}"</p>
                        <div className="text-text-muted mt-1.5 flex items-center justify-between border-t border-black/5 pt-1.5 font-sans text-[9px] font-bold">
                          <span>Page {h.page}</span>
                          <button
                            onClick={() => deleteHighlight(h.id)}
                            className="cursor-pointer hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reading Settings Float Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-bg-surface border-border-base absolute top-4 right-4 z-50 w-72 space-y-4 rounded-2xl border p-5 text-left shadow-2xl"
            >
              <div className="border-border-light flex items-center justify-between border-b pb-2">
                <span className="text-primary-600 text-[10px] font-bold tracking-widest uppercase">
                  Reading Options
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-text-muted hover:text-text-main"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Font Size Row */}
              <div className="space-y-1.5">
                <span className="text-text-muted block text-[8px] font-bold tracking-wider uppercase">
                  Font Size
                </span>
                <div className="border-border-base bg-bg-app flex rounded-lg border p-0.5">
                  {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${fontSize === sz ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-surface'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height Row */}
              <div className="space-y-1.5">
                <span className="text-text-muted block text-[8px] font-bold tracking-wider uppercase">
                  Line Spacing
                </span>
                <div className="border-border-base bg-bg-app flex rounded-lg border p-0.5">
                  {(['normal', 'relaxed', 'loose'] as const).map((lh) => (
                    <button
                      key={lh}
                      onClick={() => setLineHeight(lh)}
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${lineHeight === lh ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-surface'}`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Width Row */}
              <div className="space-y-1.5">
                <span className="text-text-muted block text-[8px] font-bold tracking-wider uppercase">
                  Page Margins
                </span>
                <div className="border-border-base bg-bg-app flex rounded-lg border p-0.5">
                  {(['narrow', 'medium', 'wide'] as const).map((wd) => (
                    <button
                      key={wd}
                      onClick={() => setPageWidth(wd)}
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${pageWidth === wd ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-surface'}`}
                    >
                      {wd}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main centered reading zone */}
        <div className="relative flex flex-1 items-start justify-center overflow-auto p-6 sm:p-12">
          <div className="bg-radial-gradient(circle_at_center,rgba(99,102,241,0.02),transparent) pointer-events-none absolute inset-0" />

          {/* Simulated PDF Paper Canvas */}
          <motion.div
            layout
            className={`flex min-h-[700px] w-full origin-top flex-col justify-between rounded-2xl border p-8 shadow-2xl transition-all duration-300 sm:p-12 ${themeClasses[theme]} ${widthClasses[pageWidth]} `}
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* Header info */}
            <div className="flex justify-between border-b pb-4 text-[10px] font-bold tracking-wider uppercase opacity-60">
              <span>Chapter I: Atomic Compounding</span>
              <span>
                Page {page} of {totalPages}
              </span>
            </div>

            {/* Paragraph body texts */}
            <div className="my-8 flex-1 space-y-5 text-left">
              <h2 className="font-sans text-xl font-extrabold tracking-tight sm:text-2xl">
                The Surprising Power of Habits
              </h2>
              <p
                className={`font-serif text-sm leading-relaxed ${fontClasses[fontSize]} ${leadingClasses[lineHeight]}`}
              >
                In the beginning, there is no difference between a good habit and a bad one. It
                compounds slowly over months or years. If you get 1 percent better each day for one
                year, you’ll end up thirty-seven times better by the time you’re done. Conversely,
                if you get 1 percent worse each day, you’ll decline nearly down to zero.
              </p>
              <p
                className={`font-serif text-sm leading-relaxed ${fontClasses[fontSize]} ${leadingClasses[lineHeight]}`}
              >
                This is a high-fidelity visual rendering of your personal PDF document. Inside this
                distraction-free reading mode, Librovia loads the PDF.js renderer component. The web
                worker processes pages to render vector elements directly inside HTML5 canvases,
                maintaining perfect clarity.
              </p>
              <p
                className={`font-serif text-sm leading-relaxed ${fontClasses[fontSize]} ${leadingClasses[lineHeight]}`}
              >
                You do not rise to the level of your goals. You fall to the level of your systems.
                Focus on building compounding habits, and the results will naturally follow.
              </p>
            </div>

            {/* Footer info */}
            <div className="flex justify-between border-t pt-4 text-[10px] font-bold tracking-wider uppercase opacity-60">
              <span>Librovia Cloud Shelf</span>
              <span>{bookTitle}</span>
            </div>
          </motion.div>

          {/* Quick float pagination buttons */}
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="border-border-base bg-bg-surface/80 hover:bg-bg-surface text-text-sub fixed top-1/2 left-[280px] z-10 hidden -translate-y-1/2 cursor-pointer rounded-full border p-3 shadow transition-all disabled:opacity-20 lg:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="border-border-base bg-bg-surface/80 hover:bg-bg-surface text-text-sub fixed top-1/2 right-8 z-10 hidden -translate-y-1/2 cursor-pointer rounded-full border p-3 shadow transition-all disabled:opacity-20 lg:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <footer
        className={`flex h-14 shrink-0 items-center justify-between border-t px-6 ${theme === 'dark' ? 'border-neutral-800 bg-neutral-900' : 'border-slate-200 bg-white shadow-inner'}`}
      >
        {/* Left progress indicators */}
        <div className="flex items-center gap-3 text-left">
          <Clock className="text-primary-600 h-4 w-4 shrink-0" />
          <span className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
            1h 45m remaining in book
          </span>
        </div>

        {/* Center Progress Slider bar */}
        <div className="mx-8 flex max-w-xl flex-1 items-center gap-4">
          <span className="text-text-muted text-[10px] font-bold select-none">p. 1</span>
          <input
            type="range"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="bg-border-light accent-primary-600 h-1 flex-1 cursor-pointer appearance-none rounded-lg"
          />
          <span className="text-text-muted text-[10px] font-bold select-none">p. {totalPages}</span>
        </div>

        {/* Right page display indicator */}
        <span className="text-text-main font-mono text-xs font-bold">
          {page} / {totalPages} ({Math.round((page / totalPages) * 100)}%)
        </span>
      </footer>
    </div>
  )
}

interface XProps {
  className?: string
}

const X: React.FC<XProps> = ({ className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)
