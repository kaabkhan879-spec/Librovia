import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Menu, User } from 'lucide-react'
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
          <Link
            to={ROUTES.DESIGN_SYSTEM}
            className="hover-underline hover:text-primary-600 text-text-sub text-xs font-bold tracking-wider uppercase"
          >
            UI Showcase
          </Link>
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
  const { user, toggleDemoAuth } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle auth button for easy dev review */}
        <button
          onClick={toggleDemoAuth}
          className="hover:bg-brand-50 hover:text-brand-600 cursor-pointer rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
        >
          Simulate Log Out
        </button>

        {/* User profile dropdown trigger */}
        {user && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <Link to={ROUTES.PROFILE} className="group flex cursor-pointer items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'User Profile'}
                  className="ring-brand-500/10 group-hover:ring-brand-500/30 h-9 w-9 rounded-full object-cover ring-2"
                />
              ) : (
                <div className="bg-brand-100 text-brand-600 ring-brand-500/10 flex h-9 w-9 items-center justify-center rounded-full ring-2">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div className="hidden text-left lg:block">
                <p className="group-hover:text-brand-600 text-sm leading-none font-semibold text-slate-700">
                  {user.displayName || 'Library User'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
