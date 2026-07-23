import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { DashboardHeader } from '../components/layout/Navbar'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { UniversalSearchModal } from '../components/search/UniversalSearchModal'

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>(
    'sidebar-collapsed',
    window.innerWidth < 1024 && window.innerWidth >= 768
  )
  const location = useLocation()

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Derive dynamic page titles based on the path
  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/library')) return 'My Library'
    if (pathname.startsWith('/upload')) return 'Upload Book'
    if (pathname.startsWith('/favorites')) return 'Favorites'
    if (pathname.startsWith('/collections')) return 'Collections'
    if (pathname.startsWith('/notes')) return 'Notes'
    if (pathname.startsWith('/analytics')) return 'Analytics'
    if (pathname.startsWith('/storage')) return 'Storage'
    if (pathname.startsWith('/profile')) return 'Profile'
    if (pathname.startsWith('/settings')) return 'Settings'
    if (pathname.startsWith('/books/')) return 'Book Details'
    if (pathname.startsWith('/reader/')) return 'Reading Mode'
    return 'Librovia'
  }

  const isReaderPage = location.pathname.startsWith('/reader/')

  // If we are on the Reader page, render clean distraction-free layout with search modal available
  if (isReaderPage) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-white">
        <Outlet />
        <UniversalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    )
  }

  return (
    <div className="bg-bg-app flex h-screen w-screen overflow-hidden">
      {/* Universal Search Overlay Modal */}
      <UniversalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Sidebar navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main app panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          pageTitle={getPageTitle(location.pathname)}
        />

        {/* Dynamic content outlet */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
