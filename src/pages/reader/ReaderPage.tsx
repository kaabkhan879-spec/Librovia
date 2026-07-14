import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
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
  Sliders,
  Clock,
  Trash2,
  Maximize,
  Minimize,
  RotateCw,
  MessageSquare,
  Star,
  X,
  CheckCircle,
  Edit2,
  Plus,
} from 'lucide-react'
import { booksService, type Book } from '../../services/books'
import { notesService, type Note } from '../../services/notes'
import { Document, Page, pdfjs } from 'react-pdf'

// Set react-pdf worker source to CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Chapter {
  title: string
  page: number
}

const AVAILABLE_TAGS = ['Important', 'Motivation', 'Exam', 'Research', 'Favorite', 'Personal']

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const pageParam = searchParams.get('page')

  const containerRef = useRef<HTMLDivElement>(null)

  // Database book models
  const [rawBook, setRawBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reader states
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [fitMode, setFitMode] = useState<'custom' | 'width' | 'page'>('custom')
  const [rotation, setRotation] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Dimensions of single page
  const [originalPageWidth, setOriginalPageWidth] = useState(600)
  const [originalPageHeight, setOriginalPageHeight] = useState(800)

  // Theme configuration (Persist selection locally)
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>(() => {
    const saved = localStorage.getItem('librovia-reader-theme')
    return saved === 'light' || saved === 'dark' || saved === 'sepia' ? saved : 'sepia'
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'toc' | 'thumbs' | 'bookmarks' | 'notes'>('toc')
  const [showSettings, setShowSettings] = useState(false)

  // Text options (UI mockup elements)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base')
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed')
  const [pageWidth, setPageWidth] = useState<'narrow' | 'medium' | 'wide'>('medium')

  // Reading Journal states
  const [bookNotes, setBookNotes] = useState<Note[]>([])
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [modalRating, setModalRating] = useState<number | undefined>(undefined)
  const [modalNoteText, setModalNoteText] = useState('')
  const [modalHighlightText, setModalHighlightText] = useState('')
  const [modalBookmark, setModalBookmark] = useState(false)
  const [modalTags, setModalTags] = useState<string[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  // Toast notifications
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Chapters Mockup list
  const chapters: Chapter[] = [
    { title: 'Introduction: My Story', page: 1 },
    { title: 'Chapter 1: The Surprising Power of Atomic Habits', page: 12 },
    { title: 'Chapter 2: How Your Habits Shape Your Identity', page: 24 },
    { title: 'Chapter 3: How to Build Better Habits in 4 Simple Steps', page: 38 },
    { title: 'Chapter 4: The Man Who Didnt Look Right', page: 55 },
  ]

  const showNotification = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const fetchNotes = useCallback(async () => {
    if (!id) return
    try {
      const data = await notesService.getNotesForBook(id)
      setBookNotes(data)
    } catch (err) {
      console.error('Failed to load notes:', err)
    }
  }, [id])

  // Query Supabase for book path on mount
  useEffect(() => {
    if (!id) return

    booksService
      .getBookById(id)
      .then((data) => {
        if (!data) {
          setErrorMsg('Book not found or access denied.')
          setLoading(false)
          return
        }

        const isPdf = data.filePath.toLowerCase().split('?')[0].endsWith('.pdf')
        if (!isPdf) {
          setErrorMsg('Only PDF files are supported in this reader mode.')
          setLoading(false)
          return
        }

        setRawBook(data)
        const targetPage = pageParam
          ? Number(pageParam)
          : data.currentPage && data.currentPage > 0
            ? data.currentPage
            : 1
        setPage(targetPage)
        lastSavedPageRef.current = targetPage
        setLoading(false)
        fetchNotes()
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg('Failed to load secure PDF from Supabase storage.')
        setLoading(false)
      })
  }, [id, pageParam, fetchNotes])

  // Synchronize reading progress with Supabase
  const lastSavedPageRef = useRef<number>(1)
  const currentPageRef = useRef<number>(page)
  const totalPagesRef = useRef<number>(totalPages)

  useEffect(() => {
    currentPageRef.current = page
    totalPagesRef.current = totalPages
  }, [page, totalPages])

  // Debounced autosave on page changes
  useEffect(() => {
    if (loading || !rawBook || !page || !totalPages) return
    if (page === lastSavedPageRef.current) return

    const timer = setTimeout(() => {
      lastSavedPageRef.current = page
      if (id) {
        booksService.updateReadingProgress(id, page, totalPages).catch((err) => {
          console.error('Failed to sync progress to Supabase:', err)
        })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [page, totalPages, loading, rawBook, id])

  // Save immediately on unmount/unload
  useEffect(() => {
    return () => {
      if (id) {
        const lastPage = currentPageRef.current
        const total = totalPagesRef.current
        if (lastPage !== lastSavedPageRef.current) {
          booksService.updateReadingProgress(id, lastPage, total).catch((err) => {
            console.error('Failed to save progress on unmount:', err)
          })
        }
      }
    }
  }, [id])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (id) {
        const lastPage = currentPageRef.current
        const total = totalPagesRef.current
        if (lastPage !== lastSavedPageRef.current) {
          booksService.updateReadingProgress(id, lastPage, total).catch((err) => {
            console.error('Failed to save progress on unload:', err)
          })
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [id])

  // Local storage theme synchronization
  useEffect(() => {
    localStorage.setItem('librovia-reader-theme', theme)
  }, [theme])

  // Fullscreen event listener sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto layout fitting scale calculation logic
  const adjustScale = useCallback(() => {
    if (!containerRef.current || !originalPageWidth || !originalPageHeight) return
    const containerWidth = containerRef.current.clientWidth - 48
    const containerHeight = containerRef.current.clientHeight - 48

    if (fitMode === 'width') {
      setScale(containerWidth / originalPageWidth)
    } else if (fitMode === 'page') {
      setScale(Math.min(containerWidth / originalPageWidth, containerHeight / originalPageHeight))
    }
  }, [originalPageWidth, originalPageHeight, fitMode])

  useEffect(() => {
    adjustScale()
    window.addEventListener('resize', adjustScale)
    return () => window.removeEventListener('resize', adjustScale)
  }, [adjustScale])

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const handlePrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleZoomIn = useCallback(() => {
    setFitMode('custom')
    setScale((prev) => Math.min(prev + 0.1, 3.0))
  }, [])

  const handleZoomOut = useCallback(() => {
    setFitMode('custom')
    setScale((prev) => Math.max(prev - 0.1, 0.4))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen mode:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Keyboard shortcut keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          handleNextPage()
          break
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault()
          handlePrevPage()
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
        case '_':
          e.preventDefault()
          handleZoomOut()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleRotate()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          handleFullscreenToggle()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleNextPage,
    handlePrevPage,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    handleFullscreenToggle,
  ])

  // Mouse Up selection highlight detector
  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString()
    if (selected && selected.trim()) {
      setModalHighlightText(selected.trim())
      setModalNoteText('')
      setModalRating(undefined)
      setModalTags([])
      setModalBookmark(false)
      setEditingNoteId(null)
      setIsNotesModalOpen(true)
    }
  }

  // Toggle page bookmark status directly
  const toggleBookmark = async () => {
    const existing = bookNotes.find((n) => n.pageNumber === page)
    try {
      if (existing) {
        const updated = await notesService.saveNote({
          ...existing,
          isBookmarked: !existing.isBookmarked,
        })
        setBookNotes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)))
        showNotification(updated.isBookmarked ? 'Page bookmarked! 🔖' : 'Bookmark removed!')
      } else {
        const created = await notesService.saveNote({
          bookId: id!,
          pageNumber: page,
          noteText: '',
          isBookmarked: true,
          tags: [],
        })
        setBookNotes((prev) => [...prev, created])
        showNotification('Page bookmarked! 🔖')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenNoteModal = () => {
    const existing = bookNotes.find((n) => n.pageNumber === page)
    if (existing) {
      setEditingNoteId(existing.id)
      setModalRating(existing.rating)
      setModalNoteText(existing.noteText)
      setModalHighlightText(existing.highlightedText || '')
      setModalBookmark(existing.isBookmarked)
      setModalTags(existing.tags)
    } else {
      setEditingNoteId(null)
      setModalRating(undefined)
      setModalNoteText('')
      setModalHighlightText('')
      setModalBookmark(false)
      setModalTags([])
    }
    setIsNotesModalOpen(true)
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      const payload = {
        id: editingNoteId || undefined,
        bookId: id,
        pageNumber: page,
        noteText: modalNoteText,
        rating: modalRating,
        highlightedText: modalHighlightText || undefined,
        isBookmarked: modalBookmark,
        tags: modalTags,
      }

      // Optimistic UI updates
      const saved = await notesService.saveNote(payload)
      if (editingNoteId) {
        setBookNotes((prev) => prev.map((n) => (n.id === editingNoteId ? saved : n)))
      } else {
        setBookNotes((prev) => [...prev, saved])
      }

      setIsNotesModalOpen(false)
      showNotification('Note synced to Supabase successfully! 📒')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      await notesService.deleteNote(noteId)
      setBookNotes((prev) => prev.filter((n) => n.id !== noteId))
      showNotification('Note deleted.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTag = (tag: string) => {
    setModalTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
  }

  const onPageLoadSuccess = (p: { width: number; height: number }) => {
    setOriginalPageWidth(p.width)
    setOriginalPageHeight(p.height)
  }

  // Bookmarked pages selector helper
  const bookmarkedPages = bookNotes.filter((n) => n.isBookmarked).map((n) => n.pageNumber)

  // Theme styling definitions
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200 shadow-xl',
    dark: 'bg-neutral-900 text-neutral-100 border-neutral-800 shadow-2xl',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] border-[#e4dcc4] shadow-xl',
  }

  const widthClasses = {
    narrow: 'max-w-md',
    medium: 'max-w-xl',
    wide: 'max-w-3xl',
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-neutral-950 text-neutral-400">
        <div className="border-primary-600 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="mt-4 text-xs font-bold tracking-wider uppercase">
          Loading secure PDF documents...
        </p>
      </div>
    )
  }

  if (errorMsg || !rawBook) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center text-neutral-400">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
          <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase">
            Error Loading Book
          </h2>
          <p className="mt-2 text-xs text-neutral-300">{errorMsg || 'Failed to open reader.'}</p>
          <Link to={ROUTES.LIBRARY} className="mt-6 inline-block">
            <button className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-colors">
              Return to Library
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-300 select-none ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-100 text-slate-800'
      }`}
    >
      {/* Top Toolbar */}
      <header
        className={`z-20 flex h-16 shrink-0 items-center justify-between border-b px-4 ${
          theme === 'dark'
            ? 'border-neutral-800 bg-neutral-900'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        {/* Left side actions */}
        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.LIBRARY}
            className="text-text-sub hover:text-text-main cursor-pointer rounded-lg p-2"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-text-main truncate text-xs font-extrabold tracking-wider uppercase">
              {rawBook.title}
            </h1>
            <p className="text-text-muted mt-0.5 truncate text-[9px] font-bold">
              By {rawBook.author}
            </p>
          </div>
        </div>

        {/* Right side page manipulations */}
        <div className="flex items-center gap-2">
          {/* Zoom Buttons */}
          <div className="border-border-base bg-bg-surface flex items-center rounded-lg border p-0.5">
            <button
              onClick={handleZoomOut}
              className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded p-1.5"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-text-main min-w-12 px-1 text-center font-mono text-[10px] font-bold">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded p-1.5"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Scale Fit Selects */}
          <div className="border-border-base bg-bg-surface hidden items-center rounded-lg border p-0.5 sm:flex">
            <button
              onClick={() => setFitMode(fitMode === 'width' ? 'custom' : 'width')}
              className={`cursor-pointer rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                fitMode === 'width' ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-app'
              }`}
            >
              Fit Width
            </button>
            <button
              onClick={() => setFitMode(fitMode === 'page' ? 'custom' : 'page')}
              className={`ml-1 cursor-pointer rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                fitMode === 'page' ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-app'
              }`}
            >
              Fit Page
            </button>
          </div>

          {/* Rotation Toggle */}
          <button
            onClick={handleRotate}
            className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2"
            title="Rotate Page"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreenToggle}
            className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2"
            title="Fullscreen Toggle"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Theme select switch */}
          <div className="border-border-base bg-bg-surface flex rounded-lg border p-0.5">
            {(['light', 'dark', 'sepia'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                  theme === t ? 'bg-primary-600 text-white' : 'text-text-sub hover:bg-bg-app'
                } `}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Personal Journal Notes modal trigger */}
          <button
            onClick={handleOpenNoteModal}
            className="cursor-pointer rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/20"
            title="Write Study Journal Note"
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </button>

          {/* Bookmark page */}
          <button
            onClick={toggleBookmark}
            className={`cursor-pointer rounded-lg p-2 ${
              bookmarkedPages.includes(page)
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-text-sub hover:bg-bg-app'
            }`}
            title="Bookmark Page"
          >
            <Bookmark
              className="h-4.5 w-4.5"
              fill={bookmarkedPages.includes(page) ? 'currentColor' : 'none'}
            />
          </button>

          {/* Text options settings dropdown */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`cursor-pointer rounded-lg p-2 ${
              showSettings
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10'
                : 'text-text-sub hover:bg-bg-app'
            }`}
            title="Reading Settings"
          >
            <Sliders className="h-4.5 w-4.5" />
          </button>

          {/* Collapse sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`cursor-pointer rounded-lg p-2 ${
              sidebarOpen
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10'
                : 'text-text-sub hover:bg-bg-app'
            }`}
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
          className={`bg-bg-surface border-border-base relative z-10 flex flex-col border-r text-left transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
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
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                      page === ch.page
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 font-bold'
                        : 'text-text-sub hover:bg-bg-app'
                    } `}
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
                {Array.from({ length: Math.min(10, totalPages) }).map((_, idx) => {
                  const pNum = idx * 2 + 1
                  return (
                    <button
                      key={idx}
                      onClick={() => setPage(pNum)}
                      className={`flex aspect-[0.7/1] cursor-pointer flex-col justify-between rounded-lg border p-2 text-center transition-all ${
                        page === pNum
                          ? 'border-primary-500 bg-primary-50/10'
                          : 'border-border-base hover:bg-bg-app'
                      } `}
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
                {bookNotes.filter((n) => n.isBookmarked).length === 0 ? (
                  <p className="text-text-muted py-6 text-center text-[10px]">
                    No bookmarks saved.
                  </p>
                ) : (
                  bookNotes
                    .filter((n) => n.isBookmarked)
                    .map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setPage(n.pageNumber)}
                        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left text-xs ${
                          n.pageNumber === page
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 font-bold'
                            : 'text-text-sub hover:bg-bg-app'
                        } `}
                      >
                        <Bookmark className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                        <div className="min-w-0 flex-1">
                          <span className="block font-bold">Page {n.pageNumber}</span>
                          {n.noteText && (
                            <p className="text-text-muted truncate text-[10px] font-normal">
                              {n.noteText}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <button
                  onClick={handleOpenNoteModal}
                  className="flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-purple-600 text-xs font-bold tracking-wider text-white uppercase shadow-sm hover:bg-purple-700"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add New Note (p. {page})
                </button>

                {/* Annotation items list */}
                <div className="border-border-light space-y-2 border-t pt-2">
                  {bookNotes.length === 0 ? (
                    <p className="text-text-muted py-6 text-center text-[10px]">
                      No personal study notes.
                    </p>
                  ) : (
                    bookNotes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setPage(n.pageNumber)}
                        className={`cursor-pointer space-y-2 rounded-2xl border border-slate-100 bg-white p-3 text-left text-xs shadow-xs transition-colors hover:border-purple-500/35 dark:border-slate-800 dark:bg-slate-900 ${
                          n.pageNumber === page
                            ? 'border-purple-500/40 ring-1 ring-purple-500/10'
                            : ''
                        }`}
                      >
                        {n.rating && (
                          <div className="flex gap-0.5 text-amber-400">
                            {Array.from({ length: n.rating }).map((_, idx) => (
                              <Star key={idx} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                        )}
                        {n.highlightedText && (
                          <p className="border-l-2 border-purple-400 bg-purple-50/50 pl-2 font-serif text-[10px] leading-relaxed text-purple-700 italic dark:bg-purple-950/20 dark:text-purple-300">
                            "{n.highlightedText}"
                          </p>
                        )}
                        {n.noteText && (
                          <p className="leading-relaxed font-semibold text-slate-700 dark:text-slate-300">
                            {n.noteText}
                          </p>
                        )}

                        {n.tags && n.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {n.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-slate-50 px-1 py-0.5 text-[8px] font-bold text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-text-muted mt-1.5 flex items-center justify-between border-t border-slate-50 pt-1.5 font-sans text-[9px] font-bold dark:border-slate-800/40">
                          <span>Page {n.pageNumber}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingNoteId(n.id)
                                setModalRating(n.rating)
                                setModalNoteText(n.noteText)
                                setModalHighlightText(n.highlightedText || '')
                                setModalBookmark(n.isBookmarked)
                                setModalTags(n.tags)
                                setIsNotesModalOpen(true)
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteNote(n.id, e)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                  className="text-text-muted hover:text-text-main cursor-pointer"
                >
                  ✕
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
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${
                        fontSize === sz
                          ? 'bg-primary-600 text-white'
                          : 'text-text-sub hover:bg-bg-surface'
                      }`}
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
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${
                        lineHeight === lh
                          ? 'bg-primary-600 text-white'
                          : 'text-text-sub hover:bg-bg-surface'
                      }`}
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
                      className={`flex-1 cursor-pointer rounded py-1 text-[10px] font-bold tracking-wider uppercase ${
                        pageWidth === wd
                          ? 'bg-primary-600 text-white'
                          : 'text-text-sub hover:bg-bg-surface'
                      }`}
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
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className={`relative flex flex-1 items-start justify-center overflow-auto p-6 sm:p-12 ${
            theme === 'sepia'
              ? 'bg-[#eae3cb]'
              : theme === 'dark'
                ? 'bg-neutral-950'
                : 'bg-neutral-100'
          }`}
        >
          <div className="bg-radial-gradient(circle_at_center,rgba(99,102,241,0.02),transparent) pointer-events-none absolute inset-0" />

          {/* PDF Page Canvas Frame wrapper */}
          <div
            className={`origin-top transition-all duration-300 ${
              themeClasses[theme]
            } ${widthClasses[pageWidth]}`}
            style={{ transform: `scale(${scale})` }}
            onMouseUp={handleMouseUp}
          >
            <Document
              file={rawBook.filePath}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="text-text-sub flex h-[600px] w-[500px] flex-col items-center justify-center text-[10px] font-bold uppercase">
                  Loading PDF pages...
                </div>
              }
              error={
                <div className="flex h-[300px] w-[500px] flex-col items-center justify-center p-6 text-center text-[10px] font-bold text-red-500 uppercase">
                  Failed to render PDF document pages.
                </div>
              }
            >
              <Page
                pageNumber={page}
                rotate={rotation}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="overflow-hidden rounded-2xl"
                loading={
                  <div className="text-text-sub flex h-[600px] w-[500px] items-center justify-center text-[10px] font-bold uppercase">
                    Loading Page {page}...
                  </div>
                }
              />
            </Document>
          </div>

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
        className={`flex h-14 shrink-0 items-center justify-between border-t px-6 ${
          theme === 'dark'
            ? 'border-neutral-800 bg-neutral-900'
            : 'border-slate-200 bg-white shadow-inner'
        }`}
      >
        {/* Left progress indicators */}
        <div className="flex items-center gap-3 text-left">
          <Clock className="text-primary-600 h-4 w-4 shrink-0" />
          <span className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
            {(totalPages - page) * 2} minutes remaining
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

      {/* Reading Journal study Note Modal Popup */}
      <AnimatePresence>
        {isNotesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/45 p-4 text-left backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4.5 flex items-center justify-between border-b border-slate-50 pb-2.5 dark:border-slate-800/40">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                    {editingNoteId ? 'Edit Study Note' : 'Add Study Note'} (Page {page})
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="hover:text-slate-650 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                {/* Highlight text input */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Highlighted Text (Optional)
                  </label>
                  <textarea
                    value={modalHighlightText}
                    onChange={(e) => setModalHighlightText(e.target.value)}
                    placeholder="Highlight text will show here. Drag mouse on page to capture."
                    className="min-h-16 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Rating Input */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Page Rating (Optional)
                  </span>
                  <div className="flex gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setModalRating(modalRating === star ? undefined : star)}
                        className="cursor-pointer text-slate-300 transition-all hover:scale-110 hover:text-amber-400"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            modalRating && modalRating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Personal Thoughts & Notes
                  </label>
                  <textarea
                    required
                    value={modalNoteText}
                    onChange={(e) => setModalNoteText(e.target.value)}
                    placeholder="Add your reading insights or annotations..."
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Tags selection */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => {
                      const active = modalTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`cursor-pointer rounded-xl border px-3 py-1 text-[9px] font-bold uppercase transition-all ${
                            active
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bookmark Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="modal-bookmark"
                    checked={modalBookmark}
                    onChange={(e) => setModalBookmark(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-300 text-purple-600 accent-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="modal-bookmark"
                    className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Bookmark this page
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setIsNotesModalOpen(false)}
                    className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold tracking-wider text-slate-600 uppercase transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-purple-600 px-4.5 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-colors hover:bg-purple-700"
                  >
                    Sync Note
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Action Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed right-6 bottom-6 z-999 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xl dark:border-emerald-500/10 dark:bg-slate-900 dark:text-white"
          >
            <CheckCircle className="h-4.5 w-4.5 fill-emerald-500/10 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
