import React from 'react'
import { motion } from 'framer-motion'
import { Cloud, Lock, Search, Database, Layers, Sparkles, Play } from 'lucide-react'

interface AnimationPlaceholderProps {
  videoUrl?: string
  lottieUrl?: string
  riveUrl?: string
  previewImage?: string
}

const PARTICLES = [
  { width: 3, height: 3, left: '15%', top: '20%', duration: 7, delay: 0.2 },
  { width: 4, height: 4, left: '38%', top: '12%', duration: 9, delay: 1.0 },
  { width: 2, height: 2, left: '80%', top: '75%', duration: 8, delay: 2.5 },
  { width: 3, height: 3, left: '85%', top: '45%', duration: 10, delay: 0.6 },
  { width: 2, height: 2, left: '50%', top: '60%', duration: 6, delay: 1.5 },
  { width: 4, height: 4, left: '25%', top: '80%', duration: 8.5, delay: 0.1 },
  { width: 3, height: 3, left: '62%', top: '85%', duration: 7.5, delay: 1.8 },
]

export const AnimationPlaceholder: React.FC<AnimationPlaceholderProps> = ({
  videoUrl,
  previewImage = '/assets/cozy_library_reading.png',
}) => {
  // Floating badges config
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

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#0A0D16] p-12 text-white select-none">
      {/* 1. Cinematic Background Layer */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
          aria-hidden="true"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
          {/* Static high-fidelity preview image loaded as background cover */}
          <img
            src={previewImage}
            alt="Cozy Cinematic Library Preview"
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-60 mix-blend-lighten"
            loading="lazy"
          />
          {/* Volumetric Purple lighting overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0D16] via-[#1A0B2E]/60 to-[#0A0D16] mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.22),transparent_70%)]" />
        </div>
      )}

      {/* 2. Light Rays / Volumetric Glow (Framer Motion looping path) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          className="absolute top-0 left-0 fill-current text-purple-400/20"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path d="M 150 0 L 300 0 L 500 600 L 250 600 Z" />
          <path d="M 450 0 L 580 0 L 750 600 L 550 600 Z" />
        </motion.svg>
      </div>

      {/* 3. Tiny Floating Glowing Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
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
              y: [0, -35, 0],
              opacity: [0.3, 0.9, 0.3],
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

      {/* Top Banner Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-900/40 px-3 py-1 text-[9.5px] font-black tracking-widest text-purple-300 uppercase backdrop-blur-md">
          <Play className="h-3 w-3 animate-pulse text-purple-400" />
          <span>Cinematic Showcase</span>
        </span>
      </div>

      {/* 4. Floating Feature Badges */}
      <div className="pointer-events-none absolute inset-0">
        {badges.map((badge, idx) => {
          const Icon = badge.icon
          return (
            <motion.div
              key={idx}
              className={`absolute z-20 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold shadow-lg backdrop-blur-md ${badge.color}`}
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

      {/* 5. Footer Content */}
      <div className="relative z-10 max-w-lg space-y-3.5 text-left">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-purple-400 uppercase">
          <Sparkles className="h-3 w-3" />
          <span>Librovia Sync Platform</span>
        </div>
        <h2 className="font-sans text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl">
          Your Digital Library.
          <br />
          Anywhere. Anytime.
        </h2>
        <p className="text-xs leading-relaxed font-bold text-indigo-200/80">
          Store, organize, read and sync your books securely across all your devices.
        </p>
      </div>
    </div>
  )
}
export default AnimationPlaceholder
