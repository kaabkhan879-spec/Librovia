import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  Search,
  Plus,
  Play,
  Star,
  BookMarked,
  Sparkles,
  Info,
  List,
  Grid,
  ArrowUpDown,
  X,
  Heart,
  FolderHeart,
  MoreVertical,
  Layers,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

interface Book {
  id: string
  title: string
  author: string
  category: string
  progress: number
  format: 'PDF' | 'EPUB'
  cover: string
  description: string
  pages: number
  addedDate: string
  lastOpened: string
}

// Top level static data
const booksData: Book[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Personal Development',
    progress: 42,
    format: 'PDF',
    cover:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80',
    description:
      'Tiny Changes, Remarkable Results. An easy & proven way to build good habits & break bad ones.',
    pages: 320,
    addedDate: '2026-07-01',
    lastOpened: '2 hours ago',
  },
  {
    id: '2',
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Productivity',
    progress: 15,
    format: 'PDF',
    cover:
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=150&q=80',
    description:
      'Rules for Focused Success in a Distracted World. Put aside emails and meetings to produce massive outcomes.',
    pages: 304,
    addedDate: '2026-07-05',
    lastOpened: '1 day ago',
  },
  {
    id: '3',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Programming',
    progress: 85,
    format: 'PDF',
    cover:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=150&q=80',
    description:
      'A Handbook of Agile Software Craftsmanship. Learn to write code that reads like well-written prose.',
    pages: 464,
    addedDate: '2026-06-20',
    lastOpened: '3 hours ago',
  },
  {
    id: '4',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Business',
    progress: 100,
    format: 'EPUB',
    cover:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=150&q=80',
    description:
      'Timeless lessons on wealth, greed, and happiness. Doing well with money isn’t necessarily about what you know.',
    pages: 256,
    addedDate: '2026-07-10',
    lastOpened: 'Opened 3 days ago',
  },
  {
    id: '5',
    title: 'Rich Dad Poor Dad',
    author: 'Robert Kiyosaki',
    category: 'Finance',
    progress: 0,
    format: 'PDF',
    cover:
      'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=150&q=80',
    description:
      'What the Rich Teach Their Kids About Money - That the Poor and Middle Class Do Not!',
    pages: 336,
    addedDate: '2026-07-12',
    lastOpened: 'Never opened',
  },
  {
    id: '6',
    title: "Harry Potter and the Philosopher's Stone",
    author: 'J.K. Rowling',
    category: 'Novels',
    progress: 50,
    format: 'EPUB',
    cover:
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=150&q=80',
    description:
      'The first novel in the Harry Potter series, following a young wizard who discovers his magical heritage.',
    pages: 223,
    addedDate: '2026-06-15',
    lastOpened: 'Opened 2 days ago',
  },
  {
    id: '7',
    title: 'The Pragmatic Programmer',
    author: 'Andy Hunt',
    category: 'Programming',
    progress: 10,
    format: 'PDF',
    cover:
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=150&q=80',
    description:
      'Your Journey To Mastery. David Thomas and Andrew Hunt guide you through engineering practices that excel.',
    pages: 352,
    addedDate: '2026-07-02',
    lastOpened: 'Opened 5 days ago',
  },
]

const collectionsData = [
  {
    name: 'Programming',
    count: 5,
    color: 'from-blue-500 to-indigo-600',
    covers: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'Business & Finance',
    count: 4,
    color: 'from-purple-500 to-pink-600',
    covers: [
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'Islamic Books',
    count: 3,
    color: 'from-emerald-500 to-teal-600',
    covers: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'Science & Tech',
    count: 3,
    color: 'from-cyan-500 to-blue-600',
    covers: [
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'History',
    count: 2,
    color: 'from-amber-500 to-orange-600',
    covers: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'Novels',
    count: 6,
    color: 'from-red-500 to-rose-600',
    covers: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=60&q=80',
    ],
  },
  {
    name: 'Personal Development',
    count: 7,
    color: 'from-violet-500 to-fuchsia-600',
    covers: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=60&q=80',
    ],
  },
]

const statsData = [
  { title: 'Total Books', value: '7', icon: BookOpen, color: 'text-indigo-500' },
  { title: 'Currently Reading', value: '5', icon: BookMarked, color: 'text-cyan-500' },
  { title: 'Favorites', value: '3', icon: Heart, color: 'text-red-500' },
  { title: 'Collections', value: '7', icon: Layers, color: 'text-purple-500' },
  { title: 'Recently Added', value: '+2', icon: Sparkles, color: 'text-amber-500' },
]

