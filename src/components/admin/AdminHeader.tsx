import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { notificationsService, type Notification } from '../../services/notifications'
import { supabase } from '../../services/supabase'
import { ROUTES } from '../../constants/routes'
import {
  Menu,
  ShieldCheck,
  BookMarked,
  Search,
  User as UserIcon,
  Bell,
  Sun,
  Moon,
  Monitor,
  Check,
  Trash2,
  UploadCloud,
  MessageSquare,
  FolderOpen,
  Award,
  Flame,
  HardDrive,
} from 'lucide-react'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  pageTitle: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { user } = useAuth()
  const { themeMode, setThemeMode } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAllNotifs, setShowAllNotifs] = useState(false)

  const themeMenuRef = useRef<HTMLDivElement>(null)
  const notifDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount and subscribe to realtime updates
  useEffect(() => {
    let active = true

    const loadNotifications = async () => {
      try {
        const data = await notificationsService.getNotifications()
        if (active) {
          setNotifications(data)
        }
      } catch (err) {
        console.error('Failed to fetch notifications in admin header:', err)
      }
    }

    loadNotifications()

    // Realtime channel listener
    const channel = supabase
      .channel('admin-header-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setThemeMenuOpen(false)
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const displayedNotifs = showAllNotifs ? notifications : notifications.slice(0, 5)

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (err) {
      console.error(err)
    }
  }

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

  const getNotifMeta = (type: Notification['type']) => {
    switch (type) {
      case 'upload':
        return { icon: UploadCloud, color: 'text-emerald-500 bg-emerald-950/20' }
      case 'delete':
        return { icon: Trash2, color: 'text-rose-500 bg-rose-950/20' }
      case 'note':
        return { icon: MessageSquare, color: 'text-blue-500 bg-blue-950/20' }
      case 'collection':
        return { icon: FolderOpen, color: 'text-indigo-500 bg-indigo-950/20' }
      case 'goal':
        return { icon: Award, color: 'text-amber-500 bg-amber-955/20' }
      case 'streak':
        return { icon: Flame, color: 'text-orange-500 bg-orange-950/20' }
      case 'storage':
        return { icon: HardDrive, color: 'text-red-500 bg-red-950/20' }
      default:
        return { icon: Bell, color: 'text-purple-500 bg-purple-955/20' }
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

  return (
    <header className="border-admin-border bg-admin-sidebar/75 sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="border-admin-border bg-admin-card text-admin-text-sub hover:bg-admin-hover flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-admin-text-main font-sans text-base font-black sm:text-lg">
            {pageTitle}
          </h1>
          <span className="hidden items-center gap-1 rounded-full border border-purple-500/20 bg-purple-900/10 px-2.5 py-0.5 text-[10px] font-black text-purple-600 sm:inline-flex dark:bg-purple-900/40 dark:text-purple-300">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Admin Search */}
        <div className="relative hidden md:block">
          <Search className="text-admin-text-muted absolute top-2.5 left-3 h-3.5 w-3.5" />
          <input
            type="text"
            placeholder="Search users, books, plans..."
            className="border-admin-border bg-admin-card text-admin-text-main placeholder-admin-text-muted w-64 rounded-xl border py-2 pr-4 pl-9 text-xs font-semibold transition-all focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Realtime Status Indicator */}
        <div className="border-admin-border bg-admin-card text-admin-text-sub hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10.5px] font-bold lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>Live Realtime</span>
        </div>

        {/* Dynamic Appearance switcher (Light / Dark / System Dropdown) */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="border-admin-border bg-admin-card text-admin-text-sub hover:bg-admin-hover flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95"
            title="Switch Appearance Theme"
          >
            {themeMode === 'light' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : themeMode === 'dark' ? (
              <Moon className="h-4.5 w-4.5 text-indigo-400" />
            ) : (
              <Monitor className="h-4.5 w-4.5 text-purple-400" />
            )}
          </button>

          {themeMenuOpen && (
            <div className="border-admin-border bg-admin-card absolute right-0 mt-2 w-36 rounded-2xl border p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setThemeMode('light')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-extrabold transition-colors ${
                  themeMode === 'light'
                    ? 'bg-purple-900/10 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-admin-text-sub hover:bg-admin-hover'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeMode('dark')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-extrabold transition-colors ${
                  themeMode === 'dark'
                    ? 'bg-purple-900/10 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-admin-text-sub hover:bg-admin-hover'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeMode('system')
                  setThemeMenuOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-extrabold transition-colors ${
                  themeMode === 'system'
                    ? 'bg-purple-900/10 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-admin-text-sub hover:bg-admin-hover'
                }`}
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown Selector */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="border-admin-border bg-admin-card text-admin-text-sub hover:bg-admin-hover relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95"
            title="Notifications Panel"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="ring-admin-sidebar absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-purple-600 font-sans text-[9px] font-black text-white ring-2">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="border-admin-border bg-admin-card absolute right-0 z-50 mt-2.5 w-80 rounded-3xl border p-4 text-left font-sans shadow-2xl">
              <div className="border-admin-border flex items-center justify-between border-b pb-2.5">
                <div>
                  <h4 className="text-admin-text-main text-xs font-black">Notifications</h4>
                  <span className="text-admin-text-muted text-[9px] font-bold">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-purple-600 hover:bg-purple-900/10 dark:text-purple-400"
                      title="Mark all as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-admin-text-muted flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-rose-900/10 hover:text-rose-500"
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
                  <div className="text-admin-text-muted flex flex-col items-center justify-center space-y-2 py-10 text-center">
                    <Bell className="text-admin-text-muted/65 h-8 w-8" />
                    <p className="text-admin-text-main text-[10px] font-black">Nothing here yet</p>
                    <p className="text-admin-text-muted max-w-[180px] text-[8.5px] leading-relaxed">
                      We will notify you about uploads, notes, goals, and reader milestones here.
                    </p>
                  </div>
                ) : (
                  displayedNotifs.map((notif) => {
                    const meta = getNotifMeta(notif.type)
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`hover:bg-admin-hover relative flex cursor-pointer items-start gap-3 rounded-2xl p-2.5 transition-all ${
                          !notif.isRead ? 'bg-purple-900/5' : ''
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.color}`}
                        >
                          <meta.icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-admin-text-main text-xs leading-tight font-bold">
                            {notif.title}
                          </p>
                          <p className="text-admin-text-sub text-[10px] leading-normal">
                            {notif.description}
                          </p>
                          <span className="text-admin-text-muted block pt-0.5 font-mono text-[8px]">
                            {getRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="bg-purple-650 absolute top-4.5 right-3 h-1.5 w-1.5 rounded-full" />
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
                  className="border-admin-border block w-full border-t pt-2 text-center text-[10px] font-bold text-purple-600 transition-all hover:underline dark:text-purple-400"
                >
                  {showAllNotifs ? 'Show Less' : 'View All Notifications'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Switch to Reader Mode Quick Action */}
        <Link to={ROUTES.DASHBOARD}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-900/30 bg-purple-900/10 px-3.5 py-2 text-xs font-extrabold text-purple-600 transition-all hover:bg-purple-900/20 active:scale-95 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <BookMarked className="h-4 w-4" />
            <span className="hidden sm:inline">Reader Mode</span>
          </button>
        </Link>

        {/* User profile */}
        <div className="border-admin-border bg-admin-card flex items-center gap-2 rounded-xl border p-1 pr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-xs font-extrabold text-white shadow-md">
            {user?.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div className="hidden max-w-[80px] text-left text-xs md:block">
            <span className="text-admin-text-main block truncate font-bold">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
export default AdminHeader
