import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { BookOpen, Upload, Shield, Eye, ArrowRight } from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-slate-50">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:4rem_4rem] opacity-35" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8">
        <div className="text-center">
          <div className="bg-brand-50 text-brand-600 ring-brand-500/10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1">
            <span className="bg-brand-500 flex h-1.5 w-1.5 rounded-full" />
            Introducing Librovia v1.0
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.1] font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Your personal digital library,{' '}
            <span className="from-brand-600 bg-gradient-to-r to-indigo-600 bg-clip-text text-transparent">
              secure & private.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
            Upload, organize, and read your personal collection of books from any device. Secure
            storage, automated organization, and clean, beautiful distraction-free reading
            interfaces.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to={ROUTES.REGISTER}
              className="group bg-brand-600 shadow-brand-500/25 hover:bg-brand-700 hover:shadow-brand-500/35 flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-lg"
            >
              Start Your Library Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Visual Mockup Dashboard Card */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-medium text-slate-400 select-none">
                librovia.app/library
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', progress: 42 },
                { title: 'Clean Code', author: 'Robert C. Martin', progress: 85 },
                { title: 'Atomic Habits', author: 'James Clear', progress: 12 },
              ].map((book, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-300 shadow-sm">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="max-w-[120px] truncate text-sm font-semibold text-slate-800">
                        {book.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">{book.author}</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Designed for digital book lovers.
          </h2>
          <p className="mt-4 text-slate-500">
            Every tool you need to build your custom cloud reading shelf, without algorithms or
            privacy intrusions.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Secure Cloud Upload',
              desc: 'Upload PDFs safely in your secure bucket. We keep file checksums to prevent loss.',
              icon: Upload,
            },
            {
              title: 'Private Isolation',
              desc: 'Row-Level Security (RLS) ensures absolutely nobody else can access your data.',
              icon: Shield,
            },
            {
              title: 'Beautiful PDF Reader',
              desc: 'Visual reader page with bookmark sync, progress memory, page jumps, and zoom tools.',
              icon: Eye,
            },
            {
              title: 'Fluid Categories & Tags',
              desc: 'Organize files your way. Group by genre, tag collections, or label custom categories.',
              icon: BookOpen,
            },
          ].map((feat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="bg-brand-50 text-brand-600 flex h-12 w-12 items-center justify-center rounded-xl">
                <feat.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{feat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
