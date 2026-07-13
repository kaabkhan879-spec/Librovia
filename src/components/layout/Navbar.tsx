import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Menu, Bell, Search, UploadCloud } from 'lucide-react'
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
  const { user } = useAuth()

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
            className="hidden animate-pulse hover:animate-none sm:flex"
          >
            Upload
          </Button>
        </Link>

        {/* Notifications Icon Button */}
        <button className="border-border-base bg-bg-surface text-text-sub hover:bg-bg-app hover:text-text-main relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border">
          <Bell className="h-4.5 w-4.5" />
          <span className="bg-primary-600 ring-bg-surface absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2" />
        </button>

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
