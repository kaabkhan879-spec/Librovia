import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  Flame,
  Clock,
  HardDrive,
  CheckCircle2,
  FolderOpen,
  Plus,
  Play,
  Star,
  Eye,
  Activity,
  ChevronRight,
  BookMarked,
  Sparkles,
  Info,
  UploadCloud,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const DashboardPage: React.FC = () => {
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [starredBooks, setStarredBooks] = useState<Record<string, boolean>>({
    '1': true,
    '3': false,
  })
  interface Book {
    id: string
    title: string
    author: string
    category: string
    progress: number
    timeLeft: string
    cover: string
    description: string
  }

  const [previewBook, setPreviewBook] = useState<Book | null>(null)

  const toggleStar = (id: string) => {
    setStarredBooks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Realistic mock data
  const stats = [
    {
      title: 'Total Books',
      value: '4',
      sub: '+1 this week',
      icon: BookOpen,
      color: 'text-indigo-500',
    },
    {
      title: 'Currently Reading',
      value: '2',
      sub: 'Active now',
      icon: BookMarked,
      color: 'text-cyan-500',
    },
    {
      title: 'Completed Books',
      value: '12',
      sub: 'Lifetime count',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Reading Hours',
      value: '24.5h',
      sub: 'This month',
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      title: 'Storage Used',
      value: '15.8 MB',
      sub: '1.5% of 1 GB',
      icon: HardDrive,
      color: 'text-purple-500',
    },
    {
      title: 'Reading Streak',
      value: '7 days',
      sub: 'Active streak',
      icon: Flame,
      color: 'text-red-500',
    },
  ]

  const recentBooks = [
    {
      id: '1',
      title: 'Atomic Habits',
      author: 'James Clear',
      category: 'Self-Help',
      progress: 42,
      timeLeft: '1h 45m',
      cover:
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80',
      description:
        'Tiny Changes, Remarkable Results. An easy & proven way to build good habits & break bad ones.',
    },
    {
      id: '2',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      category: 'Engineering',
      progress: 85,
      timeLeft: '30m',
      cover:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=150&q=80',
      description:
        'A Handbook of Agile Software Craftsmanship. Learn to write code that reads like well-written prose.',
    },
    {
      id: '3',
      title: 'Deep Work',
      author: 'Cal Newport',
      category: 'Productivity',
      progress: 15,
      timeLeft: '4h 10m',
      cover:
        'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=150&q=80',
      description:
        'Rules for Focused Success in a Distracted World. Put aside emails and meetings to produce massive outcomes.',
    },
    {
      id: '4',
      title: 'Rich Dad Poor Dad',
      author: 'Robert Kiyosaki',
      category: 'Finance',
      progress: 0,
      timeLeft: '6h 0m',
      cover:
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=150&q=80',
      description:
        'What the Rich Teach Their Kids About Money - That the Poor and Middle Class Do Not!',
    },
  ]

  const collections = [
    { name: 'Programming', count: 5, color: 'from-blue-500 to-indigo-600' },
    { name: 'Islamic Books', count: 3, color: 'from-emerald-500 to-teal-600' },
    { name: 'History', count: 2, color: 'from-amber-500 to-orange-600' },
    { name: 'Business', count: 4, color: 'from-purple-500 to-pink-600' },
    { name: 'Novels', count: 6, color: 'from-red-500 to-rose-600' },
    { name: 'Science', count: 3, color: 'from-cyan-500 to-blue-600' },
  ]

  const activities = [
    { action: 'Uploaded "Atomic Habits"', time: '2 hours ago' },
    { action: 'Finished "Deep Work"', time: '1 day ago' },
    { action: 'Added "Clean Code" to Favorites', time: '2 days ago' },
    { action: 'Created Collection "Business"', time: '3 days ago' },
  ]

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // Animation variants for container staggering
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100 },
    },
  }

  return (
    <div className="space-y-8 text-left select-none">
      {/* Simulation Controls row */}
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
            {isEmptyState ? 'Show Real Dashboard' : 'Show Empty States'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading Skeletons State */}
        {isSkeletonLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6"
          >
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="border-border-base bg-bg-surface flex h-28 animate-pulse flex-col justify-between rounded-2xl border p-4"
              >
                <div className="bg-border-light h-4 w-1/2 rounded" />
                <div className="bg-border-light h-8 w-1/3 rounded" />
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
              <h3 className="text-text-main text-lg font-bold">Your Shelf is Empty</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                You haven't uploaded any books to Librovia yet. Get started by dragging your PDFs
                into the upload tab.
              </p>
            </div>
            <Link to={ROUTES.UPLOAD} className="inline-block">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload Your First Book</Button>
            </Link>
          </motion.div>
        ) : (
          /* Normal Dashboard Render */
          <motion.div
            key="dashboard-content"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* 1. Welcome Header Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1.5">
                <h1 className="text-text-main font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Welcome back, Kaab 👋
                </h1>
                <p className="text-text-muted flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="text-primary-500 h-3.5 w-3.5 animate-pulse" />
                  "Every great reader was once a beginner."
                </p>
              </div>

              {/* Streak Badge */}
              <div className="inline-flex items-center gap-2.5 self-start rounded-2xl border border-red-100 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-600 select-none dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Flame className="h-5 w-5 shrink-0 fill-red-500 text-red-500" />
                <div>
                  <span className="block text-[8px] leading-none tracking-wider text-red-500 uppercase opacity-80">
                    Streak
                  </span>
                  <span className="mt-0.5 block text-sm leading-none">7 Days Running</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Statistics Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            >
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="bg-bg-surface border-border-base hover:border-primary-500/20 flex min-h-[110px] flex-col justify-between rounded-2xl border p-4.5 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-text-muted text-[10px] leading-none font-bold tracking-wider uppercase">
                      {stat.title}
                    </span>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color} shrink-0`} />
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-text-main text-2xl leading-none font-extrabold tracking-tight">
                      {stat.value}
                    </h3>
                    <p className="text-text-sub mt-1 text-[9px] leading-none font-bold tracking-wider uppercase">
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* 3. Continue Reading & Quick Actions split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Continue Reading Large Card */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Continue Reading
                </h3>
                <div className="from-primary-600 shadow-primary-500/10 relative flex flex-col items-stretch justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br to-indigo-600 p-6 text-white shadow-lg sm:flex-row">
                  <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-white/5 blur-2xl select-none" />

                  <div className="flex flex-1 items-start gap-4.5 text-left sm:items-center">
                    <img
                      src={recentBooks[0].cover}
                      alt={recentBooks[0].title}
                      className="aspect-[0.7/1] w-20 shrink-0 rounded-lg border border-white/10 object-cover shadow-lg"
                    />
                    <div className="space-y-2">
                      <span className="inline-block rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                        {recentBooks[0].category}
                      </span>
                      <h4 className="font-sans text-lg font-bold tracking-tight">
                        {recentBooks[0].title}
                      </h4>
                      <p className="text-xs text-indigo-100">{recentBooks[0].author}</p>

                      <div className="mt-2 w-full max-w-[200px]">
                        <div className="mb-1 flex justify-between text-[9px] font-bold tracking-wider text-indigo-100 uppercase">
                          <span>Reading Progress</span>
                          <span>{recentBooks[0].progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                          <div
                            className="h-full bg-white"
                            style={{ width: `${recentBooks[0].progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start justify-between border-t border-white/10 pt-4 text-left sm:items-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-right">
                    <div className="space-y-1">
                      <span className="block text-[9px] tracking-wider text-indigo-200 uppercase">
                        Est. Time Left
                      </span>
                      <span className="block text-sm font-bold">{recentBooks[0].timeLeft}</span>
                    </div>
                    <Link to="/reader/atomic-habits" className="mt-4 sm:mt-0">
                      <Button className="text-primary-600 flex items-center gap-1.5 border-transparent bg-white px-5 py-2.5 font-bold shadow-sm hover:bg-slate-50">
                        <Play className="fill-primary-600 stroke-primary-600 h-3.5 w-3.5" />
                        Resume Reading
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions Panel */}
              <motion.div variants={itemVariants}>
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Quick Actions
                </h3>
                <div className="bg-bg-surface border-border-base flex h-full flex-col justify-between space-y-3 rounded-3xl border p-5 shadow-sm">
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <Link
                      to={ROUTES.UPLOAD}
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <UploadCloud className="text-primary-500 h-5 w-5 shrink-0" />
                      <span className="text-text-main mt-4 text-xs font-bold">Upload Book</span>
                    </Link>
                    <Link
                      to={ROUTES.CATEGORIES}
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <Plus className="h-5 w-5 shrink-0 text-cyan-500" />
                      <span className="text-text-main mt-4 text-xs font-bold">New Shelf</span>
                    </Link>
                    <Link
                      to={ROUTES.LIBRARY}
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <BookOpen className="h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="text-text-main mt-4 text-xs font-bold">Import PDF</span>
                    </Link>
                    <Link
                      to="/reader/atomic-habits"
                      className="bg-bg-app border-border-light hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    >
                      <Play className="h-5 w-5 shrink-0 text-amber-500" />
                      <span className="text-text-main mt-4 text-xs font-bold">Resume Last</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4. Book Grid - Recently Added */}
            <motion.div variants={itemVariants}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-text-muted text-sm font-bold tracking-wider uppercase">
                  Recently Added Books
                </h3>
                <Link
                  to={ROUTES.LIBRARY}
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs font-bold hover:underline"
                >
                  View All Shelf
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentBooks.map((book) => {
                  const isStarred = starredBooks[book.id]
                  return (
                    <motion.div
                      key={book.id}
                      whileHover={{ y: -4 }}
                      className="bg-bg-surface border-border-base hover:border-primary-500/20 flex h-56 flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all"
                    >
                      <div className="flex gap-4">
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="border-border-light aspect-[0.7/1] w-14 shrink-0 rounded border object-cover shadow-md"
                        />
                        <div className="min-w-0 space-y-1">
                          <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                            {book.category}
                          </span>
                          <h4 className="text-text-main truncate text-xs font-bold">
                            {book.title}
                          </h4>
                          <p className="text-text-sub truncate text-[10px]">By {book.author}</p>
                        </div>
                      </div>

                      {/* Progress and bottom actions bar */}
                      <div className="border-border-light mt-3 space-y-3 border-t pt-3">
                        <div>
                          <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold tracking-wider uppercase">
                            <span>Read count</span>
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
                            onClick={() => toggleStar(book.id)}
                            className="border-border-base bg-bg-surface text-text-muted hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                          >
                            <Star
                              className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-text-muted'}`}
                            />
                          </button>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setPreviewBook(book)}
                              className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                              title="Quick Preview Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link to="/reader/atomic-habits">
                              <button className="bg-primary-600 hover:bg-primary-700 flex h-7 cursor-pointer items-center rounded-lg px-3 text-[9px] font-bold tracking-wider text-white uppercase transition-colors">
                                Open
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* 5. Collections & Activity row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* My Collections grid */}
              <motion.div variants={itemVariants} className="text-left lg:col-span-2">
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  My Collections
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {collections.map((col, idx) => (
                    <div
                      key={idx}
                      className="border-border-base bg-bg-surface hover:border-primary-500/20 flex h-28 flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${col.color} flex items-center justify-center text-white`}
                        >
                          <FolderOpen className="h-4.5 w-4.5" />
                        </div>
                        <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded px-1.5 py-0.5 text-[10px] font-bold">
                          {col.count} Books
                        </span>
                      </div>
                      <h4 className="text-text-main mt-4 truncate text-xs font-bold tracking-wider uppercase">
                        {col.name}
                      </h4>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity List */}
              <motion.div variants={itemVariants}>
                <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                  Recent Activity
                </h3>
                <div className="bg-bg-surface border-border-base flex h-full flex-col justify-between rounded-3xl border p-5 shadow-sm">
                  <div className="flex-1 space-y-4">
                    {activities.map((act, idx) => (
                      <div key={idx} className="flex gap-3 text-left">
                        <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-text-main text-xs font-bold">{act.action}</p>
                          <p className="text-text-muted mt-0.5 text-[9px]">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 6. Reading Analytics Chart Section */}
            <motion.div id="analytics-section" variants={itemVariants} className="text-left">
              <h3 className="text-text-muted mb-4 text-sm font-bold tracking-wider uppercase">
                Reading Analytics & Streaks
              </h3>
              <div className="bg-bg-surface border-border-base grid grid-cols-1 gap-8 rounded-3xl border p-6 shadow-sm md:grid-cols-2">
                {/* SVG Chart 1: Weekly Reading Hours */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-text-main text-xs font-bold tracking-wider uppercase">
                      Weekly Reading (Hours)
                    </h4>
                    <p className="text-text-muted mt-0.5 text-[10px]">
                      Simulated activity log from Mon - Sun
                    </p>
                  </div>
                  {/* Clean Vector SVG Chart */}
                  <div className="border-border-base flex h-44 w-full items-end justify-between border-b border-l px-2 pt-4">
                    {[
                      { day: 'M', hrs: 1.5, pct: '35%' },
                      { day: 'T', hrs: 2.0, pct: '50%' },
                      { day: 'W', hrs: 0.5, pct: '12%' },
                      { day: 'T', hrs: 3.2, pct: '85%' },
                      { day: 'F', hrs: 1.8, pct: '45%' },
                      { day: 'S', hrs: 4.0, pct: '100%' },
                      { day: 'S', hrs: 2.5, pct: '62%' },
                    ].map((bar, idx) => (
                      <div key={idx} className="group flex flex-1 flex-col items-center gap-2">
                        <span className="pointer-events-none absolute -translate-y-8 rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {bar.hrs}h
                        </span>
                        <div
                          className="bg-primary-600/30 group-hover:bg-primary-600 w-6 cursor-pointer rounded-t transition-all"
                          style={{ height: `calc(${bar.pct} * 1.2)` }}
                        />
                        <span className="text-text-muted mt-1 text-[9px] font-bold select-none">
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SVG Chart 2: Monthly Progress */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-text-main text-xs font-bold tracking-wider uppercase">
                      Pages Read (Trend)
                    </h4>
                    <p className="text-text-muted mt-0.5 text-[10px]">
                      Total pages logged per week
                    </p>
                  </div>
                  {/* Line SVG Chart representation */}
                  <div className="border-border-base relative h-44 w-full border-b border-l pt-4">
                    <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Area background fill */}
                      <path
                        d="M0 40 L0 30 L25 15 L50 25 L75 5 L100 12 L100 40 Z"
                        fill="url(#gradient-chart)"
                      />
                      {/* Line stroke path */}
                      <path
                        d="M0 30 L25 15 L50 25 L75 5 L100 12"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-text-muted mt-2 flex items-center justify-between px-2 text-[9px] font-bold select-none">
                      <span>Wk 1</span>
                      <span>Wk 2</span>
                      <span>Wk 3</span>
                      <span>Wk 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Details Preview Modal Drawer */}
      <AnimatePresence>
        {previewBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-bg-surface border-border-base w-full max-w-sm space-y-4 rounded-2xl border p-6 text-left shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-primary-600 text-sm font-extrabold tracking-wider uppercase">
                  Quick Details
                </h4>
                <button
                  onClick={() => setPreviewBook(null)}
                  className="text-text-muted hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-1"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="flex gap-4">
                <img
                  src={previewBook.cover}
                  alt={previewBook.title}
                  className="border-border-light aspect-[0.7/1] w-16 shrink-0 rounded border object-cover shadow"
                />
                <div>
                  <h5 className="text-text-main text-sm font-bold">{previewBook.title}</h5>
                  <p className="text-text-sub mt-0.5 text-xs">By {previewBook.author}</p>
                  <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mt-2 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">
                    {previewBook.category}
                  </span>
                </div>
              </div>
              <p className="text-text-sub font-sans text-xs leading-relaxed">
                {previewBook.description}
              </p>
              <div className="border-border-light flex justify-end gap-2 border-t pt-2">
                <Button size="sm" variant="outline" onClick={() => setPreviewBook(null)}>
                  Close
                </Button>
                <Link to="/reader/atomic-habits" onClick={() => setPreviewBook(null)}>
                  <Button size="sm">Open Reader</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
