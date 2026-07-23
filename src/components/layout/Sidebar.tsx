import React, { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '../common/Avatar'
import { useSubscription } from '../../context/SubscriptionContext'
import {
  BookOpen,
  Home,
  Library,
  Users,
  Folder,
  MessageSquare,
  BarChart3,
  Crown,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
  const { currentPlanId } = useSubscription()
  const navigate = useNavigate()

  const planBadge = () => {
    switch (currentPlanId) {
      case 'family':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-500 border border-amber-500/20 uppercase tracking-wider">
            👑 Family
          </span>
        )
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-black text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
            ⭐ Pro
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-black text-slate-500 dark:text-slate-400 border border-slate-500/20 uppercase tracking-wider">
            📘 Free
          </span>
        )
    }
  }

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LANDING)
  }

  const navigation = [
    { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: Home },
    { name: 'My Library', to: ROUTES.LIBRARY, icon: Library },
    ...(currentPlanId === 'pro' || currentPlanId === 'family'
      ? [{ name: 'Shared Library', to: ROUTES.SHARED_LIBRARY, icon: Users }]
      : []),
    { name: 'Collections', to: ROUTES.COLLECTIONS, icon: Folder },
    { name: 'Notes', to: ROUTES.NOTES, icon: MessageSquare },
    { name: 'Analytics', to: ROUTES.ANALYTICS, icon: BarChart3 },
    { name: 'Subscription', to: ROUTES.SUBSCRIPTION, icon: Crown },
    ...(user?.role === 'super_admin'
      ? [{ name: 'Return to Admin Panel', to: ROUTES.ADMIN, icon: ShieldCheck }]
      : []),
    { name: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
  ]

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        animate={{
          width: isDesktop ? (isCollapsed ? 72 : 280) : 280,
          x: isDesktop ? 0 : isOpen ? 0 : -280,
        }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="border-border-base bg-bg-surface fixed inset-y-0 left-0 z-50 flex flex-col border-r md:static"
      >
        {/* Brand Header */}
        <div className="border-border-base flex h-16 items-center justify-between border-b px-4">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-primary-600 shadow-primary-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="text-text-main truncate font-sans text-base font-bold tracking-tight"
                >
                  Librovia
                </motion.span>
              )}
            </AnimatePresence>
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
                  `group relative flex cursor-pointer items-center rounded-xl p-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-[200ms] ease-in-out ${
                    isCollapsed ? 'mx-2 justify-center' : 'mx-3 gap-3 px-3.5'
                  } ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                      : 'text-slate-400 hover:bg-primary-600/10 hover:text-primary-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-5 w-5 shrink-0 transition-all duration-[200ms] group-hover:scale-110 ${
                        isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : 'text-slate-500'
                      }`}
                    />

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="pointer-events-none absolute left-14 z-50 rounded-xl border border-slate-700/30 bg-slate-900 px-3 py-1.5 text-[10px] font-bold whitespace-nowrap text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 dark:bg-slate-800">
                        {item.name}
                      </div>
                    )}

                    {/* Active highlight pill */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className="bg-primary-650 absolute top-2.5 bottom-2.5 left-0 w-1.5 rounded-r-full shadow-[0_0_8px_rgba(124,58,237,0.8)]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Profile & Toggle */}
        <div className="border-border-base space-y-4 border-t p-3.5">
          {/* User profile details */}
          {user && (
            <div className="w-full">
              {isCollapsed ? (
                /* Collapsed Profile & Logout */
                <div className="flex flex-col items-center gap-3">
                  <div className="group relative cursor-pointer">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.displayName}
                      email={user.email}
                      className="!h-[52px] !w-[52px] shadow-md shrink-0"
                    />
                    <div className="pointer-events-none absolute top-1/2 left-16 z-50 -translate-y-1/2 rounded-xl border border-slate-700/30 bg-slate-900 px-3.5 py-2 text-[10px] font-bold whitespace-nowrap text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 dark:bg-slate-800">
                      <p>{user.displayName || 'Kaab Khan'}</p>
                      <p className="text-[8px] font-normal text-slate-400 mt-0.5 capitalize">{currentPlanId} Plan</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-400 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 shadow-xs transition-all hover:bg-red-500/25 active:scale-[0.95]"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Expanded Profile Card & Logout button */
                <div className="bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.08] backdrop-blur-md flex flex-col gap-3 rounded-[20px] p-4 text-left shadow-sm hover:shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.displayName}
                      email={user.email}
                      className="!h-[52px] !w-[52px] shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-slate-900 dark:text-white truncate text-xs font-black">
                        {user.displayName || 'Kaab Khan'}
                      </p>
                      <p className="text-slate-550 dark:text-slate-400 truncate text-[10px] font-bold">
                        {user.email}
                      </p>
                      <div className="pt-0.5">
                        {planBadge()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold uppercase text-red-500 dark:text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collapse/Expand Toggle on Desktop/Tablet */}
          <div className={`hidden md:flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <button
              onClick={onToggleCollapse}
              className="text-text-muted hover:bg-bg-app hover:text-text-main border-border-light bg-bg-app/40 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-all"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4.5 w-4.5" />
              ) : (
                <ChevronLeft className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
