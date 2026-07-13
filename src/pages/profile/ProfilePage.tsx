import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  ShieldAlert,
  CheckCircle,
  Award,
  Flame,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Bell,
  Edit,
  Activity,
  Sparkles,
  Info,
  Compass,
  ChevronRight,
  BookMarked,
  X,
  Layers,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

export const ProfilePage: React.FC = () => {
  // Demo interactive states
  const [isEmptyState, setIsEmptyState] = useState(false)
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Local profile states (High-fidelity updates!)
  const [profileName, setProfileName] = useState('Kaab Khan')
  const [profileUsername, setProfileUsername] = useState('kaabkhan')
  const [profileBio, setProfileBio] = useState(
    'Avid reader, tech enthusiast, and collector of rare digital books. Compounding knowledge 1% every day.'
  )
  const [profileEmail, setProfileEmail] = useState('kaab@librovia.com')

  // Edit fields temp storage
  const [editName, setEditName] = useState(profileName)
  const [editUsername, setEditUsername] = useState(profileUsername)
  const [editBio, setEditBio] = useState(profileBio)
  const [editEmail, setEditEmail] = useState(profileEmail)

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileName(editName)
    setProfileUsername(editUsername)
    setProfileBio(editBio)
    setProfileEmail(editEmail)
    setShowEditModal(false)
  }

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // Realistic mock data
  const stats = [
    { title: 'Total Books Read', value: '12', icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Currently Reading', value: '2', icon: BookMarked, color: 'text-cyan-500' },
    { title: 'Pages Read', value: '3,450', icon: BookOpen, color: 'text-indigo-500' },
    { title: 'Reading Hours', value: '24.5h', icon: Clock, color: 'text-amber-500' },
    { title: 'Reading Streak', value: '7 days', icon: Flame, color: 'text-red-500' },
  ]

  const achievements = [
    {
      title: 'First Book Completed',
      desc: 'Read a full book cover-to-cover.',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100',
      progress: 100,
    },
    {
      title: '7 Day Reading Streak',
      desc: 'Read at least 15 mins daily for a week.',
      icon: Flame,
      color: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-100',
      progress: 100,
    },
    {
      title: 'Book Explorer',
      desc: 'Upload and start 5 books.',
      icon: Compass,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100',
      progress: 80,
    },
    {
      title: 'Knowledge Seeker',
      desc: 'Log 50 reading hours.',
      icon: Award,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-100',
      progress: 49,
    },
  ]

  const categories = [
    { name: 'Business & Finance', percent: 90, count: '6 books' },
    { name: 'Technology & Code', percent: 80, count: '5 books' },
    { name: 'Islamic Books', percent: 60, count: '3 books' },
    { name: 'Fiction / Novels', percent: 40, count: '2 books' },
  ]

  const recentHistory = [
    { book: 'Atomic Habits', activity: 'Read Chapter 4 (Page 134)', time: '2 hours ago' },
    { book: 'Clean Code', activity: 'Logged 85% progress milestone', time: '1 day ago' },
    { book: 'Deep Work', activity: 'Added to Favorites bookshelf', time: '2 days ago' },
  ]

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
      {/* Simulation Bar */}
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
            {isEmptyState ? 'Show Real Profile' : 'Show Empty States'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSkeletonLoading ? (
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
        ) : isEmptyState ? (
          /* Empty reading activity layouts */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border-border-base bg-bg-surface mx-auto max-w-xl space-y-6 rounded-3xl border-2 border-dashed p-12 text-center"
          >
            <div className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-text-main text-lg font-bold">No Profile Activity Recorded</h3>
              <p className="text-text-sub mx-auto max-w-xs text-xs leading-relaxed">
                You haven't read or annotated any books. Start reading to build your profile
                milestones.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Real Profile view */
          <motion.div
            key="profile-canvas"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="animate-fade-in grid grid-cols-1 items-start gap-8 lg:grid-cols-3"
          >
            {/* Left Column: Profile Card & User Info & Settings Shortcut */}
            <div className="space-y-6">
              {/* Profile Card Header */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border p-6 text-center shadow-sm"
              >
                {/* Visual mesh bg */}
                <div className="from-primary-600 absolute inset-x-0 top-0 h-2 bg-gradient-to-r via-indigo-600 to-cyan-500" />

                {/* Premium badge */}
                <span className="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-500/20 mt-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase">
                  <Sparkles className="h-2.5 w-2.5" />
                  Premium Member
                </span>

                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80"
                  alt="Kaab Avatar"
                  className="ring-primary-500 h-20 w-20 rounded-full object-cover shadow-md ring-2 transition-transform hover:scale-105"
                />

                <div>
                  <h3 className="text-text-main font-sans text-base font-extrabold">
                    {profileName}
                  </h3>
                  <p className="text-text-muted mt-0.5 font-mono text-[10px] font-bold">
                    @{profileUsername}
                  </p>
                </div>

                <p className="text-text-sub px-2 font-sans text-xs leading-relaxed">{profileBio}</p>

                <Button
                  onClick={() => {
                    setEditName(profileName)
                    setEditUsername(profileUsername)
                    setEditBio(profileBio)
                    setEditEmail(profileEmail)
                    setShowEditModal(true)
                  }}
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit className="h-3.5 w-3.5" />}
                  className="w-full justify-center py-2 text-[10px] font-bold tracking-wider uppercase"
                >
                  Edit Profile
                </Button>
              </motion.div>

              {/* User Info details */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-4 rounded-3xl border p-5 text-left shadow-sm"
              >
                <h4 className="text-primary-600 border-border-light border-b pb-2 text-[10px] font-extrabold tracking-widest uppercase">
                  Account details
                </h4>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Registered Email
                    </span>
                    <span className="text-text-main block truncate font-bold">{profileEmail}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Member Since
                    </span>
                    <span className="text-text-main block truncate font-bold">
                      October 15, 2025
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px] tracking-wider uppercase">
                      Sync Status
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active / Synced
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Settings Shortcut Card */}
              <motion.div
                variants={itemVariants}
                className="bg-bg-surface border-border-base space-y-3 rounded-3xl border p-5 text-left shadow-sm"
              >
                <h4 className="text-primary-600 border-border-light border-b pb-2 text-[10px] font-extrabold tracking-widest uppercase">
                  Quick Settings
                </h4>

                <div className="space-y-1">
                  {[
                    { label: 'Security & Password', icon: Lock },
                    { label: 'Push Notifications', icon: Bell },
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
                  {categories.map((cat, idx) => (
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal Dialog Overlay */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-xs select-none">
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
