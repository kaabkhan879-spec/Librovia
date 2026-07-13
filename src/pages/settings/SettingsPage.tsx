import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Shield,
  BookOpen,
  Sliders,
  Bell,
  Eye,
  CreditCard,
  CheckCircle,
  Sparkles,
  Info,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../../components/common/Button'

type SettingsTab =
  | 'profile'
  | 'personal'
  | 'security'
  | 'preferences'
  | 'appearance'
  | 'notifications'
  | 'privacy'
  | 'subscription'

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isSkeletonLoading, setIsSkeletonLoading] = useState(false)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  // Account details states
  const [name, setName] = useState('Kaab Khan')
  const [email, setEmail] = useState('kaab@librovia.com')
  const [username, setUsername] = useState('kaabkhan')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Reading states
  const [defaultTheme, setDefaultTheme] = useState<'sepia' | 'dark' | 'light'>('sepia')
  const [fontSize, setFontSize] = useState('base')
  const [readingMode, setReadingMode] = useState('Continuous Scroll')
  const [pageWidth, setPageWidth] = useState('medium')
  const [autoBookmark, setAutoBookmark] = useState(true)

  // Notifications states
  const [emailNotify, setEmailNotify] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [alerts, setAlerts] = useState(false)

  // Privacy states
  const [profileVis, setProfileVis] = useState('Private')
  const [activityVis, setActivityVis] = useState(false)
  const [shareData, setShareData] = useState(true)

  const triggerAlert = (message: string) => {
    setAlertMsg(message)
    setTimeout(() => setAlertMsg(null), 3000)
  }

  const handleSimulateLoader = () => {
    setIsSkeletonLoading(true)
    setTimeout(() => {
      setIsSkeletonLoading(false)
    }, 1500)
  }

  // Sidebar items mapping
  const sidebarGroups: {
    title: string
    items: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
  }[] = [
    {
      title: 'Account Settings',
      items: [
        { id: 'profile', label: 'User Profile', icon: User },
        { id: 'personal', label: 'Personal Information', icon: Info },
        { id: 'security', label: 'Security & Sign In', icon: Shield },
      ],
    },
    {
      title: 'Reader Settings',
      items: [
        { id: 'preferences', label: 'Reading Preferences', icon: BookOpen },
        { id: 'appearance', label: 'Appearance defaults', icon: Sliders },
      ],
    },
    {
      title: 'Communications',
      items: [{ id: 'notifications', label: 'Alerts & Reminders', icon: Bell }],
    },
    {
      title: 'Privacy & Data',
      items: [{ id: 'privacy', label: 'Privacy controls', icon: Eye }],
    },
    {
      title: 'Billing Plan',
      items: [{ id: 'subscription', label: 'Plan & Subscription', icon: CreditCard }],
    },
  ]

  return (
    <div className="relative min-h-screen space-y-8 pb-20 text-left select-none">
      {/* Simulation Tools Row */}
      <div className="bg-bg-surface border-border-base flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm">
        <div className="text-text-sub flex items-center gap-2 text-xs font-semibold">
          <Info className="text-primary-500 h-4.5 w-4.5 shrink-0" />
          <span>Interactive Settings: Toggle simulated loaders below.</span>
        </div>
        <div>
          <button
            onClick={handleSimulateLoader}
            className="border-border-base bg-bg-app text-text-sub hover:bg-bg-surface cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-colors"
          >
            Simulate Settings Skeleton Loading
          </button>
        </div>
      </div>

      {/* Alert toast notifier */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-600 shadow"
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <p>{alertMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left sidebar navigation drawer */}
        <div className="bg-bg-surface border-border-base space-y-5 rounded-3xl border p-5 text-left shadow-sm lg:col-span-1">
          {sidebarGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-text-muted mb-1.5 block px-2.5 text-[8px] font-extrabold tracking-widest uppercase">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left text-xs font-semibold transition-all ${
                      activeTab === item.id
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                        : 'text-text-sub hover:bg-bg-app'
                    } `}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon
                        className={`h-4 w-4 ${activeTab === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted group-hover:text-text-main'}`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="text-text-muted h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Settings Detail pane */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {isSkeletonLoading ? (
              /* Loading Skeletons */
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-border-base bg-bg-surface h-[350px] animate-pulse rounded-3xl border p-6"
              />
            ) : (
              /* Content Tabs views */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-bg-surface border-border-base space-y-6 rounded-3xl border p-6 text-left shadow-sm sm:p-8"
              >
                {activeTab === 'profile' && (
                  /* User Profile details card */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        User Profile
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Configure how other readers see your shelf avatar.
                      </p>
                    </div>

                    <div className="border-border-base bg-bg-app/40 flex flex-col items-center gap-6 rounded-2xl border p-4 sm:flex-row">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80"
                        alt="Kaab Avatar"
                        className="ring-primary-500 h-16 w-16 rounded-full object-cover shadow ring-2"
                      />
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-text-main text-xs font-bold">Profile Photo</p>
                        <p className="text-text-muted text-[10px]">
                          JPG or PNG format with max size limits of 2MB.
                        </p>
                        <button className="text-primary-600 hover:text-primary-700 mt-1 cursor-pointer text-[10px] font-bold tracking-wider uppercase">
                          Upload New Photo
                        </button>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        triggerAlert('Profile settings updated successfully!')
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                            Username Handle
                          </label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="py-2 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Save Profile Settings
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'personal' && (
                  /* Personal Information Settings */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Personal Information
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Private variables secure from other community profiles.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        triggerAlert('Personal information updated successfully!')
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Primary Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Account Sync Mode
                        </label>
                        <div className="bg-bg-app border-border-base text-text-sub flex items-center justify-between rounded-lg border p-3 text-xs font-semibold">
                          <span>Database Replication</span>
                          <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                            Active
                          </span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="py-2 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Save Personal Info
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  /* Security Settings card */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Security & Sign In
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Manage credentials and verify sessions.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!oldPassword || !newPassword) {
                          triggerAlert('Please complete all password fields.')
                          return
                        }
                        triggerAlert('Security configurations updated successfully!')
                        setOldPassword('')
                        setNewPassword('')
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="border-border-base bg-bg-app text-text-main focus:border-primary-500 block w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="py-2 text-[10px] font-bold tracking-wider uppercase"
                      >
                        Change Password
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  /* Reading Preferences options */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Reading Preferences
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Configure default page layouts when opening documents.
                      </p>
                    </div>

                    <div className="space-y-4 font-sans text-xs">
                      {/* Reading Mode */}
                      <div className="space-y-1 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Default Layout Mode
                        </label>
                        <select
                          value={readingMode}
                          onChange={(e) => setReadingMode(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-lg border px-3 py-2 focus:outline-none"
                        >
                          <option>Continuous Scroll</option>
                          <option>Single Page View</option>
                          <option>Double Page Spread</option>
                        </select>
                      </div>

                      {/* Font size */}
                      <div className="space-y-1 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Default Font Size
                        </label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-lg border px-3 py-2 focus:outline-none"
                        >
                          <option value="sm">Small text (12px)</option>
                          <option value="base">Medium standard (14px)</option>
                          <option value="lg">Large comfort (16px)</option>
                        </select>
                      </div>

                      {/* Page Width Margins */}
                      <div className="space-y-1 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Default Page Margins
                        </label>
                        <select
                          value={pageWidth}
                          onChange={(e) => setPageWidth(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-lg border px-3 py-2 focus:outline-none"
                        >
                          <option value="narrow">Narrow Margins</option>
                          <option value="medium">Medium standard</option>
                          <option value="wide">Wide Layout</option>
                        </select>
                      </div>

                      {/* Auto bookmark toggle */}
                      <div className="border-border-light flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-text-main font-bold">Auto Bookmark</p>
                          <p className="text-text-muted text-[10px]">
                            Record bookmark tags on exit automatically.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoBookmark(!autoBookmark)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoBookmark ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoBookmark ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  /* Appearance Themes settings */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Appearance Defaults
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Choose your preferred reading canvas lighting.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {(
                        [
                          {
                            id: 'light',
                            label: 'Classic Light',
                            bg: 'bg-white',
                            text: 'text-slate-900 border-slate-200',
                          },
                          {
                            id: 'dark',
                            label: 'Midnight Dark',
                            bg: 'bg-neutral-900',
                            text: 'text-neutral-100 border-neutral-800',
                          },
                          {
                            id: 'sepia',
                            label: 'Warm Sepia',
                            bg: 'bg-[#f4ecd8]',
                            text: 'text-[#5b4636] border-[#e4dcc4]',
                          },
                        ] as const
                      ).map((themeOpt) => (
                        <button
                          key={themeOpt.id}
                          onClick={() => setDefaultTheme(themeOpt.id)}
                          className={`flex aspect-[1.2/1] cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:scale-101 ${defaultTheme === themeOpt.id ? 'ring-primary-500 border-primary-500 ring-2' : 'border-border-base'} `}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                              {themeOpt.label}
                            </span>
                            {defaultTheme === themeOpt.id && (
                              <CheckCircle className="text-primary-500 fill-primary-500/10 h-4.5 w-4.5" />
                            )}
                          </div>
                          {/* Mini page mockup */}
                          <div
                            className={`mt-4 h-10 w-full rounded border p-2 text-[8px] leading-tight ${themeOpt.bg} ${themeOpt.text}`}
                          >
                            Aa
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  /* Email & Reminder Alerts */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Alerts & Reminders
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Configure notification triggers.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Email Notifications */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-text-main text-xs font-bold">Email Digests</p>
                          <p className="text-text-muted text-[10px]">
                            Receive weekly reading achievements summary email.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailNotify(!emailNotify)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailNotify ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotify ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* Reading Reminders */}
                      <div className="border-border-light flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-text-main text-xs font-bold">Streak Alerts</p>
                          <p className="text-text-muted text-[10px]">
                            Remind me if reading streak flame is about to expire.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReminders(!reminders)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${reminders ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${reminders ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* Product Updates */}
                      <div className="border-border-light flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-text-main text-xs font-bold">Product Updates</p>
                          <p className="text-text-muted text-[10px]">
                            Notifications about new AI reader capabilities.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAlerts(!alerts)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${alerts ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alerts ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  /* Privacy & Data controls */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Privacy Controls
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Manage who see your readings statistics.
                      </p>
                    </div>

                    <div className="space-y-4 font-sans text-xs">
                      {/* Profile Visibility */}
                      <div className="space-y-1 text-left">
                        <label className="text-text-sub text-[10px] font-bold tracking-wider uppercase">
                          Profile Shelf Visibility
                        </label>
                        <select
                          value={profileVis}
                          onChange={(e) => setProfileVis(e.target.value)}
                          className="border-border-base bg-bg-app focus:border-primary-500 block w-full cursor-pointer rounded-lg border px-3 py-2 focus:outline-none"
                        >
                          <option>Private (Only Me)</option>
                          <option>Members Only (Authenticated Users)</option>
                          <option>Public (Visible on Web)</option>
                        </select>
                      </div>

                      {/* Activity Sharing Toggle */}
                      <div className="border-border-light flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-text-main font-bold">Reading Activity Sharing</p>
                          <p className="text-text-muted text-[10px]">
                            List recently read book names inside public forums.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivityVis(!activityVis)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${activityVis ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${activityVis ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* Anonymous telemetry */}
                      <div className="border-border-light flex items-center justify-between border-t pt-4">
                        <div>
                          <p className="text-text-main font-bold">Anonymous Telemetry</p>
                          <p className="text-text-muted text-[10px]">
                            Share performance logs to improve reading speed.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShareData(!shareData)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${shareData ? 'bg-primary-600' : 'bg-slate-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${shareData ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'subscription' && (
                  /* Subscription billing panel */
                  <div className="space-y-6">
                    <div className="border-border-light border-b pb-3">
                      <h3 className="text-text-main text-sm font-bold tracking-wider uppercase">
                        Plan & Subscription
                      </h3>
                      <p className="text-text-muted text-[10px]">
                        Configure billing details and invoices.
                      </p>
                    </div>

                    <div className="border-primary-200 from-primary-600 relative space-y-4 overflow-hidden rounded-2xl border bg-gradient-to-br to-indigo-700 p-6 text-white shadow-lg">
                      {/* Sparkle graphics */}
                      <div className="absolute top-4 right-4 shrink-0 text-white/10">
                        <Sparkles className="h-20 w-20" />
                      </div>

                      <div className="space-y-1">
                        <span className="inline-block rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-white uppercase">
                          Active
                        </span>
                        <h4 className="text-lg font-bold">Pro Reader Plan</h4>
                        <p className="text-[11px] text-white/80">
                          $9.99 billed monthly (Renews Oct 15, 2026)
                        </p>
                      </div>

                      <div className="space-y-2 border-t border-white/10 pt-4 text-xs">
                        <p className="font-bold">Plan Features Includes:</p>
                        <div className="grid grid-cols-1 gap-2 text-[10px] text-white/95 sm:grid-cols-2">
                          <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            <span>Unlimited PDF & EPUB space cabinet</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            <span>AI reading assistant summarizer</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            <span>Full-text vector catalog searching</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            <span>Custom aesthetic themes overrides</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button className="text-primary-700 cursor-pointer rounded-lg bg-white px-4 py-2 text-[10px] font-bold tracking-wider uppercase hover:bg-white/90">
                          Manage Billing
                        </button>
                        <button className="cursor-pointer rounded-lg border border-white/30 px-4 py-2 text-[10px] font-bold tracking-wider text-white uppercase hover:bg-white/10">
                          Compare Plans
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
