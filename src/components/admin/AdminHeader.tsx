import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
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
} from 'lucide-react'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  pageTitle: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { user } = useAuth()
  const { themeMode, setThemeMode } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
        <div className="relative" ref={menuRef}>
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

        {/* Notifications Button */}
        <button
          type="button"
          className="border-admin-border bg-admin-card text-admin-text-sub hover:bg-admin-hover relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all active:scale-95"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-purple-500" />
        </button>

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
