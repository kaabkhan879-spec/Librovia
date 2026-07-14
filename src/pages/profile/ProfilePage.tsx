import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  CheckCircle,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Bell,
  Edit,
  Activity,
  Sparkles,
  Compass,
  ChevronRight,
  BookMarked,
  X,
  Layers,
} from 'lucide-react'
import { Button } from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  // Local profile states (High-fidelity updates!)
  const [profileName, setProfileName] = useState(user?.displayName || 'Kaab Khan')
  const [profileUsername, setProfileUsername] = useState(user?.email?.split('@')[0] || 'kaabkhan')
  const [profileBio, setProfileBio] = useState(
    'Avid reader, tech enthusiast, and collector of rare digital books. Compounding knowledge 1% every day.'
  )
  const [profileEmail, setProfileEmail] = useState(user?.email || 'kaab@librovia.com')

  // Edit fields temp storage
  const [editName, setEditName] = useState(profileName)
  const [editUsername, setEditUsername] = useState(profileUsername)
  const [editBio, setEditBio] = useState(profileBio)
  const [editEmail, setEditEmail] = useState(profileEmail)

  useEffect(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()]).then(
      ([booksData, colsData]) => {
        setBooks(booksData)
        setCollections(colsData)
        setLoading(false)
      }
    )
  }, [])

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileName(editName)
    setProfileUsername(editUsername)
    setProfileBio(editBio)
    setProfileEmail(editEmail)
    setShowEditModal(false)
  }

  // --- STATS CALCULATION ---
  const totalBooksRead = useMemo(() => books.filter((b) => b.progress === 100).length, [books])
  const currentlyReading = useMemo(
    () => books.filter((b) => b.progress > 0 && b.progress < 100).length,
    [books]
  )
  const pagesRead = useMemo(
    () => books.reduce((acc, b) => acc + (b.progress > 0 ? b.currentPage : 0), 0),
    [books]
  )
  const totalReadingSeconds = useMemo(
    () => books.reduce((acc, b) => acc + (b.readingTime || 0), 0),
    [books]
  )
  const readingTimeStr = useMemo(() => {
    const mins = Math.floor(totalReadingSeconds / 60)
    if (mins >= 60) {
      return `${(totalReadingSeconds / 3600).toFixed(1)}h`
    }
    return `${mins}m`
  }, [totalReadingSeconds])

  const stats = [
    {
      title: 'Total Books Read',
      value: String(totalBooksRead),
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Currently Reading',
      value: String(currentlyReading),
      icon: BookMarked,
      color: 'text-cyan-500',
    },
    {
      title: 'Pages Read',
      value: pagesRead.toLocaleString(),
      icon: BookOpen,
      color: 'text-indigo-500',
    },
    { title: 'Reading Time', value: readingTimeStr, icon: Clock, color: 'text-amber-500' },
    { title: 'Uploaded Books', value: String(books.length), icon: Compass, color: 'text-rose-500' },
  ]

  const achievements = useMemo(() => {
    return [
      {
        title: 'First Book Completed',
        desc: 'Read a full book cover-to-cover.',
        icon: CheckCircle2,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100',
        progress: totalBooksRead > 0 ? 100 : 0,
      },
      {
        title: 'Book Explorer',
        desc: 'Upload at least 5 books.',
        icon: Compass,
        color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100',
        progress: Math.min(100, Math.round((books.length / 5) * 100)),
      },
      {
        title: 'Knowledge Seeker',
        desc: 'Log 5 hours of total reading time.',
        icon: Award,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-100',
        progress: Math.min(100, Math.round((totalReadingSeconds / 18000) * 100)),
      },
    ]
  }, [books.length, totalBooksRead, totalReadingSeconds])

  const categoryStats = useMemo(() => {
    if (collections.length === 0) {
      return [
        { name: 'Classics', percent: books.length > 0 ? 100 : 0, count: `${books.length} books` },
      ]
    }
    const list = collections.map((col) => {
      const count = books.filter((b) => b.collectionId === col.id).length
      const percent = books.length > 0 ? Math.round((count / books.length) * 100) : 0
      return {
        name: col.name,
        percent,
        count: count === 1 ? '1 book' : `${count} books`,
      }
    })
    return list.sort((a, b) => b.percent - a.percent).slice(0, 4)
  }, [collections, books])

  const recentHistory = useMemo(() => {
    return books
      .filter((b) => b.lastReadAt !== undefined)
      .sort((a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime())
      .slice(0, 3)
      .map((b) => {
        const timeDiff = new Date().getTime() - new Date(b.lastReadAt!).getTime()
        const hrs = Math.floor(timeDiff / (1000 * 60 * 60))
        let timeStr = 'Just now'
        if (hrs > 0) {
          timeStr = hrs === 1 ? '1 hour ago' : `${hrs} hours ago`
          if (hrs >= 24) {
            const days = Math.floor(hrs / 24)
            timeStr = days === 1 ? '1 day ago' : `${days} days ago`
          }
        } else {
          const mins = Math.floor(timeDiff / (1000 * 60))
          if (mins > 0) {
            timeStr = `${mins} mins ago`
          }
        }
        return {
          book: b.title,
          activity: `Logged page ${b.currentPage} (${b.progress}% progress)`,
          time: timeStr,
        }
      })
  }, [books])

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } },
  }

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      <AnimatePresence mode="wait">
        {loading ? (
          /* Profile Skeletons */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            <div className="border-border-base bg-bg-surface h-[250px] animate-pulse rounded-3xl border p-6" />
            <div className="border-border-base bg-bg-surface h-[400px] animate-pulse rounded-3xl border p-8 lg:col-span-2" />
          </motion.div>
        ) : (
          /* Real Profile view */
          <motion.div
            key="profile-canvas"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3"
          >
            {/* Left Column: Avatar, Bio, Details card */}
            <div className="space-y-6 lg:col-span-1">
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base relative overflow-hidden rounded-3xl border p-6 text-center shadow-sm sm:p-8"
              >
                {/* Decorative gradients */}
                <div className="bg-primary-500/10 dark:bg-primary-500/5 absolute top-0 left-0 h-24 w-full" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=200&h=200&q=80"
                      alt="Kaab Khan"
                      className="border-bg-surface h-20 w-20 rounded-full border-4 object-cover shadow-md"
                    />
                    <div className="bg-primary-500 absolute right-0 bottom-0 rounded-full p-1.5 text-white shadow-xs">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  </div>

                  <h3 className="text-text-main mt-4 text-lg font-bold">{profileName}</h3>
                  <p className="text-primary-600 dark:text-primary-400 text-xs font-semibold">
                    @{profileUsername}
                  </p>

                  <p className="text-text-sub mt-4 text-center font-sans text-xs leading-relaxed">
                    {profileBio}
                  </p>

                  <div className="mt-6 flex w-full justify-center gap-3">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold shadow-2xs transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Personal account properties list card */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
              >
                <div className="border-border-light border-b pb-2.5">
                  <h4 className="text-primary-600 text-xs font-extrabold tracking-widest uppercase">
                    Account Details
                  </h4>
                </div>

                <div className="space-y-3 font-sans text-xs font-semibold">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">
                      Registered Email
                    </span>
                    <span className="text-text-main mt-0.5 block">{profileEmail}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">
                      Account Status
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Verified Sandbox (Active)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">
                      Default Server
                    </span>
                    <span className="text-text-main mt-0.5 block font-mono text-[10px]">
                      ap-south-1.supabase.co
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Sidebar Quick controls shortcuts */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
              >
                <div className="border-border-light border-b pb-2.5">
                  <h4 className="text-primary-600 text-xs font-extrabold tracking-widest uppercase">
                    Quick Links
                  </h4>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Security & Keys Defaults', icon: Lock },
                    { label: 'Subscribed Alerts Alerts', icon: Bell },
                    { label: 'Data & Privacy Settings', icon: ShieldAlert },
                  ].map((set, idx) => (
                    <div
                      key={idx}
                      className="bg-bg-app hover:bg-bg-surface hover:border-border-base text-text-sub group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-2 text-xs font-semibold transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <set.icon className="text-text-muted group-hover:text-primary-600 h-4 w-4" />
                        <span>{set.label}</span>
                      </div>
                      <ChevronRight className="text-text-muted h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Statistics, Activity Chart, Badges & Interests */}
            <div className="space-y-6 lg:col-span-2">
              {/* Reading stats widgets grid */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 gap-4 sm:grid-cols-5"
              >
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -3 }}
                    className="bg-bg-surface border-border-base hover:border-primary-500/20 flex flex-col justify-between rounded-2xl border p-4.5 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted text-[9px] leading-none font-bold tracking-wider uppercase">
                        {stat.title}
                      </span>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.color} shrink-0`} />
                    </div>
                    <h3 className="text-text-main mt-3 font-mono text-xl leading-none font-extrabold">
                      {stat.value}
                    </h3>
                  </motion.div>
                ))}
              </motion.div>

              {/* Weekly Reading Chart UI */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
              >
                <div>
                  <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <Activity className="h-4.5 w-4.5" />
                    <span>Weekly Reading Hours</span>
                  </h4>
                  <p className="text-text-muted mt-1 text-[10px]">
                    Simulated reading duration logged Mon - Sun
                  </p>
                </div>
                {/* SVG vector graph */}
                <div className="border-border-base flex h-32 w-full items-end justify-between border-b border-l px-2 pt-2">
                  {[
                    { day: 'M', hrs: '1.2h', pct: '30%' },
                    { day: 'T', hrs: '2.4h', pct: '60%' },
                    { day: 'W', hrs: '0.8h', pct: '20%' },
                    { day: 'T', hrs: '3.6h', pct: '90%' },
                    { day: 'F', hrs: '1.5h', pct: '40%' },
                    { day: 'S', hrs: '4.0h', pct: '100%' },
                    { day: 'S', hrs: '2.0h', pct: '50%' },
                  ].map((bar, idx) => (
                    <div key={idx} className="group flex flex-1 flex-col items-center gap-1">
                      <span className="pointer-events-none absolute -translate-y-6 rounded bg-neutral-900 px-1.5 py-0.5 text-[8px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {bar.hrs}
                      </span>
                      <div
                        className="bg-primary-600/35 group-hover:bg-primary-600 w-5 cursor-pointer rounded-t transition-all"
                        style={{ height: `calc(${bar.pct} * 0.8)` }}
                      />
                      <span className="text-text-muted mt-1 text-[9px] font-bold select-none">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Achievements & badges row */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
              >
                <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                  <Award className="h-4.5 w-4.5" />
                  <span>Unlocked achievements</span>
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {achievements.map((ach, idx) => (
                    <div
                      key={idx}
                      className="border-border-base bg-bg-app/40 flex items-start gap-3 rounded-2xl border p-4 shadow-sm"
                    >
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ach.color}`}
                      >
                        <ach.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1 text-left">
                        <h5 className="text-text-main truncate text-xs leading-tight font-bold">
                          {ach.title}
                        </h5>
                        <p className="text-text-muted font-sans text-[9.5px] leading-tight">
                          {ach.desc}
                        </p>
                        {/* Progress bar */}
                        <div className="pt-2">
                          <div className="text-text-sub mb-1 flex justify-between text-[8px] font-semibold">
                            <span>Progress</span>
                            <span>{ach.progress}%</span>
                          </div>
                          <div className="bg-border-light h-1 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-primary-600 h-full"
                              style={{ width: `${ach.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Favorite Categories / Reading Interests */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
              >
                <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                  <Layers className="h-4.5 w-4.5" />
                  <span>Favorite genres & interests</span>
                </h4>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {categoryStats.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-main">{cat.name}</span>
                        <span className="text-text-muted font-mono text-[10px]">{cat.count}</span>
                      </div>
                      <div className="bg-border-light h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary-600/80 h-full rounded-full"
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Reading History Activity log */}
              {recentHistory.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-6 text-left shadow-sm"
                >
                  <h4 className="text-primary-600 border-border-light flex items-center gap-1.5 border-b pb-2.5 text-xs font-extrabold tracking-widest uppercase">
                    <Activity className="h-4.5 w-4.5" />
                    <span>Reading Activity history</span>
                  </h4>
                  <div className="space-y-3.5">
                    {recentHistory.map((hist, idx) => (
                      <div key={idx} className="flex gap-3 text-left">
                        <div className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-text-main text-xs font-bold">
                            {hist.activity} in{' '}
                            <span className="text-primary-600 cursor-pointer hover:underline">
                              {hist.book}
                            </span>
                          </p>
                          <p className="text-text-muted mt-0.5 font-mono text-[9px]">{hist.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal Dialog Overlay */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/30 p-4 font-sans backdrop-blur-xs select-none">
            {/* Backdrop click dismiss */}
            <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />

            {/* Modal Dialog Form */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-surface border-border-base relative z-10 w-full max-w-md space-y-5 rounded-3xl border p-6 text-left shadow-2xl sm:p-8"
            >
              <div className="border-border-light flex items-center justify-between border-b pb-3">
                <span className="text-primary-600 text-xs font-bold tracking-widest uppercase">
                  Edit Profile Information
                </span>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-text-muted hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-1.5"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-left font-sans">
                <div className="space-y-1">
                  <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                    Short Bio
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="border-border-light flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app cursor-pointer rounded-lg border px-4 py-2 text-[10px] font-bold tracking-wider uppercase"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    size="sm"
                    className="py-2 text-[10px] font-bold tracking-wider uppercase"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
