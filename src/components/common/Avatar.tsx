/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'

export interface AvatarProps {
  src?: string | null
  name?: string
  email?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showCameraOverlay?: boolean
  onCameraClick?: () => void
  isLoading?: boolean
}

export const getInitials = (name?: string, email?: string): string => {
  if (name && name.trim()) {
    const cleanName = name.trim()
    const parts = cleanName.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    if (cleanName.length >= 2) {
      return cleanName.slice(0, 2).toUpperCase()
    }
    return cleanName[0].toUpperCase()
  }
  if (email && email.trim()) {
    const handle = email.trim().split('@')[0]
    if (handle.length >= 2) {
      return handle.slice(0, 2).toUpperCase()
    }
    return handle[0].toUpperCase()
  }
  return 'LK'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  email,
  size = 'md',
  className = '',
  showCameraOverlay = false,
  onCameraClick,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false)

  // Size mapping
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-2xl',
  }

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const initials = getInitials(name, email)
  const isDefaultUnsplash =
    src && src.includes('images.unsplash.com') && src.includes('photo-1534528741775-53994a69daeb')

  const hasValidCustomPhoto = src && src.trim() !== '' && !isDefaultUnsplash && !imageError

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none ${
        sizeClasses[size]
      } ${className}`}
    >
      {hasValidCustomPhoto ? (
        <img
          src={src}
          alt={name || 'User Avatar'}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
        />
      ) : (
        /* Initials Avatar with Purple Gradient */
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white shadow-md ring-2 ring-purple-500/20">
          <span className="font-sans font-extrabold tracking-wider">{initials}</span>
        </div>
      )}

      {/* Loading overlay spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/50 backdrop-blur-xs">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* Camera overlay on hover/click */}
      {showCameraOverlay && !isLoading && (
        <button
          type="button"
          onClick={onCameraClick}
          aria-label="Change profile picture"
          className="group absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-950/40 text-white opacity-0 transition-opacity duration-200 hover:opacity-100 focus:opacity-100 focus:outline-none"
        >
          <Camera
            className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-110`}
          />
        </button>
      )}
    </motion.div>
  )
}
