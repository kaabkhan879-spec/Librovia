import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { BookOpen } from 'lucide-react'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2">
            <div className="bg-brand-600 shadow-brand-500/10 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-slate-900">
              Librovia
            </span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <a href="#features" className="hover:text-brand-600 text-sm text-slate-500">
              Features
            </a>
            <a href="#pricing" className="hover:text-brand-600 text-sm text-slate-500">
              Pricing
            </a>
            <Link to={ROUTES.LOGIN} className="hover:text-brand-600 text-sm text-slate-500">
              Sign In
            </Link>
          </nav>

          <p className="text-sm text-slate-400">
            &copy; {currentYear} Librovia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
