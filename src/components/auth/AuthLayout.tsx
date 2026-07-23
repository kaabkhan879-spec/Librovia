import React from 'react'
import { AnimationPlaceholder } from './AnimationPlaceholder'
import { motion } from 'framer-motion'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#0B0F19] font-sans text-[#FFFFFF] select-none">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.15),transparent_70%)]" />

      {/* Left side: Premium Cinematic Showcase (60% Width, hidden on mobile/tablet) */}
      <div className="relative hidden h-screen shrink-0 border-r border-[#1E293B]/60 lg:block lg:w-[60%] xl:w-[60%]">
        <AnimationPlaceholder />
      </div>

      {/* Right side: Authentication Card centering space (40% Width) */}
      <div className="relative flex h-screen flex-1 items-center justify-center overflow-y-auto bg-[#0B0F19]/40 p-4 sm:p-8 lg:w-[40%] lg:p-12 xl:w-[40%]">
        {/* Subtle background glow for authentication canvas */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/5 blur-3xl select-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
export default AuthLayout
