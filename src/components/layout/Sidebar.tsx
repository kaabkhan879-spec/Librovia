import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '../common/Avatar'
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Folder,
  MessageSquare,
  BarChart3,
  Cloud,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Layers,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Track dark theme state locally to update UI toggle icon
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

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LANDING)
  }

  const navigation = [
    { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'My Library', to: ROUTES.LIBRARY, icon: Library },
    { name: 'Collections', to: ROUTES.COLLECTIONS, icon: Folder },
    { name: 'Notes', to: ROUTES.NOTES, icon: MessageSquare },
    { name: 'AI Flashcards', to: ROUTES.FLASHCARDS, icon: Layers },
    { name: 'Analytics', to: ROUTES.ANALYTICS, icon: BarChart3 },
    { name: 'Storage', to: ROUTES.STORAGE, icon: Cloud },
    { name: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
  ]

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-base bg-bg-surface transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    md:static md:translate-x-0
  `

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="border-border-base flex h-16 items-center justify-between border-b px-4">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-primary-600 shadow-primary-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="text-text-main truncate font-sans text-base font-bold tracking-tight">
                Librovia
              </span>
            )}
          </Link>

          {/* Close button on Mobile */}
          <button
            onClick={onClose}
            className="text-text-sub hover:bg-bg-app cursor-pointer rounded-lg p-1.5 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 text-left">
          {navigation.map((item) => {
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  `group text-text-sub hover:bg-bg-app hover:text-text-main relative flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                      : ''
                  } `
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {/* Visual indicator bar on hover/active */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="bg-primary-600 absolute top-3 bottom-3 left-0 w-1 rounded-r-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom User Card, Theme Toggle, & Logout */}
        <div className="border-border-base space-y-2 border-t p-3.5">
          {/* User profile details (hidden if collapsed) */}
          {!isCollapsed && user && (
            <div className="bg-bg-app border-border-light flex items-center gap-3 rounded-xl border p-2 text-left">
              <Avatar src={user.avatarUrl} name={user.displayName} email={user.email} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-text-main truncate text-xs font-bold">
                  {user.displayName || 'Kaab Khan'}
                </p>
                <p className="text-text-muted mt-0.5 truncate text-[10px]">{user.email}</p>
              </div>
            </div>
          )}

          {/* Action row (Theme toggle and sign out) */}
          <div
            className={`flex gap-1.5 ${isCollapsed ? 'flex-col items-center' : 'justify-between'}`}
          >
            <button
              onClick={toggleTheme}
              className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app hover:text-text-main flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button
              onClick={handleLogout}
              className={`border-border-base bg-bg-surface text-text-sub flex h-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${isCollapsed ? 'w-9' : 'flex-1 gap-2 text-xs font-bold uppercase'} `}
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* Collapse/Expand Toggle on Desktop */}
          <button
            onClick={onToggleCollapse}
            className="text-text-muted hover:bg-bg-app hover:text-text-main border-border-light bg-bg-app/40 hidden w-full cursor-pointer items-center justify-center rounded-lg border py-1.5 md:flex"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
