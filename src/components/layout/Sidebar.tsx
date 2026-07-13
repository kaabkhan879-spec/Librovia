import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import {
  BookOpen,
  LayoutDashboard,
  Library,
  UploadCloud,
  Heart,
  Tags,
  User,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
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
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'My Library', to: ROUTES.LIBRARY, icon: Library },
    { name: 'Upload Book', to: ROUTES.UPLOAD, icon: UploadCloud },
    { name: 'Favorites', to: ROUTES.FAVORITES, icon: Heart },
    { name: 'Categories', to: ROUTES.CATEGORIES, icon: Tags },
  ]

  const secondaryNavigation = [
    { name: 'Profile', to: ROUTES.PROFILE, icon: User },
    { name: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
  ]

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LANDING)
  }

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    md:static md:translate-x-0
  `

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 overflow-hidden">
            <div className="bg-brand-600 shadow-brand-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="truncate font-sans text-lg font-bold tracking-tight text-slate-900">
                Librovia
              </span>
            )}
          </Link>

          {/* Close button on Mobile */}
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 shadow-brand-500/5 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } `
              }
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}

          <div className="my-4 border-t border-slate-100" />

          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 shadow-brand-500/5 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } `
              }
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Collapse Toggle & Logout */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className={`h-5 w-5 shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse/Expand Toggle on Desktop */}
          <button
            onClick={onToggleCollapse}
            className="mt-2 hidden w-full cursor-pointer items-center justify-center rounded-lg py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 md:flex"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
