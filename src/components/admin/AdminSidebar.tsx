import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  CreditCard,
  HardDrive,
  BookOpen,
  LineChart,
  Megaphone,
  Settings,
  ClipboardList,
  ShieldCheck,
  BookMarked,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

interface AdminSidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [isDark, setIsDark] = React.useState(() => {
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

  const adminNavigation = [
    { name: 'Dashboard', to: ROUTES.ADMIN, icon: LayoutDashboard },
    { name: 'Users', to: ROUTES.ADMIN_USERS, icon: Users },
    { name: 'Subscription Plans', to: ROUTES.ADMIN_SUBSCRIPTIONS, icon: PackageCheck },
    { name: 'Payments', to: ROUTES.ADMIN_PAYMENTS, icon: CreditCard },
    { name: 'Storage Manager', to: ROUTES.ADMIN_STORAGE, icon: HardDrive },
    { name: 'Library Management', to: ROUTES.ADMIN_LIBRARY, icon: BookOpen },
    { name: 'Reports & Analytics', to: ROUTES.ADMIN_REPORTS, icon: LineChart },
    { name: 'Announcements', to: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
    { name: 'System Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings },
    { name: 'Audit Logs', to: ROUTES.ADMIN_AUDIT_LOGS, icon: ClipboardList },
  ]

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    md:static md:translate-x-0
  `

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800">
          <Link to={ROUTES.ADMIN} className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate text-left">
                <span className="block font-sans text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Librovia Admin
                </span>
                <span className="block text-[10px] font-extrabold tracking-widest text-purple-600 uppercase dark:text-purple-400">
                  Super Admin SaaS
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* 10 Super Admin Modules Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            {!isCollapsed && 'Platform Management'}
          </div>

          {adminNavigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === ROUTES.ADMIN}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-extrabold transition-all duration-200 select-none
                  ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            )
          })}
        </div>

        {/* Footer Actions & Mode Switcher */}
        <div className="border-t border-slate-200/80 p-3 space-y-2 dark:border-slate-800">
          {/* Mode Switcher Button */}
          <Link to={ROUTES.DASHBOARD}>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50/70 py-2.5 text-xs font-black text-purple-700 hover:bg-purple-100 transition-all dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300"
            >
              <BookMarked className="h-4 w-4" />
              {!isCollapsed && <span>Switch to Reader Mode</span>}
            </button>
          </Link>

          {/* Enterprise System Info & Badges */}
          {!isCollapsed && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-center text-[10px] space-y-1 dark:border-slate-800/60 dark:bg-slate-800/30">
              <div className="flex items-center justify-between font-bold text-slate-500 dark:text-slate-400">
                <span>Platform Version:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-extrabold">v2.4.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  PROD
                </span>
                <span className="text-[9.5px] font-semibold text-slate-400">
                  Supabase • Vercel • Edge
                </span>
              </div>
            </div>
          )}

          {/* Theme Toggle & User Logout */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {!isCollapsed && (
              <div className="truncate text-left text-[11px] font-semibold text-slate-500">
                <span className="block truncate font-bold text-slate-800 dark:text-slate-200">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <span className="block text-[10px] text-purple-600 dark:text-purple-400">Super Admin</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