type FilterType = 'all' | 'reading' | 'completed' | 'favorites' | 'pdf' | 'epub'
type SortType = 'newest' | 'oldest' | 'a-z' | 'opened'

export const LibraryPage: React.FC = () => {
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('newest')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  // Track starred items locally
  const [starredBooks, setStarredBooks] = useState<Record<string, boolean>>({
    '1': true,
    '2': false,
    '3': true,
    '4': false,
    '5': false,
    '6': true,
    '7': false,
  })

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStarredBooks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter & Sort Logic
  const filteredBooks = useMemo(() => {
    const result = booksData.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (activeFilter === 'reading') return book.progress > 0 && book.progress < 100
      if (activeFilter === 'completed') return book.progress === 100
      if (activeFilter === 'favorites') return starredBooks[book.id]
      if (activeFilter === 'pdf') return book.format === 'PDF'
      if (activeFilter === 'epub') return book.format === 'EPUB'

      return true
    })

    // Sort mappings
    return result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title)
      if (sortBy === 'oldest')
        return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
      if (sortBy === 'newest')
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
      return 0 // default fallback
    })
  }, [searchQuery, activeFilter, sortBy, starredBooks])

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  const filterPills: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Books' },
    { id: 'reading', label: 'Reading' },
    { id: 'completed', label: 'Completed' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'pdf', label: 'PDF' },
    { id: 'epub', label: 'EPUB' },
  ]

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="bg-bg-surface border-border-base flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="text-primary-500 h-4.5 w-4.5 shrink-0" />
          <span>Interactive UI Demos: Toggle empty states or skeleton layouts below.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateLoader}
            className="border-border-base bg-bg-app text-text-sub hover:bg-bg-surface cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors"
          >
            Simulate Loading Skeletons
          </button>
          <button
            onClick={() => setIsEmptyState(!isEmptyState)}
            className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${isEmptyState ? 'bg-primary-600 border-primary-600 text-white' : 'bg-bg-app border-border-base text-text-sub hover:bg-bg-surface'} `}
          >
            {isEmptyState ? 'Show Real Library' : 'Show Empty States'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Skeleton Loader State */}
        {isSkeletonLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-64 animate-pulse flex-col justify-between rounded-2xl border p-4"
              >
                <div className="bg-border-light h-32 rounded" />
                <div className="bg-border-light mt-4 h-4 w-2/3 rounded" />
                <div className="bg-border-light h-3 w-1/3 rounded" />
              </div>
            ))}
          </motion.div>
        ) : isEmptyState ? (
          /* Empty States Layout */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed p-12 text-center"
          >
            <div className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-lg font-bold">Your Library is Empty</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                Upload your first book and start building your digital library. Supporting PDF
                formats.
              </p>
            </div>
            <Link to={ROUTES.UPLOAD} className="inline-block">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload First Book</Button>
            </Link>
          </motion.div>
        ) : (
          /* Real Library Interface */
          <motion.div
            key="library-canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Header section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                  My Library
                </h1>
                <p className="text-text-muted mt-1 text-xs font-semibold tracking-wider uppercase">
                  Manage and organize your personal digital collection.
                </p>
              </div>

              <div className="flex gap-3">
                <Link to={ROUTES.UPLOAD}>
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
                    Upload Book
                  </Button>
                </Link>
                <Button size="sm" variant="primary" leftIcon={<Layers className="h-4 w-4" />}>
                  Create Collection
                </Button>
              </div>
            </div>

            {/* Statistics row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {statsData.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3 }}
                  className="bg-bg-surface border-border-base hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-[9px] leading-none font-bold tracking-wider uppercase">
                      {stat.title}
                    </span>
                    <stat.icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                  </div>
                  <h3 className="text-text-main mt-3 text-2xl leading-none font-extrabold">
                    {stat.value}
                  </h3>
                </motion.div>
              ))}
            </div>

            {/* Recently Opened Scroll */}
            <div>
              <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                Recently Opened
              </h3>
              <div className="flex scrollbar-thin gap-4 overflow-x-auto pb-4 select-none">
                {booksData.slice(0, 3).map((book) => (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="bg-bg-surface border-border-base hover:border-primary-500/20 flex w-64 flex-shrink-0 cursor-pointer gap-4 rounded-2xl border p-3 text-left shadow-sm transition-all"
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="border-border-light aspect-[0.7/1] w-12 shrink-0 rounded border object-cover shadow-sm"
                    />
                    <div className="flex min-w-0 flex-col justify-between">
                      <div>
                        <h4 className="text-text-main truncate text-xs font-bold">{book.title}</h4>
                        <p className="text-text-muted mt-0.5 truncate text-[10px]">
                          {book.lastOpened}
                        </p>
                      </div>
                      <Link to="/reader/atomic-habits" onClick={(e) => e.stopPropagation()}>
                        <button className="text-primary-600 flex items-center gap-1 text-[9px] font-bold uppercase hover:underline">
                          <Play className="fill-primary-600 stroke-primary-600 h-3 w-3" />
                          Continue
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters and Sorting Toolbar */}
            <div className="border-border-base flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
              {/* Category selector pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {filterPills.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveFilter(pill.id)}
                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                      activeFilter === pill.id
                        ? 'bg-primary-600 border-primary-600 shadow-primary-500/10 text-white shadow-sm'
                        : 'bg-bg-surface border-border-base text-text-sub hover:bg-bg-app'
                    } `}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search, Sort & Toggle controls */}
              <div className="flex items-center gap-3 self-stretch md:self-auto">
                {/* Search bar */}
                <div className="relative flex-1 rounded-lg shadow-sm md:w-60 md:flex-none">
                  <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books..."
                    className="border-border-base bg-bg-surface text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border py-1.5 pr-3 pl-8 text-xs transition-all focus:ring-2 focus:outline-none"
                  />
                </div>

                {/* Sorter selector dropdown */}
                <div className="border-border-base bg-bg-surface relative flex items-center rounded-lg border px-2 py-1">
                  <ArrowUpDown className="text-text-muted mr-1.5 h-3.5 w-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="text-text-sub cursor-pointer border-none bg-transparent pr-4 text-xs font-bold focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="a-z">A - Z</option>
                  </select>
                </div>

                {/* Grid/List togglers */}
                <div className="border-border-base bg-bg-surface flex overflow-hidden rounded-lg border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`hover:bg-bg-app cursor-pointer p-1.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-text-muted'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`hover:bg-bg-app cursor-pointer p-1.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'text-text-muted'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Books display area (Grid / List views) */}
            <AnimatePresence mode="wait">
              {filteredBooks.length === 0 ? (
                <motion.div
                  key="no-filter-match"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-text-sub border-border-base bg-bg-surface/30 space-y-2 rounded-2xl border border-dashed py-12 text-center"
                >
                  <FolderHeart className="text-text-muted mx-auto h-8 w-8" />
                  <p className="text-xs font-bold">No matching books found</p>
                  <p className="text-text-muted text-[10px]">
                    Try adjusting your filters or search keywords.
                  </p>
                </motion.div>
              ) : viewMode === 'grid' ? (
                /* Grid layout */
                <motion.div
                  key="grid-shelf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  {filteredBooks.map((book) => {
                    const isStarred = starredBooks[book.id]
                    return (
                      <motion.div
                        key={book.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedBook(book)}
                        className="bg-bg-surface border-border-base hover:border-primary-500/20 flex h-64 cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="border-border-light aspect-[0.7/1] w-16 shrink-0 rounded border object-cover shadow"
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                              {book.category}
                            </span>
                            <h4 className="text-text-main truncate text-xs font-bold">
                              {book.title}
                            </h4>
                            <p className="text-text-sub truncate text-[10px]">By {book.author}</p>
                            <span className="bg-bg-app border-border-light text-text-muted inline-block rounded-md border px-1.5 py-0.5 font-mono text-[8.5px]">
                              {book.format}
                            </span>
                          </div>
                        </div>

                        {/* Progress and bottom actions bar */}
                        <div className="border-border-light mt-3 space-y-3 border-t pt-3">
                          <div>
                            <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold tracking-wider uppercase">
                              <span>Pages read</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="bg-border-light h-1.5 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-primary-600 h-full"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={(e) => toggleStar(book.id, e)}
                              className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                            >
                              <Star
                                className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                              />
                            </button>

                            <div className="flex gap-1.5">
                              <Link to="/reader/atomic-habits" onClick={(e) => e.stopPropagation()}>
                                <button className="bg-primary-600 hover:bg-primary-700 flex h-7 cursor-pointer items-center rounded-lg px-3.5 text-[9px] font-bold tracking-wider text-white uppercase transition-colors">
                                  Read Now
                                </button>
                              </Link>
                              <button className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                /* List layout */
                <motion.div
                  key="list-shelf"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-bg-surface border-border-base divide-border-light divide-y overflow-hidden rounded-2xl border shadow-sm"
                >
                  {filteredBooks.map((book) => {
                    const isStarred = starredBooks[book.id]
                    return (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className="hover:bg-bg-app flex cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="border-border-light aspect-[0.7/1] w-9 shrink-0 rounded border object-cover shadow-sm"
                          />
                          <div className="min-w-0 flex-1 items-center gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3">
                            <div>
                              <h4 className="text-text-main truncate text-xs font-bold">
                                {book.title}
                              </h4>
                              <p className="text-text-muted mt-0.5 truncate text-[10px]">
                                By {book.author}
                              </p>
                            </div>
                            <span className="text-text-sub hidden text-[10px] font-semibold sm:inline-block">
                              {book.category}
                            </span>
                            <span className="text-text-muted hidden font-mono text-[9px] md:inline-block">
                              {book.format} ({book.pages} pages)
                            </span>
                          </div>
                        </div>

                        {/* Progress and star */}
                        <div className="flex shrink-0 items-center gap-6">
                          <div className="hidden w-24 sm:block">
                            <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold uppercase">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="bg-border-light h-1 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-primary-600 h-full"
                                style={{ width: `${book.progress}%` }}
                              />
                            </div>
                          </div>

                          <button
                            onClick={(e) => toggleStar(book.id, e)}
                            className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collections Section */}
            <div>
              <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                My Collections
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {collectionsData.map((col, idx) => (
                  <div
                    key={idx}
                    className="group border-border-base bg-bg-surface hover:border-primary-500/20 flex h-36 cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      {/* Thumbnail collage layout */}
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${col.color} flex shrink-0 items-center justify-center text-white`}
                      >
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-1.5 py-0.5 text-[10px] font-bold">
                        {col.count} Books
                      </span>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-text-main truncate text-xs font-bold tracking-wider uppercase">
                        {col.name}
                      </h4>
                      <p className="text-text-muted mt-0.5 text-[10px]">Shared cloud shelf</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Details Sliding Drawer Panel */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-999 flex justify-end bg-slate-950/20 backdrop-blur-xs select-none">
            {/* Click backdrop to dismiss */}
            <div className="absolute inset-0" onClick={() => setSelectedBook(null)} />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-bg-surface border-border-base relative z-10 flex h-full w-full max-w-md flex-col justify-between overflow-y-auto border-l p-6 text-left shadow-2xl sm:p-8"
            >
              <div className="space-y-6">
                {/* Header title & Close button */}
                <div className="border-border-light flex items-center justify-between border-b pb-4">
                  <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
                    Book Details
                  </span>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-text-muted hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-1.5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Book cover visual block */}
                <div className="flex items-start gap-5">
                  <img
                    src={selectedBook.cover}
                    alt={selectedBook.title}
                    className="border-border-light aspect-[0.7/1] w-24 shrink-0 rounded-lg border object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                      {selectedBook.category}
                    </span>
                    <h3 className="text-text-main text-base leading-snug font-extrabold tracking-tight break-words">
                      {selectedBook.title}
                    </h3>
                    <p className="text-text-sub text-xs font-semibold">By {selectedBook.author}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="bg-bg-app border-border-light text-text-muted rounded border px-1.5 py-0.5 font-mono text-[9px]">
                        {selectedBook.format}
                      </span>
                      <span className="text-text-muted font-mono text-[9px] font-bold">
                        {selectedBook.pages} Pages
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                    Synopsis
                  </h4>
                  <p className="text-text-sub font-sans text-xs leading-relaxed">
                    {selectedBook.description}
                  </p>
                </div>

                {/* Staging statistics */}
                <div className="bg-bg-app border-border-light grid grid-cols-2 gap-4 rounded-xl border p-4">
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Page Progress
                    </span>
                    <span className="text-text-main mt-0.5 block text-xs font-bold">
                      {selectedBook.progress}% Read
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Last Opened
                    </span>
                    <span className="text-text-main mt-0.5 block text-xs font-bold">
                      {selectedBook.lastOpened}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="border-border-light mt-6 flex gap-3 border-t pt-6">
                <button
                  onClick={(e) => {
                    toggleStar(selectedBook.id, e)
                  }}
                  className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-bold tracking-wider uppercase"
                >
                  <Star
                    className={`h-4.5 w-4.5 ${starredBooks[selectedBook.id] ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                  />
                  <span>Favorite</span>
                </button>
                <Link
                  to="/reader/atomic-habits"
                  onClick={() => setSelectedBook(null)}
                  className="flex-1"
                >
                  <Button className="w-full justify-center py-2.5 text-xs font-bold tracking-wider uppercase">
                    Continue Reading
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
