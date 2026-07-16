import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '../../components/common/PageWrapper'
import { ROUTES } from '../../constants/routes'
import { useToast } from '../../context/ToastContext'
import { aiService, type AiActionType } from '../../services/ai'


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
import { notificationsService } from '../../services/notifications'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'


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
  const { showInfo, showSuccess } = useToast()

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
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
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
  const [isAddNotePopupOpen, setIsAddNotePopupOpen] = useState(false)
  const [popupNoteTitle, setPopupNoteTitle] = useState('')
  const [popupNoteText, setPopupNoteText] = useState('')

  // Right sidebar tab state & AI variables
  const [rightSidebarTab, setRightSidebarTab] = useState<'journal' | 'ai'>('journal')
  const [selectedTextForAi, setSelectedTextForAi] = useState('')
  const [customAiText, setCustomAiText] = useState('')
  const [aiAction, setAiAction] = useState<AiActionType | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(320)

  const isResizingRef = useRef(false)

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResizing = useCallback(() => {
    isResizingRef.current = false
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (!isResizingRef.current) return
    const newWidth = window.innerWidth - mouseMoveEvent.clientX
    if (newWidth >= 280 && newWidth <= 600) {
      setSidebarWidth(newWidth)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const handleAiActionDirect = async (textToUse: string, action: AiActionType) => {
    setAiAction(action)
    setAiLoading(true)
    setAiError(null)
    setAiResponse(null)

    try {
      const result = await aiService.runAiAction(textToUse, action, 'en-US')
      setAiResponse(result)
    } catch (err: any) {
      setAiError('AI is currently unavailable. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleCopyAiResponse = () => {
    if (!aiResponse) return
    const cleanText = aiResponse.replace(/[#*`]/g, '')
    navigator.clipboard.writeText(cleanText)
    showSuccess('AI response copied to clipboard!')
  }

  const handleOpenAddNotePopup = () => {
    const selection = window.getSelection()?.toString().trim() || modalHighlightText
    if (!selection) return
    setPopupNoteTitle('')
    setPopupNoteText('')
    setIsAddNotePopupOpen(true)
    setFloatingToolbarPos(null)
  }

  const handleSavePopupNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !modalHighlightText.trim()) return

    try {
      const payload = {
        bookId: id,
        pageNumber: page,
        noteTitle: popupNoteTitle.trim() || undefined,
        noteText: popupNoteText.trim(),
        highlightedText: modalHighlightText.trim(),
        isBookmarked: false,
        tags: [],
        createdAt: new Date().toISOString(),
      }
      const saved = await notesService.saveNote(payload)
      setBookNotes((prev) => [...prev, saved])
      setIsAddNotePopupOpen(false)
      window.getSelection()?.removeAllRanges()
      showSuccess('Note saved successfully! 📝')
    } catch (err) {
      console.error(err)
    }
  }

  const handleTriggerAskAi = () => {
    const selection = window.getSelection()?.toString().trim() || modalHighlightText
    if (!selection) return
    setSelectedTextForAi(selection)
    setAiAction(null)
    setAiResponse(null)
    setAiLoading(false)
    setAiError(null)
    setRightSidebarTab('ai')
    setRightSidebarOpen(true)
    setFloatingToolbarPos(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleQuickHighlight = async () => {
    const selection = window.getSelection()?.toString().trim() || modalHighlightText
    if (!id || !selection) return
    try {
      const payload = {
        bookId: id,
        pageNumber: page,
        noteText: '',
        highlightedText: selection,
        isBookmarked: false,
        tags: [],
      }
      const saved = await notesService.saveNote(payload)
      setBookNotes((prev) => [...prev, saved])
      window.getSelection()?.removeAllRanges()
      setFloatingToolbarPos(null)
      showSuccess('Text highlighted successfully! 🖍')
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopySelectionText = () => {
    const selection = window.getSelection()?.toString().trim() || modalHighlightText
    if (!selection) return
    navigator.clipboard.writeText(selection)
    showSuccess('Copied successfully.')
    setFloatingToolbarPos(null)
    window.getSelection()?.removeAllRanges()
  }

  // Sticky Notes states
  const [stickyNotePromptPos, setStickyNotePromptPos] = useState<{
    top: number
    left: number
    percentX: number
    percentY: number
  } | null>(null)
  const [modalNoteTitle, setModalNoteTitle] = useState('')

  // Selection Floating Toolbar State
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number
    left: number
  } | null>(null)



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
          setErrorMsg('This book is no longer available.')
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

        // Pre-create reading log on first open
        booksService
          .updateReadingProgress(data.id, targetPage, data.totalPages || 320, 0)
          .catch((err) => {
            console.error('Failed to initialize reading progress log:', err)
          })
      })
      .catch((err) => {
        console.error(err)
        setErrorMsg('Failed to load secure PDF from Supabase storage.')
        setLoading(false)
      })
  }, [id, pageParam, fetchNotes])

  // Auto highlight overlay DOM injector
  const injectHighlights = useCallback(() => {
    if (!id || !page) return
    const pageNotes = bookNotes.filter((n) => n.pageNumber === page && n.highlightedText)
    const textLayer = containerRef.current?.querySelector('.react-pdf__Page__textLayer')
    if (!textLayer) return

    const spans = textLayer.getElementsByTagName('span')
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i]
      const text = span.textContent || ''
      if (span.querySelector('mark')) continue // Already injected

      for (const note of pageNotes) {
        const hl = note.highlightedText
        if (hl && text.toLowerCase().includes(hl.toLowerCase())) {
          const escapedHl = hl.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
          const regex = new RegExp(`(${escapedHl})`, 'gi')

          span.innerHTML = text.replace(regex, (match) => {
            const hasTextNote = note.noteText && note.noteText.trim()
            const noteBubble = hasTextNote
              ? `<span class="ml-0.5 opacity-60 text-[8px] align-super select-none inline-flex">💬</span>`
              : ''
            return `<mark class="bg-purple-100/50 dark:bg-purple-950/25 border-b border-purple-400/30 rounded-xs inline relative transition-all" style="pointer-events: none;" data-note-id="${note.id}">${match}${noteBubble}</mark>`
          })
          break
        }
      }
    }
  }, [bookNotes, page, id])

  // Redirect to correct page if target note is on another page
  useEffect(() => {
    const noteIdParam = searchParams.get('noteId')
    if (loading || bookNotes.length === 0 || !noteIdParam) return

    const targetNote = bookNotes.find((n) => n.id === noteIdParam)
    if (targetNote && targetNote.pageNumber !== page) {
      setPage(targetNote.pageNumber)
    }
  }, [loading, bookNotes, searchParams, page])

  // Run highlight injector when page or notes update, and handle scrolling/focus for target noteId
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (!active) return
      injectHighlights()

      const noteIdParam = searchParams.get('noteId')
      if (noteIdParam && bookNotes.length > 0) {
        const targetNote = bookNotes.find((n) => n.id === noteIdParam)
        if (targetNote && targetNote.pageNumber === page) {
          // Scroll & Highlight focus overlay element
          const selector = `[data-note-id="${targetNote.id}"]`
          const element = containerRef.current?.querySelector(selector)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-4', 'ring-purple-500/30', 'animate-pulse')
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-purple-500/30', 'animate-pulse')
            }, 3000)
          }
        }
      }
    }, 450)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [page, bookNotes, injectHighlights, searchParams])

  // Synchronize reading progress with Supabase
  const lastSavedPageRef = useRef<number>(1)
  const currentPageRef = useRef<number>(page)
  const totalPagesRef = useRef<number>(totalPages)

  // Active reading timer
  const activeSecondsRef = useRef<number>(0)

  useEffect(() => {
    const timer = setInterval(() => {
      activeSecondsRef.current += 1
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    currentPageRef.current = page
    totalPagesRef.current = totalPages
  }, [page, totalPages])

  const syncProgress = useCallback(
    (targetPage: number) => {
      if (!id) return
      const total = totalPagesRef.current || 320
      const seconds = activeSecondsRef.current
      activeSecondsRef.current = 0
      booksService.updateReadingProgress(id, targetPage, total, seconds).catch((err) => {
        console.error('Failed to sync progress:', err)
      })

      // Reading Goal Achievement Trigger
      if (targetPage >= total && rawBook && rawBook.progress < 100) {
        notificationsService
          .addNotification(
            'goal',
            'Reading Goal Achieved 🏆',
            `Congratulations! You have completed reading "${rawBook.title}".`
          )
          .catch((e) => console.error(e))
      }
    },
    [id, rawBook]
  )

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (id && page) {
        syncProgress(page)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [id, page, syncProgress])

  // Debounced autosave on page changes
  useEffect(() => {
    if (loading || !rawBook || !page || !totalPages) return
    if (page === lastSavedPageRef.current) return

    const timer = setTimeout(() => {
      lastSavedPageRef.current = page
      syncProgress(page)
    }, 2000)

    return () => clearTimeout(timer)
  }, [page, totalPages, loading, rawBook, syncProgress])

  // Save immediately on unmount/unload
  useEffect(() => {
    return () => {
      if (id) {
        const lastPage = currentPageRef.current
        const total = totalPagesRef.current || 320
        const seconds = activeSecondsRef.current
        activeSecondsRef.current = 0
        booksService.updateReadingProgress(id, lastPage, total, seconds).catch((err) => {
          console.error('Failed to save progress on unmount:', err)
        })
      }
    }
  }, [id])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (id) {
        const lastPage = currentPageRef.current
        const total = totalPagesRef.current || 320
        const seconds = activeSecondsRef.current
        activeSecondsRef.current = 0
        booksService.updateReadingProgress(id, lastPage, total, seconds).catch((err) => {
          console.error('Failed to save progress on unload:', err)
        })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [id])

  // Local storage theme synchronization
  useEffect(() => {
    localStorage.setItem('librovia-reader-theme', theme)
  }, [theme])

  // Close selection toolbar when clicking elsewhere or clearing selection
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Do not clear if clicking inside the floating toolbar
      if (target.closest('.floating-ai-toolbar')) {
        return
      }
      
      // Let selection state settle
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setFloatingToolbarPos(null)
        }
      }, 100)
    }

    document.addEventListener('mouseup', handleGlobalClick)
    return () => document.removeEventListener('mouseup', handleGlobalClick)
  }, [])

  // Keep floating selection toolbar position updated during container/window scrolls
  useEffect(() => {
    const handleScroll = () => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setFloatingToolbarPos({
          top: rect.top - 55,
          left: rect.left + rect.width / 2 - 120,
        })
      }
    }
    // Listen to scrolling on the PDF viewer container
    const pdfViewer = containerRef.current?.parentElement
    if (pdfViewer) {
      pdfViewer.addEventListener('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      if (pdfViewer) pdfViewer.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Fullscreen event listener sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Hide selection toolbar on page changes
  useEffect(() => {
    setFloatingToolbarPos(null)
  }, [page])

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
        case 'Escape':
          window.getSelection()?.removeAllRanges()
          setFloatingToolbarPos(null)
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

  // Mouse Up selection toolbar positioner
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setFloatingToolbarPos(null)
      return
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setFloatingToolbarPos({
      top: rect.top - 55,
      left: rect.left + rect.width / 2 - 120,
    })
    setModalHighlightText(selection.toString().trim())
  }

  // Toggle page bookmark status directly
  const toggleBookmark = async () => {
    const existing = bookNotes.find((n) => n.pageNumber === page && n.xPosition === undefined)
    try {
      if (existing) {
        const updated = await notesService.saveNote({
          ...existing,
          isBookmarked: !existing.isBookmarked,
        })
        setBookNotes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)))
        showNotification(updated.isBookmarked ? 'Page bookmarked! 🔖' : 'Bookmark removed!')
        notificationsService
          .addNotification(
            'note',
            updated.isBookmarked ? 'Page Bookmarked 🔖' : 'Bookmark Removed 🔖',
            `Page ${page} of "${rawBook?.title || 'Book'}" has been ${updated.isBookmarked ? 'bookmarked' : 'unbookmarked'}.`
          )
          .catch((e) => console.error(e))
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
        notificationsService
          .addNotification(
            'note',
            'Page Bookmarked 🔖',
            `Page ${page} of "${rawBook?.title || 'Book'}" has been bookmarked.`
          )
          .catch((e) => console.error(e))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenNoteModal = () => {
    setStickyNotePromptPos(null)
    setModalNoteTitle('')
    const existing = bookNotes.find((n) => n.pageNumber === page && n.xPosition === undefined)
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

  const handleCloseModal = () => {
    setIsNotesModalOpen(false)
    setStickyNotePromptPos(null)
    setModalNoteTitle('')
    window.getSelection()?.removeAllRanges()
  }



  // Sticky note helpers removed to support native page experience

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
        xPosition: stickyNotePromptPos ? stickyNotePromptPos.percentX : undefined,
        yPosition: stickyNotePromptPos ? stickyNotePromptPos.percentY : undefined,
        noteTitle: modalNoteTitle || undefined,
      }

      const saved = await notesService.saveNote(payload)
      if (editingNoteId) {
        setBookNotes((prev) => prev.map((n) => (n.id === editingNoteId ? saved : n)))
      } else {
        setBookNotes((prev) => [...prev, saved])
      }

      setIsNotesModalOpen(false)
      setStickyNotePromptPos(null)
      setModalNoteTitle('')
      window.getSelection()?.removeAllRanges()
      showNotification(editingNoteId ? 'Annotation synced! 💬' : 'Sticky Note placed! 💬')
      notificationsService
        .addNotification(
          'note',
          editingNoteId ? 'Annotation Synced 💬' : 'Annotation Saved 💬',
          editingNoteId
            ? `Annotation on page ${page} of "${rawBook?.title || 'Book'}" has been updated.`
            : `A new annotation has been added on page ${page} of "${rawBook?.title || 'Book'}".`
        )
        .catch((e) => console.error(e))
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
      notificationsService
        .addNotification(
          'note',
          'Annotation Deleted 🗑️',
          `An annotation on page ${page} of "${rawBook?.title || 'Book'}" has been deleted.`
        )
        .catch((e) => console.error(e))
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleTag = (tag: string) => {
    setModalTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Container delegation helper methods removed to avoid selection blockage

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
    const targetPage = pageParam ? Number(pageParam) : null
    if (targetPage !== null) {
      if (targetPage < 1 || targetPage > numPages) {
        setPage(1)
        showInfo(`Page ${targetPage} cannot be found. Opening at page 1 instead.`)
      }
    }
  }

  const onPageLoadSuccess = (p: { width: number; height: number }) => {
    setOriginalPageWidth(p.width)
    setOriginalPageHeight(p.height)
  }

  const bookmarkedPages = bookNotes
    .filter((n) => n.isBookmarked && n.xPosition === undefined)
    .map((n) => n.pageNumber)

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
    <PageWrapper
      className={`flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-200' : 'bg-neutral-100 text-slate-800'
      }`}
    >
      {/* Top Toolbar */}
      <header
        className={`z-25 flex h-16 shrink-0 items-center justify-between border-b px-4 ${
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
          <div className="min-w-0 text-left">
            <h1 className="text-text-main truncate text-xs font-extrabold tracking-wider uppercase">
              {rawBook.title}
            </h1>
            <p className="text-text-muted mt-0.5 truncate text-[9px] font-bold">
              By {rawBook.author}
            </p>
          </div>
        </div>

        {/* Center/Right toolbar buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom Control buttons */}
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

          {/* Fit options */}
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

          <button
            onClick={handleRotate}
            className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2"
            title="Rotate Page"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleFullscreenToggle}
            className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2"
            title="Fullscreen Toggle"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Theme Switchers */}
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

          {/* Custom Journal Note Modal triggers */}
          <button
            onClick={handleOpenNoteModal}
            className="cursor-pointer rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/20"
            title="Write Study Journal Note"
          >
            <Edit2 className="h-4.5 w-4.5" />
          </button>

          {/* Bookmark page directly */}
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

          {/* Collapsible sidebar toggles */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`cursor-pointer rounded-lg p-2 ${
              sidebarOpen
                ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10'
                : 'text-text-sub hover:bg-bg-app'
            }`}
            title="Toggle Sidebar Navigator"
          >
            <List className="h-4.5 w-4.5" />
          </button>

          {/* Toggle Reading Journal Sidebar */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`cursor-pointer rounded-lg p-2 ${
              rightSidebarOpen
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/20'
                : 'text-text-sub hover:bg-bg-app'
            }`}
            title="Toggle Reading Journal Panel"
          >
            <MessageSquare className="h-4.5 w-4.5" />
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
                {bookNotes.filter((n) => n.isBookmarked && n.xPosition === undefined).length ===
                0 ? (
                  <p className="text-text-muted py-6 text-center text-[10px]">
                    No bookmarks saved.
                  </p>
                ) : (
                  bookNotes
                    .filter((n) => n.isBookmarked && n.xPosition === undefined)
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
                  Add Note (p. {page})
                </button>

                <div className="border-border-light space-y-2 border-t pt-2">
                  {bookNotes.filter((n) => n.xPosition === undefined).length === 0 ? (
                    <p className="text-text-muted py-6 text-center text-[10px]">
                      No study notes written.
                    </p>
                  ) : (
                    bookNotes
                      .filter((n) => n.xPosition === undefined)
                      .map((n) => (
                        <div
                          key={n.id}
                          onClick={() => setPage(n.pageNumber)}
                          className={`hover:border-purple-550/35 cursor-pointer space-y-2 rounded-2xl border border-slate-100 bg-white p-3 text-left text-xs shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900 ${
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
                            <p className="line-clamp-2 border-l-2 border-purple-400 bg-purple-50/50 pl-2 font-serif text-[10px] leading-relaxed text-purple-700 italic dark:bg-purple-950/20 dark:text-purple-300">
                              "{n.highlightedText}"
                            </p>
                          )}
                          {n.noteText && (
                            <p className="dark:text-slate-350 leading-relaxed font-semibold text-slate-700">
                              {n.noteText}
                            </p>
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
                                className="hover:text-slate-655 text-slate-400"
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

        {/* Reading Settings Overlay */}
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
            className={`relative origin-top transition-all duration-300 ${
              themeClasses[theme]
            } ${widthClasses[pageWidth]}`}
            style={{ transform: `scale(${scale})` }}
            onMouseUp={handleTextSelection}
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

            {/* Overlays removed to ensure native text selection is distraction free */}
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
            className="border-border-base bg-bg-surface/80 hover:bg-bg-surface text-text-sub fixed top-1/2 right-[320px] z-10 hidden -translate-y-1/2 cursor-pointer rounded-full border p-3 shadow transition-all disabled:opacity-20 lg:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Collapsible Right Sidebar: 📒 Reading Journal / ✨ Notion AI */}
        <AnimatePresence>
          {rightSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative z-10 flex flex-col border-l border-slate-100 bg-white text-left transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 h-full shrink-0 overflow-hidden"
            >
              {/* Resize Handle */}
              <div
                onMouseDown={startResizing}
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500/30 transition-colors z-30"
              />

              <div className="dark:bg-slate-850 flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/45 px-4 py-3 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRightSidebarTab('journal')}
                    className={`text-[9px] font-extrabold tracking-widest uppercase py-1 px-2.5 rounded-lg transition-all ${
                      rightSidebarTab === 'journal'
                        ? 'bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 font-black'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    Journal
                  </button>
                  <button
                    onClick={() => setRightSidebarTab('ai')}
                    className={`text-[9px] font-extrabold tracking-widest uppercase py-1 px-2.5 rounded-lg transition-all ${
                      rightSidebarTab === 'ai'
                        ? 'bg-purple-50 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 font-black'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    ✨ Ask AI
                  </button>
                </div>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="cursor-pointer font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              {rightSidebarTab === 'journal' ? (
                <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                  {bookNotes.length === 0 ? (
                    <p className="py-8 text-center text-[10px] leading-relaxed text-slate-400">
                      No annotations saved. Select text on a page to highlight or click "+ Add Note"
                      inside the panel.
                    </p>
                  ) : (
                    bookNotes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setPage(n.pageNumber)
                          setTimeout(() => {
                            const mark = document.querySelector(`mark[data-note-id="${n.id}"]`)
                            if (mark) {
                              mark.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              mark.classList.add('ring-4', 'ring-purple-500/30', 'animate-pulse')
                              setTimeout(() => {
                                mark.classList.remove('ring-4', 'ring-purple-500/30', 'animate-pulse')
                              }, 2000)
                            }
                          }, 350)
                        }}
                        className={`hover:border-purple-550/35 cursor-pointer space-y-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 text-xs shadow-xs transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-950/20 ${
                          n.pageNumber === page
                            ? 'border-purple-500/40 bg-white ring-1 ring-purple-500/10'
                            : ''
                        }`}
                      >
                        <div className="text-purple-655 flex items-center justify-between text-[9px] font-extrabold uppercase">
                          <span className="flex items-center gap-1">
                            {n.xPosition !== undefined ? '📌 Sticky Note' : '📄 Page Note'} (p.{' '}
                            {n.pageNumber})
                          </span>
                          {n.isBookmarked && (
                            <Bookmark className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>

                        {n.noteTitle && (
                          <h4 className="truncate text-[11px] font-bold text-slate-900 dark:text-white">
                            {n.noteTitle}
                          </h4>
                        )}

                        {n.rating && (
                          <div className="flex gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`h-3 w-3 ${idx < n.rating! ? 'fill-current' : 'text-slate-200 dark:text-slate-800'}`}
                              />
                            ))}
                          </div>
                        )}

                        {n.highlightedText && (
                          <p className="line-clamp-3 border-l-2 border-purple-400 bg-slate-50 py-0.5 pl-2 font-serif text-[9px] leading-relaxed italic dark:bg-slate-800">
                            "{n.highlightedText}"
                          </p>
                        )}

                        {n.noteText && (
                          <p className="leading-relaxed font-semibold text-slate-800 dark:text-slate-200">
                            {n.noteText}
                          </p>
                        )}

                        {n.tags && n.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {n.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="dark:border-slate-850 flex shrink-0 justify-end gap-2 border-t border-slate-50 pt-2 text-[10px] font-bold tracking-wider uppercase">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingNoteId(n.id)
                              setModalNoteTitle(n.noteTitle || '')
                              setModalRating(n.rating)
                              setModalNoteText(n.noteText)
                              setModalHighlightText(n.highlightedText || '')
                              setModalBookmark(n.isBookmarked)
                              setModalTags(n.tags)
                              if (n.xPosition !== undefined) {
                                setStickyNotePromptPos({
                                  top: 0,
                                  left: 0,
                                  percentX: n.xPosition,
                                  percentY: n.yPosition || 0,
                                })
                              } else {
                                setStickyNotePromptPos(null)
                              }
                              setIsNotesModalOpen(true)
                            }}
                            className="hover:text-slate-655 text-slate-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(n.id, e)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
                  {/* Selected Text Excerpt Card */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
                    <span className="text-[8px] font-extrabold tracking-widest text-slate-400 uppercase">
                      Selected Excerpt
                    </span>
                    {selectedTextForAi ? (
                      <p className="line-clamp-4 font-serif text-[10px] leading-relaxed italic text-slate-600 dark:text-slate-400 border-l-2 border-purple-400 pl-2">
                        "{selectedTextForAi}"
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Type or paste text here to ask the AI assistant..."
                          value={customAiText}
                          onChange={(e) => setCustomAiText(e.target.value)}
                          className="w-full text-[10.5px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans resize-none"
                          rows={3}
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(['explain', 'summarize', 'key-points', 'simplify'] as const).map((act) => (
                            <button
                              key={act}
                              onClick={() => {
                                if (customAiText.trim()) {
                                  setSelectedTextForAi(customAiText.trim())
                                  handleAiActionDirect(customAiText.trim(), act)
                                }
                              }}
                              disabled={!customAiText.trim()}
                              className="text-[8px] font-extrabold uppercase py-1 px-2 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-650 dark:bg-purple-950/20 dark:text-purple-400 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                              {act === 'key-points' ? '💡 Key Points' : act === 'explain' ? '✨ Explain' : act === 'summarize' ? '📝 Summarize' : '📚 Simplify'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!aiAction ? (
                    /* Initial AI Action Picker */
                    <div className="flex-1 flex flex-col justify-center p-6 space-y-4">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">
                          ✨ Librovia AI
                        </span>
                        <p className="text-xs text-slate-400">
                          Select an action to run on your selection
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'explain', label: '✨ Explain Selection', desc: 'Explain this text in simple language' },
                          { id: 'summarize', label: '📝 Summarize Selection', desc: 'Create a concise summary of the text' },
                          { id: 'key-points', label: '💡 Extract Key Points', desc: 'Pull out the main takeaways' },
                          { id: 'simplify', label: '📚 Simplify Language', desc: 'Rewrite the selection for beginners' },
                          { id: 'translate', label: '🌍 Translate Selection', desc: 'Translate selection into target languages' },
                        ].map((act) => (
                          <button
                            key={act.id}
                            onClick={() => {
                              const text = selectedTextForAi || customAiText.trim()
                              if (text) {
                                setSelectedTextForAi(text)
                                handleAiActionDirect(text, act.id as any)
                              }
                            }}
                            disabled={!selectedTextForAi && !customAiText.trim()}
                            className="w-full text-left rounded-xl border border-slate-100 hover:border-purple-200 bg-white hover:bg-purple-50/30 p-3 transition-all cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-purple-950/15 disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <span className="block text-xs font-bold text-slate-800 dark:text-white">
                              {act.label}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {act.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* AI Thinking / Response Display */
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {aiLoading ? (
                          <div className="space-y-4 py-4">
                            <span className="text-[10px] font-extrabold tracking-widest text-purple-650 animate-pulse uppercase block">
                              ✨ Thinking...
                            </span>
                            <div className="space-y-2.5 animate-pulse">
                              <div className="h-3 w-full rounded-md shimmer-placeholder bg-slate-100 dark:bg-slate-800" />
                              <div className="h-3 w-[92%] rounded-md shimmer-placeholder bg-slate-100 dark:bg-slate-800" />
                              <div className="h-3 w-[95%] rounded-md shimmer-placeholder bg-slate-100 dark:bg-slate-800" />
                              <div className="h-3 w-[78%] rounded-md shimmer-placeholder bg-slate-100 dark:bg-slate-800" />
                            </div>
                          </div>
                        ) : aiError ? (
                          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                            <span className="text-xs font-bold text-red-500">{aiError}</span>
                          </div>
                        ) : aiResponse ? (
                          <div className="prose prose-sm dark:prose-invert font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-350 space-y-3">
                            {aiResponse.split('\n').map((line, idx) => {
                              if (line.startsWith('###')) {
                                return (
                                  <h4 key={idx} className="text-xs font-black uppercase text-purple-650 tracking-wider pt-2">
                                    {line.replace('###', '')}
                                  </h4>
                                )
                              }
                              if (line.startsWith('*')) {
                                return (
                                  <li key={idx} className="list-disc pl-1 ml-4 text-slate-700 dark:text-slate-300">
                                    {line.replace('*', '').trim()}
                                  </li>
                                )
                              }
                              if (line.startsWith('**')) {
                                return (
                                  <p key={idx} className="font-semibold text-slate-900 dark:text-white">
                                    {line}
                                  </p>
                                )
                              }
                              return (
                                <p key={idx} className="text-slate-700 dark:text-slate-300">
                                  {line}
                                </p>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-xs text-slate-400">
                            No active AI prompts. Select an option to query AI.
                          </div>
                        )}
                      </div>

                      {/* Footer controls inside AI Panel */}
                      {aiResponse && !aiLoading && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 bg-slate-50/20 dark:bg-slate-900/35">
                          <button
                            onClick={handleCopyAiResponse}
                            className="flex-1 cursor-pointer rounded-xl bg-purple-600 text-white font-bold text-xs py-2 transition-all hover:bg-purple-750 active:scale-95 text-center shadow-md animate-fade-in"
                          >
                            Copy Output
                          </button>
                          <button
                            onClick={() => handleAiActionDirect(selectedTextForAi, aiAction!)}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs py-2 px-3 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={() => setAiAction(null)}
                            className="cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs py-2 px-3 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          >
                            Back
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Selection Floating Action Toolbar */}
      <AnimatePresence>
        {floatingToolbarPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'fixed',
              top: floatingToolbarPos.top,
              left: floatingToolbarPos.left,
            }}
            className="floating-ai-toolbar z-50 flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-900/95 p-1 text-white shadow-2xl backdrop-blur-xs dark:border-slate-800"
          >
            <button
              onClick={handleOpenAddNotePopup}
              className="text-purple-300 flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-white/10"
            >
              📝 Add Note
            </button>
            <button
              onClick={handleTriggerAskAi}
              className="text-purple-300 flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-white/10"
            >
              ✨ Ask AI
            </button>
            <button
              onClick={handleQuickHighlight}
              className="text-yellow-350 flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-white/10"
            >
              🖍 Highlight
            </button>
            <button
              onClick={toggleBookmark}
              className="text-amber-300 flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-white/10"
            >
              🔖 Bookmark
            </button>
            <button
              onClick={handleCopySelectionText}
              className="text-slate-300 flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors hover:bg-white/10"
            >
              📋 Copy
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover preview tooltip overlay removed */}

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
                  onClick={handleCloseModal}
                  className="hover:text-slate-655 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                {/* Note Title Input */}
                <div className="space-y-1">
                  <label className="block font-sans text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    Note Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter annotation title..."
                    value={modalNoteTitle}
                    onChange={(e) => setModalNoteTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
                  />
                </div>

                {/* Highlight text input */}
                {modalHighlightText && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      Selected Text (Read-Only)
                    </label>
                    <textarea
                      readOnly
                      value={modalHighlightText}
                      placeholder="No selection captured."
                      className="min-h-16 w-full rounded-2xl border border-slate-200 bg-slate-100/50 p-3 font-serif text-xs text-slate-500 italic outline-hidden transition-all focus:border-purple-600 focus:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"
                    />
                  </div>
                )}

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
                  <label className="block font-sans text-[9px] font-bold tracking-widest text-slate-400 uppercase">
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
                    className="animate-pulse cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Bookmark this page
                  </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
                  <button
                    type="button"
                    onClick={handleCloseModal}
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

      {/* Slide Up Add Note Popup Modal */}
      <AnimatePresence>
        {isAddNotePopupOpen && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/45 p-4 text-left backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/40">
                <span className="text-[10px] font-black uppercase text-purple-650 tracking-widest">
                  📝 Add Note (Page {page})
                </span>
                <button
                  onClick={() => setIsAddNotePopupOpen(false)}
                  className="cursor-pointer font-bold text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePopupNote} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Note Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter note title..."
                    value={popupNoteTitle}
                    onChange={(e) => setPopupNoteTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Personal Thoughts & Notes
                  </label>
                  <textarea
                    placeholder="Add your reading insights or annotations..."
                    value={popupNoteText}
                    onChange={(e) => setPopupNoteText(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/25 font-sans"
                    rows={4}
                    required
                  />
                </div>

                {modalHighlightText && (
                  <div className="space-y-1 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Selected Text
                    </span>
                    <p className="line-clamp-3 font-serif text-[10px] leading-relaxed italic text-slate-500 dark:text-slate-400 border-l-2 border-purple-400 pl-2">
                      "{modalHighlightText}"
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddNotePopupOpen(false)}
                    className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer text-xs font-bold text-white bg-purple-600 rounded-xl px-5 py-2 hover:bg-purple-750 active:scale-95 transition-all shadow-md shadow-purple-600/10"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
    </PageWrapper>
  )
}
