import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Cloud, Lock, Search, Database, Layers, Sparkles } from 'lucide-react'

const PARTICLES = [
  { width: 3, height: 3, left: '12%', top: '25%', duration: 6, delay: 0.5 },
  { width: 4, height: 4, left: '35%', top: '15%', duration: 8, delay: 1.2 },
  { width: 2, height: 2, left: '78%', top: '80%', duration: 7, delay: 2.1 },
  { width: 3, height: 3, left: '88%', top: '40%', duration: 9, delay: 0.8 },
  { width: 2, height: 2, left: '48%', top: '65%', duration: 5, delay: 1.7 },
  { width: 4, height: 4, left: '22%', top: '78%', duration: 7.5, delay: 0.2 },
  { width: 3, height: 3, left: '60%', top: '88%', duration: 6.5, delay: 1.9 },
  { width: 2, height: 2, left: '92%', top: '15%', duration: 8.5, delay: 2.5 },
  { width: 3, height: 3, left: '5%', top: '55%', duration: 7.2, delay: 0.9 },
  { width: 2, height: 2, left: '50%', top: '35%', duration: 6.8, delay: 1.1 },
  { width: 4, height: 4, left: '15%', top: '90%', duration: 9.5, delay: 0.3 },
  { width: 3, height: 3, left: '80%', top: '60%', duration: 5.8, delay: 1.5 },
]

export const AuthIllustration: React.FC = () => {
  // Feature Badges Config (AI Assistant omitted)
  const badges = [
    {
      text: 'Cloud Sync',
      icon: Cloud,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      x: '10%',
      y: '25%',
    },
    {
      text: 'Unlimited Collections',
      icon: Layers,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      x: '70%',
      y: '20%',
    },
    {
      text: 'Secure Storage',
      icon: Lock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      x: '12%',
      y: '65%',
    },
    {
      text: 'Instant Search',
      icon: Search,
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      x: '68%',
      y: '60%',
    },
    {
      text: 'Auto Backup',
      icon: Database,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      x: '45%',
      y: '15%',
    },
  ]

  // Floating background books
  const backgroundBooks = [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      color: 'from-violet-600 to-indigo-700',
      x: '18%',
      y: '42%',
      scale: 0.85,
      delay: 0.5,
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      color: 'from-indigo-650 to-cyan-700',
      x: '72%',
      y: '40%',
      scale: 0.9,
      delay: 1.8,
    },
  ]

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0A0D16] p-12 text-white select-none">
      {/* Background gradients and glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.12),transparent_50%)]" />

      {/* Moving background stars / particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        {PARTICLES.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-400"
            style={{
              width: particle.width,
              height: particle.height,
              left: particle.left,
              top: particle.top,
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Header Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-950/40 shadow-lg shadow-purple-950/50 backdrop-blur-md">
          <BookOpen className="h-5.5 w-5.5 text-purple-400" />
        </div>
        <span className="bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text font-sans text-2xl font-black tracking-tight text-transparent">
          Librovia
        </span>
      </div>

      {/* Center Interactive Animated Canvas */}
      <div className="relative z-10 my-auto flex h-[420px] w-full items-center justify-center">
        {/* Glow behind the reader portal */}
        <div className="absolute h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

        {/* Central Reader Portal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative flex h-80 w-80 items-center justify-center rounded-full border border-purple-500/10 bg-purple-950/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          {/* Animated Sync Ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-dashed border-purple-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner Interactive Reading / Book Scene */}
          <div className="relative flex flex-col items-center justify-center space-y-4">
            {/* Cloud Sync Icon */}
            <motion.div
              className="absolute -top-6 rounded-xl border border-purple-500/20 bg-purple-950/60 p-2 text-purple-400 shadow-md backdrop-blur-md"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cloud className="h-5 w-5" />
            </motion.div>

            {/* Reading / Open Book Vector Container */}
            <motion.div
              className="relative flex h-36 w-52 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/65 p-4 shadow-2xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Person Silhouette & Book reading mockup */}
              <div className="flex h-full w-full flex-col justify-between">
                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-500/30" />
                    <span className="h-2 w-2 rounded-full bg-purple-500/20" />
                  </div>
                  <span className="font-mono text-[7.5px] font-bold tracking-widest text-purple-400 uppercase">
                    SYNCING...
                  </span>
                </div>

                {/* Animated Turning Book Pages SVG */}
                <div className="relative my-2 flex justify-center">
                  <svg width="60" height="40" viewBox="0 0 60 40" className="text-purple-400">
                    {/* Left Page */}
                    <path
                      d="M 5 35 Q 20 28 30 32 L 30 8 Q 20 5 5 12 Z"
                      fill="rgba(139, 92, 246, 0.15)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    {/* Right Page */}
                    <path
                      d="M 55 35 Q 40 28 30 32 L 30 8 Q 40 5 55 12 Z"
                      fill="rgba(139, 92, 246, 0.15)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    {/* Animated Turning Page Middle overlay */}
                    <motion.path
                      d="M 30 32 L 30 8 Q 40 5 55 12 L 55 35 Q 40 28 30 32 Z"
                      fill="rgba(139, 92, 246, 0.3)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ originX: 0 }}
                      animate={{
                        scaleX: [1, -1, 1],
                        skewY: [0, -8, 0, 8, 0],
                      }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </svg>
                </div>

                {/* Simulated text lines */}
                <div className="space-y-1 pb-1">
                  <div className="h-1 w-full rounded bg-white/20" />
                  <div className="h-1 w-11/12 rounded bg-white/25" />
                  <div className="h-1 w-8/12 rounded bg-white/15" />
                </div>
              </div>
            </motion.div>

            {/* Glowing active reader indicator */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-widest text-emerald-400 uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>Active Reader</span>
            </span>
          </div>
        </motion.div>

        {/* Floating Background Books */}
        {backgroundBooks.map((book, idx) => (
          <motion.div
            key={idx}
            className={`absolute z-0 hidden w-36 items-center gap-2.5 rounded-xl border border-white/5 bg-slate-900/50 p-2.5 text-left shadow-lg backdrop-blur-md sm:flex`}
            style={{
              left: book.x,
              top: book.y,
              transform: `scale(${book.scale})`,
            }}
            animate={{
              y: [0, -12, 0],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: book.delay,
            }}
          >
            <div
              className={`flex h-10 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br ${book.color} text-[8px] font-black text-white shadow-sm`}
            >
              LIB
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black text-slate-100">{book.title}</p>
              <p className="mt-0.5 truncate text-[8px] font-bold text-slate-400">{book.author}</p>
            </div>
          </motion.div>
        ))}

        {/* Floating Feature Badges */}
        {badges.map((badge, idx) => {
          const Icon = badge.icon
          return (
            <motion.div
              key={idx}
              className={`absolute z-20 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold shadow-lg backdrop-blur-md ${badge.color}`}
              style={{
                left: badge.x,
                top: badge.y,
              }}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: idx * 0.8,
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{badge.text}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Footer Tagline and description */}
      <div className="relative z-10 max-w-lg space-y-3 text-left">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-400 uppercase">
          <Sparkles className="h-3 w-3" />
          <span>Librovia Sync Platform</span>
        </div>
        <h2 className="font-sans text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl">
          Your Digital Library,
          <br />
          Anywhere. Anytime.
        </h2>
        <p className="text-xs leading-relaxed font-bold text-indigo-200/80">
          Store, organize, read, and sync your books securely across all your devices.
        </p>
      </div>
    </div>
  )
}
export default AuthIllustration
