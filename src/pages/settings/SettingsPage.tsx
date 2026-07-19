import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { booksService, type Book } from '../../services/books'
import { collectionsService, type Collection } from '../../services/collections'
import { supabase } from '../../services/supabase'
import { ROUTES } from '../../constants/routes'
import { formatBytes } from '../../utils/helpers'
import { Button } from '../../components/common/Button'
import { Toggle } from '../../components/common/Toggle'
import {
  User as UserIcon,
  Shield,
  Sliders,
  Bell,
  HardDrive,
  Info,
  LogOut,
  Camera,
  Trash2,
  Lock,
  Mail,
  Smartphone,
  History,
  CheckCircle2,
  Sparkles,
  Database,
  Download,
  X,
  FileText,
  HelpCircle,
  Code2,
  AlertTriangle,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

type SettingsTab = 'profile' | 'security' | 'appearance' | 'notifications' | 'storage' | 'about'

interface ReaderPreferences {
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
  readingWidth: 'narrow' | 'medium' | 'wide' | 'full'
  smoothAnimations: boolean
}

interface NotificationPreferences {
  readingReminder: boolean
  uploadComplete: boolean
  aiNotifications: boolean
  productUpdates: boolean
}

export const SettingsPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isUpdating, setIsUpdating] = useState(false)

  // ----------------------------------------------------
  // SECTION 1 — PROFILE STATES
  // ----------------------------------------------------
  const [displayName, setDisplayName] = useState(user?.displayName || 'Kaab Khan')
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
  )
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(displayName)

  const [prevUserId, setPrevUserId] = useState(user?.id)

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id)
    if (user.displayName) setDisplayName(user.displayName)
    if (user.avatarUrl) setAvatarUrl(user.avatarUrl)
  }

  // ----------------------------------------------------
  // SECTION 2 — SECURITY STATES
  // ----------------------------------------------------
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState(user?.email || '')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)

  // ----------------------------------------------------
  // SECTION 3 — APPEARANCE STATES
  // ----------------------------------------------------
  const [themeMode, setThemeMode] = useLocalStorage<'light' | 'dark' | 'system'>(
    'librovia_theme_mode',
    'system'
  )

  const [readerPrefs, setReaderPrefs] = useLocalStorage<ReaderPreferences>(
    'librovia_reader_preferences',
    {
      fontSize: 'base',
      readingWidth: 'medium',
      smoothAnimations: true,
    }
  )

  // Handle Theme switching logic
  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('librovia-theme', 'dark')
    } else if (themeMode === 'light') {
      root.classList.remove('dark')
      localStorage.setItem('librovia-theme', 'light')
    } else {
      // System mode preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      localStorage.removeItem('librovia-theme')
    }
  }, [themeMode])

  // ----------------------------------------------------
  // SECTION 4 — NOTIFICATIONS STATES
  // ----------------------------------------------------
  const [notifPrefs, setNotifPrefs] = useLocalStorage<NotificationPreferences>(
    'librovia_notification_preferences',
    {
      readingReminder: true,
      uploadComplete: true,
      aiNotifications: true,
      productUpdates: false,
    }
  )

  // ----------------------------------------------------
  // SECTION 5 — STORAGE STATES
  // ----------------------------------------------------
  const [books, setBooks] = useState<Book[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [storageLoading, setStorageLoading] = useState(true)

  useEffect(() => {
    Promise.all([booksService.getBooks(), collectionsService.getCollections()])
      .then(([booksData, colsData]) => {
        setBooks(booksData)
        setCollections(colsData)
        setStorageLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load storage details:', err)
        setStorageLoading(false)
      })
  }, [])

  const totalUsedBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.fileSize || 0), 0)
  }, [books])

  const maxStorageLimitBytes = 1073741824 // 1 GB allocation limit
  const storagePercentage = useMemo(() => {
    return Math.min(100, Math.round((totalUsedBytes / maxStorageLimitBytes) * 100))
  }, [totalUsedBytes])

  const cacheSizeStr = useMemo(() => {
    try {
      let total = 0
      for (const x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
          total += (localStorage[x].length + x.length) * 2
        }
      }
      return formatBytes(total || 3584000)
    } catch {
      return '3.5 MB'
    }
  }, [])

  // ----------------------------------------------------
  // SECTION 6 & 7 — MODALS & LOGOUT
  // ----------------------------------------------------
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [activeModal, setActiveModal] = useState<
    'privacy' | 'terms' | 'support' | 'licenses' | null
  >(null)

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleSaveProfileName = async () => {
    if (!editName.trim()) {
      showError('Display name cannot be empty')
      return
    }
    setIsUpdating(true)
    try {
      await updateProfile({ displayName: editName.trim() })
      setDisplayName(editName.trim())
      setIsEditingProfile(false)
      showSuccess('Profile display name updated successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update display name'
      showError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size exceeds 5MB limit.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const result = event.target?.result as string
      if (result) {
        setIsUpdating(true)
        try {
          await updateProfile({ avatarUrl: result })
          setAvatarUrl(result)
          showSuccess('Profile picture updated successfully!')
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to update profile picture'
          showError(message)
        } finally {
          setIsUpdating(false)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    const defaultAvatar =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    setIsUpdating(true)
    try {
      await updateProfile({ avatarUrl: defaultAvatar })
      setAvatarUrl(defaultAvatar)
      showSuccess('Profile picture removed')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove picture'
      showError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('New password and confirmation do not match.')
      return
    }
    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      showError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newEmail.includes('@')) {
      showError('Please enter a valid email address.')
      return
    }
    setIsChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      showSuccess('Confirmation email sent to new address! Please verify to complete.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change email'
      showError(message)
    } finally {
      setIsChangingEmail(false)
    }
  }

  const handleClearCache = () => {
    try {
      // Clear non-essential items
      const keysToKeep = [
        'librovia_theme_mode',
        'librovia-theme',
        'librovia_reader_preferences',
        'librovia_notification_preferences',
        'sb-ap-south-1-auth-token',
      ]
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.some((k) => key.includes(k))) {
          localStorage.removeItem(key)
        }
      })
      showSuccess('Application cache cleared successfully!')
    } catch {
      showError('Could not clear application cache.')
    }
  }

  const handleConfirmLogout = async () => {
    try {
      setShowLogoutModal(false)
      await logout()
      showInfo('You have logged out.')
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error logging out'
      showError(message)
    }
  }

  // ----------------------------------------------------
  // NAVIGATION MENU GROUPS
  // ----------------------------------------------------
  const tabs: {
    id: SettingsTab
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      id: 'profile',
      label: 'Profile',
      description: 'Display name & picture',
      icon: UserIcon,
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Password, email & 2FA',
      icon: Shield,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Theme & reader choices',
      icon: Sliders,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Alerts & updates',
      icon: Bell,
    },
    {
      id: 'storage',
      label: 'Storage',
      description: 'Cloud space & cache',
      icon: HardDrive,
    },
    {
      id: 'about',
      label: 'About',
      description: 'Version, legal & help',
      icon: Info,
    },
  ]

  return (
    <PageWrapper className="relative min-h-screen space-y-8 pb-24 text-left select-none">
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleAvatarFileUpload}
      />

      {/* Main Settings Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Account & Settings
          </h1>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            Manage your personal profile, security credentials, appearance, and library storage.
          </p>
        </div>
      </div>

      {/* Settings Grid Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left Navigation Sidebar */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-xs lg:col-span-1 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            <span className="mb-2 block px-3 text-[9px] font-extrabold tracking-widest text-slate-400 uppercase">
              Settings Navigation
            </span>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex w-full cursor-pointer items-center justify-between rounded-2xl p-3 text-left transition-all ${
                      isActive
                        ? 'text-purple-650 bg-purple-50 shadow-2xs dark:bg-purple-950/30 dark:text-purple-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        <tab.icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold">{tab.label}</span>
                        <span className="block text-[9.5px] font-medium text-slate-400">
                          {tab.description}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <motion.div
                        layoutId="tab-active-indicator"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="h-2 w-2 rounded-full bg-purple-600"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Content Pane */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* ======================================================== */}
              {/* SECTION 1 — PROFILE */}
              {/* ======================================================== */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Profile Center
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage your public identity, display name, and avatar picture.
                    </p>
                  </div>

                  {/* Top Profile Card */}
                  <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50/70 via-white to-slate-50 p-6 shadow-xs dark:border-purple-950/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col items-center gap-5 sm:flex-row">
                        {/* Circular Profile Picture */}
                        <div className="group relative">
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md dark:border-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            title="Change photo"
                          >
                            <Camera className="h-6 w-6" />
                          </button>
                        </div>

                        <div className="space-y-1 text-center sm:text-left">
                          <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                              {displayName}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              <Sparkles className="h-3 w-3" /> Pro Member
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {user?.email || 'kaab@librovia.com'}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            ID: {user?.id || 'usr_849204829'}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setEditName(displayName)
                          setIsEditingProfile(!isEditingProfile)
                        }}
                        className="rounded-xl"
                      >
                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                      </Button>
                    </div>

                    {/* Inline Profile Editor */}
                    <AnimatePresence>
                      {isEditingProfile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 border-t border-purple-100/60 pt-6 dark:border-slate-800"
                        >
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="Enter full name"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              <Button
                                size="sm"
                                onClick={handleSaveProfileName}
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Saving...' : 'Save Display Name'}
                              </Button>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Camera className="h-3.5 w-3.5 text-purple-600" />
                                <span>Upload New Picture</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-950/40 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove Picture</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Quick Settings Details */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Account Verification
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Supabase Authenticated
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                      <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Member Since
                      </span>
                      <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {new Date().toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 2 — SECURITY */}
              {/* ======================================================== */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Security & Authentication
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update login passcodes, change primary email, and view active sessions.
                    </p>
                  </div>

                  {/* Change Password Form */}
                  <form
                    onSubmit={handleChangePasswordSubmit}
                    className="space-y-4 rounded-3xl border border-slate-200/70 p-5 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase dark:text-white">
                      <Lock className="h-4 w-4 text-purple-600" />
                      <span>Change Password</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                        />
                      </div>
                    </div>

                    <Button type="submit" size="sm" disabled={isChangingPassword}>
                      {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </form>

                  {/* Change Email Form */}
                  <form
                    onSubmit={handleChangeEmailSubmit}
                    className="space-y-4 rounded-3xl border border-slate-200/70 p-5 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase dark:text-white">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span>Change Registered Email</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="newemail@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                      />
                    </div>

                    <Button type="submit" size="sm" disabled={isChangingEmail}>
                      {isChangingEmail ? 'Updating Email...' : 'Update Email Address'}
                    </Button>
                  </form>

                  {/* Future Placeholders */}
                  <div className="space-y-3 pt-2">
                    <span className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                      Advanced Security (Coming Soon)
                    </span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 opacity-75 dark:border-slate-800 dark:bg-slate-800/20">
                        <div className="flex items-center justify-between">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[8px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Coming Soon
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Two-Factor Auth (2FA)
                          </span>
                          <span className="block text-[9.5px] text-slate-400">
                            Authenticator app TOTP
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 opacity-75 dark:border-slate-800 dark:bg-slate-800/20">
                        <div className="flex items-center justify-between">
                          <Monitor className="h-4 w-4 text-slate-400" />
                          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[8px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Coming Soon
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Active Devices
                          </span>
                          <span className="block text-[9.5px] text-slate-400">
                            Session management
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 opacity-75 dark:border-slate-800 dark:bg-slate-800/20">
                        <div className="flex items-center justify-between">
                          <History className="h-4 w-4 text-slate-400" />
                          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[8px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Coming Soon
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Login History
                          </span>
                          <span className="block text-[9.5px] text-slate-400">
                            Audit security logs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 3 — APPEARANCE */}
              {/* ======================================================== */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Appearance & Reader Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Customize dark/light theme options and reading defaults.
                    </p>
                  </div>

                  {/* Theme Mode Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Application Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map((t) => {
                        const isSelected = themeMode === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setThemeMode(t.id as 'light' | 'dark' | 'system')}
                            className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all ${
                              isSelected
                                ? 'text-purple-650 border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 dark:bg-purple-950/30 dark:text-purple-400'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
                            }`}
                          >
                            <t.icon className="h-5 w-5" />
                            <span className="text-xs font-bold">{t.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Reader Preferences Controls */}
                  <div className="space-y-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                      Reader Display Defaults
                    </h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Font Size
                        </label>
                        <select
                          value={readerPrefs.fontSize}
                          onChange={(e) =>
                            setReaderPrefs({
                              ...readerPrefs,
                              fontSize: e.target.value as ReaderPreferences['fontSize'],
                            })
                          }
                          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <option value="sm">Small (12px)</option>
                          <option value="base">Medium (14px - Default)</option>
                          <option value="lg">Large (16px)</option>
                          <option value="xl">Extra Large (18px)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Reading Width
                        </label>
                        <select
                          value={readerPrefs.readingWidth}
                          onChange={(e) =>
                            setReaderPrefs({
                              ...readerPrefs,
                              readingWidth: e.target.value as ReaderPreferences['readingWidth'],
                            })
                          }
                          className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <option value="narrow">Narrow (Comfortable reading)</option>
                          <option value="medium">Medium (Standard)</option>
                          <option value="wide">Wide (Expanded canvas)</option>
                          <option value="full">Full Screen Width</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Smooth Page Animations
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Enable smooth transitions and page flip motions
                        </span>
                      </div>
                      <Toggle
                        checked={readerPrefs.smoothAnimations}
                        onChange={(checked) =>
                          setReaderPrefs({
                            ...readerPrefs,
                            smoothAnimations: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 4 — NOTIFICATIONS */}
              {/* ======================================================== */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Notifications & Reminders
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Control which notifications and alerts you receive.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'readingReminder' as const,
                        label: 'Reading Reminders',
                        desc: 'Daily gentle notifications to keep your reading streak active',
                      },
                      {
                        key: 'uploadComplete' as const,
                        label: 'Upload Complete Alerts',
                        desc: 'Receive alerts when your PDF book parsing & cover generation finish',
                      },
                      {
                        key: 'aiNotifications' as const,
                        label: 'AI Reading Assistant Updates',
                        desc: 'Get notified when AI summaries and flashcards are generated',
                      },
                      {
                        key: 'productUpdates' as const,
                        label: 'Product Updates & News',
                        desc: 'Occasional announcements about new features in Librovia',
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800/80 ${
                          idx > 0 ? 'mt-2' : ''
                        }`}
                      >
                        <div>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-400">{item.desc}</span>
                        </div>
                        <Toggle
                          checked={notifPrefs[item.key]}
                          onChange={(val) => {
                            setNotifPrefs({
                              ...notifPrefs,
                              [item.key]: val,
                            })
                            showSuccess(`${item.label} ${val ? 'enabled' : 'disabled'}`)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 5 — STORAGE */}
              {/* ======================================================== */}
              {activeTab === 'storage' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Storage & Cloud Usage
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Monitor your library storage, books count, and cache memory.
                    </p>
                  </div>

                  {/* Storage Meter Card */}
                  <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-xs">
                          <Database className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                            Cloud Storage Used
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {formatBytes(totalUsedBytes)}{' '}
                            <span className="text-xs font-medium text-slate-400">
                              / {formatBytes(maxStorageLimitBytes)}
                            </span>
                          </h3>
                        </div>
                      </div>

                      <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                        {storagePercentage}% Capacity
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${storagePercentage}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-purple-600"
                      />
                    </div>
                  </div>

                  {/* Storage Details Cards */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                      <span className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Books Count
                      </span>
                      <span className="mt-1 block text-lg font-black text-slate-900 dark:text-white">
                        {storageLoading ? '...' : books.length}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                      <span className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Collections
                      </span>
                      <span className="mt-1 block text-lg font-black text-slate-900 dark:text-white">
                        {storageLoading ? '...' : collections.length}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                      <span className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Cache Size
                      </span>
                      <span className="mt-1 block text-lg font-black text-slate-900 dark:text-white">
                        {cacheSizeStr}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 opacity-75 dark:border-slate-800">
                      <span className="block text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Offline Downloads
                      </span>
                      <span className="mt-1 block text-xs font-bold text-purple-600 dark:text-purple-400">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  {/* Storage Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={handleClearCache}
                      className="rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
                      <span>Clear Application Cache</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() =>
                        showInfo('Offline downloads manager will be released in Phase 5!')
                      }
                      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Manage Downloads (Coming Soon)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 6 — ABOUT */}
              {/* ======================================================== */}
              {activeTab === 'about' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      About Librovia
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Application metadata, legal terms, and support info.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-white shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black">Librovia Pro</h3>
                        <span className="text-xs font-medium text-purple-200">
                          App Version v1.4.0 (Build 2026.7)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal('privacy')}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4.5 w-4.5 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Privacy Policy
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('terms')}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4.5 w-4.5 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Terms & Conditions
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('support')}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-4.5 w-4.5 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Contact Support
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModal('licenses')}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Code2 className="h-4.5 w-4.5 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Open Source Licenses
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 7 — LOGOUT CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Sign Out Confirmation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to log out?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleConfirmLogout}
                  className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                >
                  Logout
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* INFORMATIONAL LEGAL MODALS */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms & Conditions'}
                  {activeModal === 'support' && 'Contact Support'}
                  {activeModal === 'licenses' && 'Open Source Licenses'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {activeModal === 'privacy' && (
                  <>
                    <p>
                      At <strong>Librovia</strong>, we respect your digital privacy. All library
                      document files, personal annotations, highlights, and flashcards are encrypted
                      and bound strictly to your Supabase account.
                    </p>
                    <p>
                      We do not share your reading metrics or uploaded book contents with third
                      parties.
                    </p>
                  </>
                )}

                {activeModal === 'terms' && (
                  <>
                    <p>
                      By accessing Librovia Digital Library, you agree to store only legally
                      acquired e-books and PDF files.
                    </p>
                    <p>
                      Librovia reserves the right to manage workspace cloud allocations in
                      accordance with your account subscription plan limits.
                    </p>
                  </>
                )}

                {activeModal === 'support' && (
                  <>
                    <p>
                      Need help or discovered a bug? Our dedicated engineering team is here for you.
                    </p>
                    <div className="rounded-xl bg-purple-50 p-3 text-purple-900 dark:bg-purple-950/30 dark:text-purple-200">
                      <strong>Support Email:</strong> support@librovia.com
                    </div>
                  </>
                )}

                {activeModal === 'licenses' && (
                  <div className="space-y-2">
                    <p>Librovia is built using modern open source technologies:</p>
                    <ul className="list-disc space-y-1 pl-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <li>React (MIT License)</li>
                      <li>Supabase JavaScript SDK (Apache-2.0)</li>
                      <li>TailwindCSS (MIT License)</li>
                      <li>Framer Motion (MIT License)</li>
                      <li>Lucide React (ISC License)</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button size="sm" onClick={() => setActiveModal(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
