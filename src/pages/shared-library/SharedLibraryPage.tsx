import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { sharesService } from '../../services/shares'
import { ROUTES } from '../../constants/routes'
import {
  Users,
  Send,
  Download,
  Trash2,
  Play,
  Clock,
  User,
  ShieldCheck,
  Crown,
  X,
} from 'lucide-react'

interface SharedBook {
  id: string
  book_id: string
  owner_id: string
  recipient_id: string
  recipient_email: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  book_title: string
  book_cover?: string
  book_author?: string
  owner_email?: string
}

interface SharedUser {
  id: string
  recipient_id: string
  name: string
  email: string
  plan_id: string
  status: string
  joined_date: string
}

export const SharedLibraryPage: React.FC = () => {
  const { user } = useAuth()
  const { currentPlanId } = useSubscription()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'shared-by-me' | 'shared-with-me'>('shared-by-me')
  const [loading, setLoading] = useState(true)
  const [sharedByMe, setSharedByMe] = useState<SharedBook[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedBook[]>([])

  // Manage Access Modal States
  const [selectedBook, setSelectedBook] = useState<{ id: string; title: string } | null>(null)
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Load shared list
  const loadSharedBooks = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const byMe = await sharesService.getSharedByMe()
      const withMe = await sharesService.getSharedWithMe()
      setSharedByMe(byMe)
      setSharedWithMe(withMe)
    } catch (err) {
      console.error(err)
      showError('Failed to load shared library books.')
    } finally {
      setLoading(false)
    }
  }, [user, showError])

  useEffect(() => {
    if (currentPlanId === 'free') {
      showError('Shared Library is a premium feature. Upgrade your subscription to gain access.')
      navigate(ROUTES.DASHBOARD)
      return
    }
    Promise.resolve().then(() => {
      loadSharedBooks()
    })
  }, [currentPlanId, navigate, loadSharedBooks, showError])

  // Open manage users modal
  const handleOpenManageAccess = async (bookId: string, bookTitle: string) => {
    setSelectedBook({ id: bookId, title: bookTitle })
    try {
      setLoadingUsers(true)
      const usersList = await sharesService.getBookSharedUsers(bookId)
      setSharedUsers(usersList)
    } catch (err) {
      console.error(err)
      showError('Failed to fetch shared users.')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Revoke share access
  const handleRevokeAccess = async (shareId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to revoke share access for this user?')) return
    try {
      await sharesService.removeShare(shareId, user.id)
      showInfo('Access revoked successfully.')
      // Refresh modal user list
      if (selectedBook) {
        const updatedUsers = await sharesService.getBookSharedUsers(selectedBook.id)
        setSharedUsers(updatedUsers)
      }
      // Refresh dashboard list
      loadSharedBooks()
    } catch (err) {
      console.error(err)
      showError('Failed to revoke access.')
    }
  }

  // Remove shared book (declined / remove from library by recipient)
  const handleRemoveFromLibrary = async (shareId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to remove this shared book from your library?')) return
    try {
      await sharesService.removeShare(shareId, user.id)
      showSuccess('Book removed from library cabinet.')
      loadSharedBooks()
    } catch (err) {
      console.error(err)
      showError('Failed to remove shared book.')
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=350&q=80'
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="space-y-8 pb-20 text-left select-none">
        {/* Banner header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 font-sans text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Shared Library
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              Share your digital books with colleagues, friends, or family. Only for PRO and Family
              plans.
            </p>
          </div>
        </div>

        {/* Tab Toggle selectors */}
        <div className="flex max-w-xs rounded-2xl border border-slate-100 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('shared-by-me')}
            className={`flex-1 cursor-pointer rounded-xl py-2 text-center text-xs font-bold transition-all ${
              activeTab === 'shared-by-me'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
            }`}
          >
            📤 Shared By Me
          </button>
          <button
            onClick={() => setActiveTab('shared-with-me')}
            className={`flex-1 cursor-pointer rounded-xl py-2 text-center text-xs font-bold transition-all ${
              activeTab === 'shared-with-me'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
            }`}
          >
            📥 Shared With Me
          </button>
        </div>

        {/* Main Tab Render Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'shared-by-me' ? (
            <motion.div
              key="shared-by-me-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {sharedByMe.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                    <Send className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No books shared yet
                  </h3>
                  <p className="max-w-xs text-xs text-slate-400">
                    Navigate to any book's details page and click the "Share Book" button to invite
                    other premium users.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedByMe.map((share) => (
                    <div
                      key={share.id}
                      className="group dark:border-slate-850 flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-2xs hover:border-purple-500/10 dark:bg-slate-900"
                    >
                      {/* Cover Thumbnail */}
                      <Link
                        to={ROUTES.BOOK_DETAILS.replace(':id', share.book_id)}
                        className="aspect-[0.7/1] w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 shadow-xs dark:border-slate-800"
                      >
                        <img
                          src={
                            share.book_cover ||
                            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={share.book_title}
                          onError={handleImageError}
                          className="h-full w-full object-cover transition-transform group-hover:scale-103"
                        />
                      </Link>

                      {/* Info details */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                            {share.book_title}
                          </h4>
                          <p className="truncate text-[10px] font-bold text-slate-400">
                            Shared with:{' '}
                            <span className="text-purple-500">{share.recipient_email}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[8.5px] font-black tracking-wider uppercase ${
                                share.status === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : share.status === 'declined'
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                              }`}
                            >
                              {share.status}
                            </span>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex gap-1.5 pt-2">
                          <button
                            onClick={() => handleOpenManageAccess(share.book_id, share.book_title)}
                            className="cursor-pointer rounded-xl bg-purple-50 px-3 py-1.5 text-[10px] font-bold tracking-wider text-purple-700 uppercase transition-colors hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300"
                          >
                            Manage Access
                          </button>
                          <button
                            onClick={() => handleRevokeAccess(share.id)}
                            className="cursor-pointer rounded-xl bg-red-50 p-1.5 text-red-600 hover:bg-red-100/50 dark:bg-red-950/20 dark:text-red-400"
                            title="Revoke Access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="shared-with-me-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {sharedWithMe.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                    <Download className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No received books
                  </h3>
                  <p className="max-w-xs text-xs text-slate-400">
                    Shared books from other premium users will automatically populate here after you
                    accept their library invites.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedWithMe.map((share) => (
                    <div
                      key={share.id}
                      className="group dark:border-slate-850 flex gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-2xs hover:border-purple-500/10 dark:bg-slate-900"
                    >
                      {/* Cover Thumbnail */}
                      <Link
                        to={ROUTES.BOOK_DETAILS.replace(':id', share.book_id)}
                        className="aspect-[0.7/1] w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 shadow-xs dark:border-slate-800"
                      >
                        <img
                          src={
                            share.book_cover ||
                            'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={share.book_title}
                          onError={handleImageError}
                          className="h-full w-full object-cover transition-transform group-hover:scale-103"
                        />
                      </Link>

                      {/* Info details */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                            {share.book_title}
                          </h4>
                          <p className="truncate text-[10px] font-bold text-slate-400">
                            Shared by: <span className="text-purple-500">{share.owner_email}</span>
                          </p>
                          <p className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(share.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions block */}
                        <div className="flex gap-1.5 pt-2">
                          <Link to={ROUTES.READER.replace(':id', share.book_id)} className="flex-1">
                            <button className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-[10px] font-black text-white transition-colors hover:bg-purple-700">
                              <Play className="h-3 w-3 fill-white" />
                              <span>Read</span>
                            </button>
                          </Link>
                          <button
                            onClick={() => handleRemoveFromLibrary(share.id)}
                            className="cursor-pointer rounded-xl bg-red-50 p-1.5 text-red-600 hover:bg-red-100/50 dark:bg-red-950/20 dark:text-red-400"
                            title="Remove from Library"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MANAGE ACCESS MODAL */}
        <AnimatePresence>
          {selectedBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBook(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Shared Users
                    </h3>
                    <p className="text-[10.5px] font-semibold text-purple-600">
                      {selectedBook.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Users List */}
                <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    </div>
                  ) : sharedUsers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      No active shares for this book.
                    </p>
                  ) : (
                    sharedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-3.5 dark:border-slate-800/40 dark:bg-slate-800/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                            <User className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-0.5 text-left">
                            <p className="flex items-center gap-1 text-xs font-extrabold text-slate-900 dark:text-white">
                              <span>{u.name}</span>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">{u.email}</p>
                            <span className="py-0.2 inline-flex items-center gap-1 rounded bg-purple-50 px-1 text-[8px] font-black text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                              <Crown className="h-2.5 w-2.5" />
                              {u.plan_id.toUpperCase()} MEMBER
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeAccess(u.id)}
                          className="cursor-pointer rounded-xl bg-rose-50 px-2.5 py-1 text-[9px] font-bold tracking-wider text-rose-600 uppercase hover:bg-rose-100"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
export default SharedLibraryPage
