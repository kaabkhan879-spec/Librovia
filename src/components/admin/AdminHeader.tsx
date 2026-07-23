import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
} from 'lucide-react'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  pageTitle: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { user } = useAuth()
  const [isDark, setIsDark] = useState(() => {
    return window.document.documentElement.classList.contains('dark')
  })

  const toggleTheme = () => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.remove('dark')
      setIsDark(false)
    } else {
      root.classList.add('dark')
      setIsDark(true)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#334155] bg-[#111827]/75 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B] text-[#CBD5E1] transition-all hover:bg-[#273549] active:scale-95 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-sans text-base font-black text-[#FFFFFF] sm:text-lg">{pageTitle}</h1>
          <span className="hidden items-center gap-1 rounded-full border border-purple-500/30 bg-purple-900/40 px-2.5 py-0.5 text-[10px] font-black text-purple-300 sm:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Admin Search */}
        <div className="relative hidden md:block">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search users, books, plans..."
            className="w-64 rounded-xl border border-[#334155] bg-[#1E293B] py-2 pr-4 pl-9 text-xs font-semibold text-[#FFFFFF] placeholder-[#94A3B8] transition-all focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Realtime Status Indicator */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-[#334155] bg-[#1E293B] px-3 py-1.5 text-[10.5px] font-bold text-[#CBD5E1] lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>Live Realtime</span>
        </div>

        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B] text-[#CBD5E1] transition-all hover:bg-[#273549] active:scale-95"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B] text-[#CBD5E1] transition-all hover:bg-[#273549] active:scale-95"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-purple-500" />
        </button>

        {/* Switch to Reader Mode Quick Action */}
        <Link to={ROUTES.DASHBOARD}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-900/50 bg-purple-950/40 px-3.5 py-2 text-xs font-extrabold text-purple-300 transition-all hover:bg-purple-900/40 active:scale-95"
          >
            <BookMarked className="h-4 w-4" />
            <span className="hidden sm:inline">Reader Mode</span>
          </button>
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1E293B] p-1 pr-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-xs font-extrabold text-white shadow-md">
            {user?.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div className="hidden max-w-[80px] text-left text-xs md:block">
            <span className="block truncate font-bold text-[#FFFFFF]">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
