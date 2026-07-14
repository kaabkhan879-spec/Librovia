import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { notificationsService, type Notification } from '../../services/notifications'
import {
  BookOpen,
  Menu,
  Bell,
  Search,
  UploadCloud,
  Trash2,
  Check,
  Flame,
  HardDrive,
  Award,
  MessageSquare,
  FolderOpen,
} from 'lucide-react'
import { Button } from '../common/Button'

// --- MARKETING NAVBAR (For Public Layout) ---
export const MarketingNavbar: React.FC = () => {
  return (
    <header className="border-border-base/50 bg-bg-surface/75 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.LANDING} className="flex items-center gap-2">
          <div className="bg-primary-600 shadow-primary-500/20 flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <span className="text-text-main font-sans text-lg font-bold tracking-tight">
            Librovia
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#home"
            className="hover-underline hover:text-primary-600 text-text-sub text-xs font-bold tracking-wider uppercase"
          >
            Home
          </a>
          <a
            href="#features"
            className="hover-underline hover:text-primary-600 text-text-sub text-xs font-bold tracking-wider uppercase"
          >
            Features
          </a>
          <a
            href="#about"
            className="hover-underline hover:text-primary-600 text-text-sub text-xs font-bold tracking-wider uppercase"
          >
            About
          </a>
          <a
            href="#faq"
            className="hover-underline hover:text-primary-600 text-text-sub text-xs font-bold tracking-wider uppercase"
          >
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.LOGIN}
            className="hover:text-primary-600 text-text-sub flex items-center gap-1.5 px-3 py-2 font-sans text-xs font-bold tracking-wider uppercase"
          >
            Sign In
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// --- DASHBOARD HEADER (For App Layout) ---
interface DashboardHeaderProps {
  onToggleSidebar: () => void
  pageTitle?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleSidebar,
  pageTitle = 'Dashboard',
}) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAllNotifs, setShowAllNotifs] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications from service inside effect to avoid cascading state warnings
  useEffect(() => {
    let active = true

    notificationsService
      .getNotifications()
      .then((data) => {
        if (active) {
          setNotifications(data)
        }
      })
      .catch((err) => console.error('Failed to query notifications:', err))

    // Poll notifications every 8 seconds
    const interval = setInterval(() => {
      notificationsService
        .getNotifications()
        .then((data) => {
          if (active) {
            setNotifications(data)
          }
        })
        .catch((err) => console.error(err))
    }, 8000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAll = async () => {
    try {
      await notificationsService.clearAll()
      setNotifications([])
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (err) {
      console.error(err)
    }
  }

  const getNotifMeta = (type: Notification['type']) => {
    switch (type) {
      case 'upload':
        return { icon: UploadCloud, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' }
      case 'delete':
        return { icon: Trash2, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' }
      case 'note':
        return { icon: MessageSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' }
      case 'collection':
        return { icon: FolderOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' }
      case 'goal':
        return { icon: Award, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' }
      case 'streak':
        return { icon: Flame, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' }
      case 'storage':
        return { icon: HardDrive, color: 'text-red-600 bg-red-50 dark:bg-red-950/20' }
      default:
        return { icon: Bell, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' }
    }
  }

  const getRelativeTime = (isoString: string) => {
    const now = new Date()
    const past = new Date(isoString)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return past.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const displayedNotifs = showAllNotifs ? notifications : notifications.slice(0, 5)

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="border-border-base bg-bg-surface/85 sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left side: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-text-sub hover:bg-bg-app hover:text-text-main cursor-pointer rounded-lg p-2 md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden flex-col text-left sm:flex">
          <nav className="text-text-muted flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
            <span>Librovia</span>
            <span className="text-[8px] font-normal opacity-50">/</span>
            <span>Console</span>
            <span className="text-[8px] font-normal opacity-50">/</span>
            <span className="text-primary-600">{pageTitle}</span>
          </nav>
          <span className="text-text-muted mt-0.5 font-mono text-[10px] font-semibold">
            {today}
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="mx-4 hidden max-w-md flex-1 md:block">
        <div className="relative rounded-lg shadow-sm">
          <div className="text-text-muted pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Quick search books, collections, reviews..."
            className="border-border-base bg-bg-app text-text-main placeholder:text-text-muted focus:border-primary-500 focus:ring-primary-500/10 block w-full rounded-lg border py-1.5 pr-4 pl-9 text-xs transition-all focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side Actions */}
      <div className="flex items-center gap-4">
        {/* Upload book button */}
        <Link to={ROUTES.UPLOAD}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<UploadCloud className="h-4 w-4" />}
            className="hidden sm:flex"
          >
            Upload
          </Button>
        </Link>

        {/* Notifications Bell with Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app hover:text-text-main relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="bg-primary-600 ring-bg-surface absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full font-sans text-[8px] font-black text-white ring-2">
                {unreadCount}
              </span>
            )}
          </button>

          {/* DROPDOWN MENU */}
          {showDropdown && (
            <div className="border-border-base bg-bg-surface absolute right-0 z-50 mt-3.5 w-80 rounded-3xl border p-4 text-left font-sans shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Notifications
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-primary-600 hover:text-primary-700 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20"
                      title="Mark all as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="dark:hover:bg-slate-855 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-500"
                      title="Clear all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="max-h-80 space-y-2 overflow-y-auto py-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <Bell className="mb-2 h-7 w-7 text-slate-300" />
                    <p className="text-[10px] font-bold">Nothing here yet</p>
                    <p className="max-w-[160px] text-[8px] leading-relaxed text-slate-400">
                      We will notify you about uploads, notes, goals and history here.
                    </p>
                  </div>
                ) : (
                  displayedNotifs.map((notif) => {
                    const meta = getNotifMeta(notif.type)
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`relative flex cursor-pointer items-start gap-3 rounded-2xl p-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          !notif.isRead ? 'bg-purple-50/20 dark:bg-purple-950/5' : ''
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                        >
                          <meta.icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs leading-tight font-bold text-slate-900 dark:text-white">
                            {notif.title}
                          </p>
                          <p className="text-[10px] leading-normal text-slate-500 dark:text-slate-400">
                            {notif.description}
                          </p>
                          <span className="block pt-0.5 font-mono text-[8px] text-slate-400">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="bg-primary-650 absolute top-4.5 right-3 h-1.5 w-1.5 rounded-full" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* View all / toggle panel */}
              {notifications.length > 5 && (
                <button
                  onClick={() => setShowAllNotifs(!showAllNotifs)}
                  className="text-primary-600 hover:text-primary-700 block w-full border-t border-slate-50 pt-2 text-center text-[10px] font-bold transition-all"
                >
                  {showAllNotifs ? 'Show Less' : 'View All Notifications'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar trigger */}
        {user && (
          <Link to={ROUTES.PROFILE} className="flex items-center">
            <img
              src={
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'
              }
              alt={user.displayName || 'Profile'}
              className="ring-border-base hover:ring-primary-500 h-8.5 w-8.5 rounded-full object-cover shadow-sm ring-1 transition-shadow"
            />
          </Link>
        )}
      </div>
    </header>
  )
}
