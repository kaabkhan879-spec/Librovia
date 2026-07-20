import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { Menu, ShieldCheck, BookMarked, Search, User as UserIcon } from 'lucide-react'

interface AdminHeaderProps {
  onToggleSidebar: () => void
  pageTitle: string
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, pageTitle }) => {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 md:hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="font-sans text-lg font-black text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Admin Search */}
        <button
          type="button"
          onClick={() => {
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
            if (searchInput) searchInput.focus()
          }}
          className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-purple-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search users, books, plans, logs...</span>
          <kbd className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Switch to Reader Mode Quick Action */}
        <Link to={ROUTES.DASHBOARD}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-extrabold text-purple-700 transition-all hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300 active:scale-98"
          >
            <BookMarked className="h-4 w-4" />
            <span className="hidden sm:inline">Switch to Reader Mode</span>
          </button>
        </Link>

        {/* User badge */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-xs">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>
          <div className="hidden md:block text-left text-xs">
            <span className="block font-bold text-slate-900 truncate max-w-[120px] dark:text-white">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
            <span className="block text-[9.5px] font-semibold text-slate-400">super_admin</span>
          </div>
        </div>
      </div>
    </header>
  )
}
