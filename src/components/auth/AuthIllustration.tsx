import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Cloud, Sparkles } from 'lucide-react'

export const AuthIllustration: React.FC = () => {
  return (
    <div className="from-primary-700 relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-tr via-indigo-800 to-indigo-900 p-12 text-white select-none">
      {/* Background glow layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]" />

      {/* Header Logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-md backdrop-blur">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="font-sans text-xl font-extrabold tracking-tight">Librovia</span>
      </div>

      {/* Center Mockup & Floating Cards */}
      <div className="relative z-10 my-auto flex min-h-[340px] items-center justify-center">
        {/* Main Mockup Screen container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative aspect-[0.7/1] w-72 rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-2xl backdrop-blur-md"
        >
          {/* Mockup screen inside details */}
          <div className="flex h-full flex-col justify-between rounded-xl border border-white/5 bg-slate-950/40 p-4 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="h-3 w-16 rounded bg-white/10" />
              <Cloud className="h-4 w-4 text-indigo-300" />
            </div>

            <div className="my-4 flex flex-1 flex-col justify-center space-y-3">
              <div className="h-2.5 w-11/12 rounded bg-white/20" />
              <div className="h-2.5 w-10/12 rounded bg-white/20" />
              <div className="h-2.5 w-8/12 rounded bg-white/15" />
            </div>

            <div className="flex h-7 w-full items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[10px] font-bold tracking-wider uppercase">
              Reading Active
            </div>
          </div>
        </motion.div>

        {/* Floating Book Card 1 */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[15%] left-[-20px] flex w-40 items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 text-left shadow-lg backdrop-blur-lg"
        >
          <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-indigo-500 text-[8px] font-bold text-white shadow-sm">
            Book
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold">Atomic Habits</p>
            <p className="mt-0.5 truncate text-[8px] text-indigo-200">James Clear</p>
          </div>
        </motion.div>

        {/* Floating Cloud Card 2 */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute right-[-20px] bottom-[15%] flex w-40 items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 text-left shadow-lg backdrop-blur-lg"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white shadow-sm">
            <Cloud className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold">Cloud Synced</p>
            <p className="mt-0.5 text-[8px] text-cyan-200">Auto-saved</p>
          </div>
        </motion.div>
      </div>

      {/* Footer Tagline */}
      <div className="relative z-10 space-y-2 text-left">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
          <Sparkles className="h-3 w-3" />
          Secure Reader Namespace
        </div>
        <h4 className="font-sans text-xl font-bold tracking-tight">
          "Your entire digital bookshelf, locked behind client-isolated keys."
        </h4>
        <p className="text-xs text-indigo-200">
          Librovia ensures your document collection is 100% private to your account.
        </p>
      </div>
    </div>
  )
}
