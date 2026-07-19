import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  BookOpen,
  FileText,
  Highlighter,
  Folder,
  User,
  Clock,
  ChevronRight,
  Sparkles,
  Command,
} from 'lucide-react'
import { booksService, type Book } from '../../services/books'
import { notesService, type Note } from '../../services/notes'
import { collectionsService, type Collection } from '../../services/collections'
import { ROUTES } from '../../constants/routes'

export interface UniversalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export type SearchFilterCategory =
  'all' | 'books' | 'notes' | 'highlights' | 'collections' | 'authors'

export interface SearchResultItem {
  id: string
  type: 'book' | 'note' | 'highlight' | 'collection' | 'author'
  title: string
  subtitle?: string
  snippet?: string
  destination: string
  badge?: string
  bookId?: string
  pageNumber?: number
}

const RECENT_SEARCHES_KEY = 'librovia_recent_searches'
const MAX_RECENT_SEARCHES = 10

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<SearchFilterCategory>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevFilterKey, setPrevFilterKey] = useState('')

  // Reset selected index when query or filter changes during render
  const currentFilterKey = `${debouncedQuery}_${activeFilter}`
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey)
    setSelectedIndex(0)
  }

  // Data states
  const [books, setBooks] = useState<Book[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Recent Searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      return stored
        ? JSON.parse(stored)
        : ['Operating Systems', 'CPU Scheduling', 'Deadlock', 'React']
    } catch {
      return ['Operating Systems', 'CPU Scheduling', 'Deadlock']
    }
  })

  // Debounce input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(handler)
  }, [query])

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
    setQuery('')
    setDebouncedQuery('')
    setActiveFilter('all')
    setSelectedIndex(0)
  } else if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
  }

  // Focus input & load data when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)

      let active = true
      Promise.all([
        booksService.getBooks(),
        notesService.getAllNotes(),
        collectionsService.getCollections(),
      ])
        .then(([booksData, notesData, colsData]) => {
          if (active) {
            setBooks(booksData)
            setNotes(notesData)
            setCollections(colsData)
            setIsLoading(false)
          }
        })
        .catch((err) => {
          console.error('Failed to load data for search:', err)
          if (active) setIsLoading(false)
        })

      return () => {
        active = false
      }
    }
  }, [isOpen])

  // Save query to recent searches
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) return
    const term = searchTerm.trim()
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase())
      const updated = [term, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save recent search:', err)
      }
      return updated
    })
  }, [])

  const handleRemoveRecent = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to update recent searches:', err)
      }
      return updated
    })
  }

  const handleClearAllRecents = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch (err) {
      console.error('Failed to clear recent searches:', err)
    }
  }

  // ----------------------------------------------------
  // UNIVERSAL SEARCH FILTERING ENGINE
  // ----------------------------------------------------
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return []

    const q = debouncedQuery.toLowerCase()
    const results: SearchResultItem[] = []

    // 1. Books Search
    books.forEach((book) => {
      const matchTitle = book.title.toLowerCase().includes(q)
      const matchAuthor = book.author?.toLowerCase().includes(q)
      const matchDesc = book.description?.toLowerCase().includes(q)
      const matchTags = book.tags?.some((t) => t.toLowerCase().includes(q))

      if (matchTitle || matchAuthor || matchDesc || matchTags) {
        results.push({
          id: `book-${book.id}`,
          type: 'book',
          title: book.title,
          subtitle: book.author ? `By ${book.author}` : 'E-Book Document',
          snippet:
            book.description || (book.tags?.length ? `Tags: ${book.tags.join(', ')}` : undefined),
          destination: ROUTES.BOOK_DETAILS.replace(':id', book.id),
          badge: 'Book',
          bookId: book.id,
        })
      }
    })

    // 2. Notes Search
    notes.forEach((note) => {
      const matchTitle = note.noteTitle?.toLowerCase().includes(q)
      const matchText = note.noteText?.toLowerCase().includes(q)

      if (matchTitle || matchText) {
        results.push({
          id: `note-${note.id}`,
          type: 'note',
          title: note.noteTitle || `Note on Page ${note.pageNumber}`,
          subtitle: note.bookTitle ? `Book: ${note.bookTitle}` : `Page ${note.pageNumber}`,
          snippet: note.noteText,
          destination: `/reader/${note.bookId}?page=${note.pageNumber}`,
          badge: `Page ${note.pageNumber}`,
          bookId: note.bookId,
          pageNumber: note.pageNumber,
        })
      }
    })

    // 3. Highlights Search
    notes.forEach((note) => {
      if (note.highlightedText && note.highlightedText.toLowerCase().includes(q)) {
        results.push({
          id: `highlight-${note.id}`,
          type: 'highlight',
          title: `"${note.highlightedText.slice(0, 60)}${
            note.highlightedText.length > 60 ? '...' : ''
          }"`,
          subtitle: note.bookTitle
            ? `Book: ${note.bookTitle} (Page ${note.pageNumber})`
            : `Page ${note.pageNumber}`,
          snippet: note.noteText ? `Annotation: ${note.noteText}` : undefined,
          destination: `/reader/${note.bookId}?page=${note.pageNumber}`,
          badge: 'Highlight',
          bookId: note.bookId,
          pageNumber: note.pageNumber,
        })
      }
    })

    // 4. Collections Search
    collections.forEach((col) => {
      const matchName = col.name.toLowerCase().includes(q)

      if (matchName) {
        results.push({
          id: `col-${col.id}`,
          type: 'collection',
          title: col.name,
          subtitle: `${col.bookCount || 0} books in collection`,
          destination: ROUTES.COLLECTIONS,
          badge: 'Collection',
        })
      }
    })

    // 5. Authors Search
    const authorsMap = new Map<string, number>()
    books.forEach((book) => {
      if (book.author && book.author.trim()) {
        const author = book.author.trim()
        if (author.toLowerCase().includes(q)) {
          authorsMap.set(author, (authorsMap.get(author) || 0) + 1)
        }
      }
    })

    authorsMap.forEach((count, authorName) => {
      results.push({
        id: `author-${authorName}`,
        type: 'author',
        title: authorName,
        subtitle: `${count} ${count === 1 ? 'book' : 'books'} in library`,
        destination: `${ROUTES.LIBRARY}?search=${encodeURIComponent(authorName)}`,
        badge: 'Author',
      })
    })

    return results
  }, [debouncedQuery, books, notes, collections])

  // Filtered by active tab chip
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return searchResults
    if (activeFilter === 'books') return searchResults.filter((r) => r.type === 'book')
    if (activeFilter === 'notes') return searchResults.filter((r) => r.type === 'note')
    if (activeFilter === 'highlights') return searchResults.filter((r) => r.type === 'highlight')
    if (activeFilter === 'collections') return searchResults.filter((r) => r.type === 'collection')
    if (activeFilter === 'authors') return searchResults.filter((r) => r.type === 'author')
    return searchResults
  }, [searchResults, activeFilter])

  // Grouped results for render
  const groupedResults = useMemo(() => {
    const groups: {
      type: 'book' | 'note' | 'highlight' | 'collection' | 'author'
      label: string
      icon: React.ComponentType<{ className?: string }>
      items: SearchResultItem[]
    }[] = [
      { type: 'book', label: 'Books', icon: BookOpen, items: [] },
      { type: 'note', label: 'Notes', icon: FileText, items: [] },
      { type: 'highlight', label: 'Highlights', icon: Highlighter, items: [] },
      { type: 'collection', label: 'Collections', icon: Folder, items: [] },
      { type: 'author', label: 'Authors', icon: User, items: [] },
    ]

    filteredResults.forEach((item) => {
      const group = groups.find((g) => g.type === item.type)
      if (group) group.items.push(item)
    })

    return groups.filter((g) => g.items.length > 0)
  }, [filteredResults])

  // Auto-complete suggestions list
  const autoSuggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    const suggestionsSet = new Set<string>()

    books.forEach((b) => {
      if (b.title.toLowerCase().includes(q)) suggestionsSet.add(b.title)
      if (b.author?.toLowerCase().includes(q)) suggestionsSet.add(b.author)
    })
    notes.forEach((n) => {
      if (n.noteTitle?.toLowerCase().includes(q)) suggestionsSet.add(n.noteTitle)
    })
    collections.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) suggestionsSet.add(c.name)
    })

    return Array.from(suggestionsSet).slice(0, 5)
  }, [query, books, notes, collections])

  // Handle Result Click / Select
  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(debouncedQuery || item.title)
    onClose()
    navigate(item.destination)
  }

  // Keyboard navigation listener (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (filteredResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredResults[selectedIndex]
      if (selected) {
        handleSelectResult(selected)
      }
    }
  }

  if (!isOpen) return null

  let globalIndexCounter = 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-20">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Search Modal Dialog */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: -12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          onKeyDown={handleKeyDown}
          className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header Search Input */}
          <div className="relative flex items-center border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <Search className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, notes, highlights..."
              className="ml-3.5 w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            ) : (
              <kbd className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-400 sm:inline-flex dark:border-slate-700 dark:bg-slate-800">
                <Command className="h-3 w-3" /> K
              </kbd>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="flex scrollbar-none items-center gap-2 overflow-x-auto border-b border-slate-100 px-5 py-2.5 dark:border-slate-800">
            {[
              { id: 'all' as const, label: 'All Results' },
              { id: 'books' as const, label: 'Books' },
              { id: 'notes' as const, label: 'Notes' },
              { id: 'highlights' as const, label: 'Highlights' },
              { id: 'collections' as const, label: 'Collections' },
              { id: 'authors' as const, label: 'Authors' },
            ].map((chip) => {
              const isSelected = activeFilter === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          {/* Body Content Area */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4 text-left">
            {/* Auto-complete suggestions bar */}
            {autoSuggestions.length > 0 && query && (
              <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
                <span className="text-[9.5px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Suggestions:
                </span>
                {autoSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(sug)}
                    className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}

            {/* CASE 1: Empty Query -> Display Recent Searches */}
            {!debouncedQuery ? (
              <div className="space-y-4 px-2 py-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                    <Clock className="h-3.5 w-3.5 text-purple-600" /> Recent Searches
                  </span>
                  {recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRecents}
                      className="text-[10px] font-bold text-slate-400 transition-colors hover:text-rose-500"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <p className="py-4 text-center text-xs font-medium text-slate-400">
                    No recent searches. Type a keyword above to start searching!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => setQuery(term)}
                        className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                      >
                        <Clock className="h-3 w-3 text-slate-400 group-hover:text-purple-600" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(term, e)}
                          className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <X className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isLoading ? (
              /* CASE 2: Loading Skeleton */
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-12 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60"
                  />
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              /* CASE 3: Empty State */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  No results found
                </h4>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Try searching with another keyword or switching filter chips.
                </p>
              </div>
            ) : (
              /* CASE 4: Grouped Search Results */
              <div className="space-y-6">
                {groupedResults.map((group) => {
                  const Icon = group.icon
                  return (
                    <div key={group.type} className="space-y-2">
                      <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                        <Icon className="h-3.5 w-3.5 text-purple-600" />
                        <span>{group.label}</span>
                        <span className="py-0.2 rounded-full bg-slate-100 px-1.5 font-mono text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {group.items.length}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const itemIndex = globalIndexCounter++
                          const isSelected = itemIndex === selectedIndex

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectResult(item)}
                              onMouseEnter={() => setSelectedIndex(itemIndex)}
                              className={`flex cursor-pointer items-center justify-between rounded-2xl p-3 transition-all ${
                                isSelected
                                  ? 'border border-purple-200 bg-purple-50 text-purple-900 shadow-2xs dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200'
                                  : 'border border-transparent text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  <Icon className="h-4.5 w-4.5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                      {item.title}
                                    </span>
                                    {item.badge && (
                                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>

                                  {item.subtitle && (
                                    <p className="truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                                      {item.subtitle}
                                    </p>
                                  )}

                                  {item.snippet && (
                                    <p className="mt-0.5 line-clamp-1 font-sans text-[10px] text-slate-400 italic">
                                      "{item.snippet}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              <ChevronRight
                                className={`h-4 w-4 shrink-0 transition-transform ${
                                  isSelected
                                    ? 'translate-x-0.5 text-purple-600 dark:text-purple-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 font-mono text-[10px] font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-800">
                  ↑
                </kbd>
                <kbd className="rounded border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-800">
                  ↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-800">
                  ↵
                </kbd>{' '}
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 dark:border-slate-700 dark:bg-slate-800">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
