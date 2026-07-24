import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MarketingNavbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export const PublicLayout: React.FC = () => {
  const location = useLocation()

  // Define paths that correspond to self-contained auth layouts
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  )

  if (isAuthRoute) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
