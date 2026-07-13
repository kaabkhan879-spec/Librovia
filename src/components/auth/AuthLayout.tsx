import React from 'react'
import { AuthIllustration } from './AuthIllustration'
import { motion } from 'framer-motion'

export interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="bg-bg-app flex min-h-screen w-full select-none">
      {/* Left side: Premium Illustration (Hidden on mobile/tablet, visible on lg screens) */}
      <div className="hidden shrink-0 lg:block lg:w-[45%] xl:w-[40%]">
        <AuthIllustration />
      </div>

      {/* Right side: Authentication Card centering space */}
      <div className="bg-bg-app relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8 lg:p-12">
        {/* Subtle background glow for authentication canvas */}
        <div className="bg-primary-600/5 pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl select-none" />

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
