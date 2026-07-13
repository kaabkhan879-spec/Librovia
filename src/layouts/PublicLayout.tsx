import React from 'react'
import { Outlet } from 'react-router-dom'
import { MarketingNavbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'

export const PublicLayout: React.FC = () => {
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
